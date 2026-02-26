import { SHORT_RETRY_WINDOW_MINUTES } from '../config';
import type { AttemptResult, UserItemStateSnapshot } from '../types';

export type SchedulerUpdateInput = {
  now?: Date;
  inSession?: boolean;
  shortRetryWindowMinutes?: number;
};

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function nextIntervalDaysForCorrect(repetitions: number, previousIntervalDays: number, easeFactor: number): number {
  if (repetitions <= 1) {
    return 1;
  }

  if (repetitions === 2) {
    return 3;
  }

  return Math.max(1, Math.round(previousIntervalDays * easeFactor));
}

function nextIntervalDaysForNearMiss(repetitions: number, previousIntervalDays: number): number {
  if (repetitions <= 1) {
    return 1;
  }

  return Math.max(1, Math.round(previousIntervalDays * 1.2));
}

export function applySchedulerResult(
  state: UserItemStateSnapshot,
  result: AttemptResult,
  input: SchedulerUpdateInput = {}
): UserItemStateSnapshot {
  const now = input.now ?? new Date();
  const inSession = input.inSession ?? false;
  const shortRetryWindowMinutes = input.shortRetryWindowMinutes ?? SHORT_RETRY_WINDOW_MINUTES;

  if (result === 'incorrect') {
    return {
      ...state,
      easeFactor: Math.max(1.3, state.easeFactor - 0.2),
      intervalDays: 1,
      repetitions: 0,
      nextDueAt: inSession ? addMinutes(now, shortRetryWindowMinutes) : addDays(now, 1),
      lastReviewedAt: now,
      lapses: state.lapses + 1
    };
  }

  if (result === 'near_miss') {
    const repetitions = state.repetitions + 1;
    const intervalDays = nextIntervalDaysForNearMiss(repetitions, Math.max(state.intervalDays, 1));

    return {
      ...state,
      easeFactor: Math.max(1.3, state.easeFactor - 0.05),
      intervalDays,
      repetitions,
      nextDueAt: addDays(now, intervalDays),
      lastReviewedAt: now
    };
  }

  const repetitions = state.repetitions + 1;
  const easeFactor = Math.max(1.3, state.easeFactor + 0.1);
  const intervalDays = nextIntervalDaysForCorrect(repetitions, Math.max(state.intervalDays, 1), easeFactor);

  return {
    ...state,
    easeFactor,
    intervalDays,
    repetitions,
    nextDueAt: addDays(now, intervalDays),
    lastReviewedAt: now
  };
}
