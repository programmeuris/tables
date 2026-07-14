import type { Submission } from "./db";

export interface Exercise {
  a: number;
  b: number;
}

/** Lowest and highest factor practised. */
export const MIN_FACTOR = 2;
export const MAX_FACTOR = 12;

/** Stable string key for an exercise, e.g. "7x8". */
export function exerciseKey(a: number, b: number): string {
  return `${a}x${b}`;
}

/**
 * Every exercise from MIN_FACTOR×MIN_FACTOR up to MAX_FACTOR×MAX_FACTOR.
 * ×1 (and 1×) exercises are intentionally excluded — they are trivial and add
 * little practice value, so factors start at 2.
 */
export function allExercises(): Exercise[] {
  const exercises: Exercise[] = [];
  for (let a = MIN_FACTOR; a <= MAX_FACTOR; a++) {
    for (let b = MIN_FACTOR; b <= MAX_FACTOR; b++) {
      exercises.push({ a, b });
    }
  }
  return exercises;
}

// --- Weighting -------------------------------------------------------------
//
// Every exercise starts from a base weight so that all of them keep appearing.
// A *small* extra bias is layered on top for exercises the learner tends to get
// wrong or answers slowly, so those come round a little more often.

const BASE_WEIGHT = 1;
/** Extra weight for exercises never answered yet, so new ones surface. */
const UNSEEN_BONUS = 0.5;
/** Maximum extra weight contributed by a poor accuracy record. */
const INCORRECT_WEIGHT = 0.75;
/** Maximum extra weight contributed by slow answers. */
const SLOWNESS_WEIGHT = 0.5;
/** Answers faster than this (seconds) are considered effortless. */
const FAST_SECONDS = 3;
/** Answers at or above this (seconds) count as fully "slow". */
const SLOW_SECONDS = 12;
/** How many of the most recent attempts per exercise feed the bias. */
const RECENT_ATTEMPTS = 5;

interface Stats {
  attempts: number;
  incorrect: number;
  totalDurationMs: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Aggregate the most recent attempts per exercise. Submissions are expected
 * oldest-first; only the last {@link RECENT_ATTEMPTS} per exercise are kept so
 * the bias tracks current ability rather than the whole history.
 */
function collectStats(submissions: Submission[]): Map<string, Stats> {
  const recent = new Map<string, Submission[]>();
  for (const s of submissions) {
    const key = exerciseKey(s.a, s.b);
    const list = recent.get(key) ?? [];
    list.push(s);
    recent.set(key, list);
  }

  const stats = new Map<string, Stats>();
  for (const [key, list] of recent) {
    const window = list.slice(-RECENT_ATTEMPTS);
    const agg: Stats = { attempts: 0, incorrect: 0, totalDurationMs: 0 };
    for (const s of window) {
      agg.attempts++;
      if (!s.correct) agg.incorrect++;
      agg.totalDurationMs += s.durationMs;
    }
    stats.set(key, agg);
  }
  return stats;
}

function weightFor(stats: Stats | undefined): number {
  if (!stats || stats.attempts === 0) {
    return BASE_WEIGHT + UNSEEN_BONUS;
  }

  const incorrectRate = stats.incorrect / stats.attempts;

  const avgSeconds = stats.totalDurationMs / stats.attempts / 1000;
  const slowness = clamp(
    (avgSeconds - FAST_SECONDS) / (SLOW_SECONDS - FAST_SECONDS),
    0,
    1
  );

  return (
    BASE_WEIGHT +
    incorrectRate * INCORRECT_WEIGHT +
    slowness * SLOWNESS_WEIGHT
  );
}

/**
 * Choose the next exercise using a weighted random draw. Exercises answered
 * incorrectly or slowly carry a slightly higher weight. The immediately
 * previous exercise is avoided so the same question never repeats twice in a
 * row (unless it is somehow the only option).
 */
export function pickNextExercise(
  submissions: Submission[],
  previousKey?: string,
  random: () => number = Math.random
): Exercise {
  const stats = collectStats(submissions);
  const exercises = allExercises();

  const weighted = exercises.map((exercise) => {
    const key = exerciseKey(exercise.a, exercise.b);
    let weight = weightFor(stats.get(key));
    if (key === previousKey) weight = 0;
    return { exercise, weight };
  });

  let total = weighted.reduce((sum, w) => sum + w.weight, 0);
  if (total <= 0) {
    // Everything was zeroed out (only possible with a single exercise); fall
    // back to an unbiased pick over the full set.
    const idx = Math.floor(random() * exercises.length);
    return exercises[idx];
  }

  let threshold = random() * total;
  for (const { exercise, weight } of weighted) {
    threshold -= weight;
    if (threshold < 0) return exercise;
  }
  return weighted[weighted.length - 1].exercise;
}
