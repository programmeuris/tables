import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CircleStop, X } from "lucide-react";

import { Numpad } from "@/components/Numpad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, haptic } from "@/lib/utils";
import { addSubmission, getAllSubmissions, type Submission } from "@/lib/db";
import {
  exerciseKey,
  pickNextExercise,
  type Exercise,
} from "@/lib/exercises";

const MAX_INPUT_LENGTH = 3;

// Haptic patterns (ms). A plain tap for key presses, a short pulse for a
// correct answer, and a stronger double-buzz for a wrong one.
const TAP = 10;
const CORRECT_BUZZ = 18;
const WRONG_BUZZ = [25, 40, 25];

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
      haptic(TAP);
      setFeedback(null);
      startExercise();
      return;
    }

    // Ignore an empty submission so a stray "=" doesn't score a wrong answer.
    if (input.length === 0) {
      haptic(TAP);
      return;
    }

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

    haptic(correct ? CORRECT_BUZZ : WRONG_BUZZ);
    showFeedback({ correct, answer });
    startExercise(exerciseKey(exercise.a, exercise.b));
  }, [exercise, input, startExercise, showFeedback]);

  const handleDigit = useCallback(
    (digit: number) => {
      if (!exercise) return;
      haptic(TAP);
      setFeedback(null);
      setInput((prev) =>
        prev.length >= MAX_INPUT_LENGTH ? prev : prev + String(digit)
      );
    },
    [exercise]
  );

  const handleBackspace = useCallback(() => {
    haptic(TAP);
    setInput((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    haptic(TAP);
    setInput("");
  }, []);

  // Stop the current run: cancel the timer and return to the empty state
  // without recording anything for the exercise that was on screen.
  const handleStop = useCallback(() => {
    haptic(TAP);
    setExercise(null);
    setInput("");
    setFeedback(null);
    startTimeRef.current = null;
  }, []);

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
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <main className="flex h-[100dvh] max-h-[920px] w-full max-w-md flex-col gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        {/* Top bar: title and, during a run, the Stop button. */}
        <div className="flex h-9 shrink-0 items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Multiplication Tables
          </span>
          {exercise && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleStop}
              className="h-8 gap-1 px-2 text-muted-foreground hover:text-destructive"
              aria-label="Stop and discard the current exercise"
            >
              <CircleStop className="!size-4" />
              Stop
            </Button>
          )}
        </div>

        {/* Exercise + feedback, centered in the space above the numpad. */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
          {exercise ? (
            <p
              className="text-6xl font-bold tabular-nums sm:text-7xl"
              aria-live="polite"
            >
              {exercise.a} <span className="text-muted-foreground">&times;</span>{" "}
              {exercise.b}
            </p>
          ) : (
            <p className="text-center text-lg text-muted-foreground">
              Press = to start
            </p>
          )}

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
        </div>

        {/* Answer display. Border flashes green/red with the last result. */}
        <Input
          readOnly
          inputMode="none"
          value={input}
          placeholder="0"
          aria-label="Your answer"
          className={cn(
            "h-16 shrink-0 bg-muted/40 text-right font-mono !text-4xl tabular-nums transition-colors",
            feedback?.correct && "border-green-500",
            feedback && !feedback.correct && "border-destructive"
          )}
        />

        {/* Numpad fills the remaining height. */}
        <div className="min-h-0 flex-[2] shrink-0">
          <Numpad
            className="h-full"
            onDigit={handleDigit}
            onClear={handleClear}
            onBackspace={handleBackspace}
            onSubmit={handleSubmit}
          />
        </div>
      </main>
    </div>
  );
}
