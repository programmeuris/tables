import { useCallback, useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";

import { Numpad } from "@/components/Numpad";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addSubmission, getAllSubmissions, type Submission } from "@/lib/db";
import {
  exerciseKey,
  pickNextExercise,
  type Exercise,
} from "@/lib/exercises";

const MAX_INPUT_LENGTH = 3;

interface Feedback {
  correct: boolean;
  answer: number;
}

export default function App() {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // Full submission history, kept in a ref so the biased picker always sees the
  // latest data without forcing re-renders.
  const historyRef = useRef<Submission[]>([]);
  // When the current exercise was first shown (performance.now()).
  const startTimeRef = useRef<number | null>(null);
  const feedbackTimer = useRef<number | null>(null);

  // Load stored submissions once so the very first pick can already be biased.
  useEffect(() => {
    let active = true;
    getAllSubmissions()
      .then((rows) => {
        if (active) historyRef.current = rows;
      })
      .catch(() => {
        /* Nothing stored yet, or IndexedDB unavailable — start fresh. */
      });
    return () => {
      active = false;
    };
  }, []);

  // Reset to the empty state whenever the page is hidden. Returning to the page
  // then requires pressing "=" again, guaranteeing the timer starts clean and
  // an abandoned exercise is never counted.
  useEffect(() => {
    function reset() {
      if (document.visibilityState === "hidden") {
        setExercise(null);
        setInput("");
        setFeedback(null);
        startTimeRef.current = null;
      }
    }
    document.addEventListener("visibilitychange", reset);
    return () => document.removeEventListener("visibilitychange", reset);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    };
  }, []);

  const startExercise = useCallback((previousKey?: string) => {
    const next = pickNextExercise(historyRef.current, previousKey);
    setExercise(next);
    setInput("");
    startTimeRef.current = performance.now();
  }, []);

  const showFeedback = useCallback((next: Feedback) => {
    setFeedback(next);
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 1200);
  }, []);

  const handleSubmit = useCallback(() => {
    // First press (or after returning to the page): reveal the first exercise
    // without recording anything.
    if (!exercise || startTimeRef.current === null) {
      setFeedback(null);
      startExercise();
      return;
    }

    // Ignore an empty submission so a stray "=" doesn't score a wrong answer.
    if (input.length === 0) return;

    const given = Number(input);
    const answer = exercise.a * exercise.b;
    const correct = given === answer;
    const durationMs = performance.now() - startTimeRef.current;

    const submission: Submission = {
      a: exercise.a,
      b: exercise.b,
      answer,
      given,
      correct,
      durationMs,
      timestamp: Date.now(),
    };
    historyRef.current = [...historyRef.current, submission];
    void addSubmission(submission);

    showFeedback({ correct, answer });
    startExercise(exerciseKey(exercise.a, exercise.b));
  }, [exercise, input, startExercise, showFeedback]);

  const handleDigit = useCallback(
    (digit: number) => {
      if (!exercise) return;
      setFeedback(null);
      setInput((prev) =>
        prev.length >= MAX_INPUT_LENGTH ? prev : prev + String(digit)
      );
    },
    [exercise]
  );

  const handleBackspace = useCallback(() => {
    setInput((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => setInput(""), []);

  // Physical keyboard support for convenience on desktop.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key >= "0" && event.key <= "9") {
        handleDigit(Number(event.key));
      } else if (event.key === "Backspace") {
        handleBackspace();
      } else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        handleSubmit();
      } else if (event.key === "Escape") {
        handleClear();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDigit, handleBackspace, handleSubmit, handleClear]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-center text-sm font-medium text-muted-foreground">
            Multiplication Tables
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex h-14 items-center justify-center">
            {exercise ? (
              <p
                className="text-4xl font-bold tabular-nums"
                aria-live="polite"
              >
                {exercise.a} &times; {exercise.b}
              </p>
            ) : (
              <p className="text-center text-base text-muted-foreground">
                Press = to start
              </p>
            )}
          </div>

          {/* Feedback for the previous answer; fixed height avoids layout shift. */}
          <div
            className="flex h-6 items-center justify-center text-sm font-medium"
            aria-live="polite"
          >
            {feedback &&
              (feedback.correct ? (
                <span className="flex items-center gap-1 text-green-500">
                  <Check className="size-4" /> Correct
                </span>
              ) : (
                <span className="flex items-center gap-1 text-destructive">
                  <X className="size-4" /> Answer: {feedback.answer}
                </span>
              ))}
          </div>

          <Input
            readOnly
            inputMode="none"
            value={input}
            placeholder="0"
            aria-label="Your answer"
            className="h-16 bg-muted/40 text-right font-mono !text-4xl tabular-nums"
          />

          <Numpad
            onDigit={handleDigit}
            onClear={handleClear}
            onBackspace={handleBackspace}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </main>
  );
}
