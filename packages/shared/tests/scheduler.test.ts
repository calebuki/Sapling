import { describe, expect, it } from 'vitest';
import { applySchedulerResult, selectDueItems } from '../src';

const baseState = {
  easeFactor: 2.5,
  intervalDays: 1,
  repetitions: 0,
  nextDueAt: new Date('2025-01-01T00:00:00.000Z'),
  lastReviewedAt: null,
  lapses: 0
};

describe('applySchedulerResult', () => {
  it('increments repetitions and interval on exact', () => {
    const now = new Date('2025-01-02T00:00:00.000Z');
    const result = applySchedulerResult(baseState, 'exact', { now });

    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
    expect(result.nextDueAt.toISOString()).toBe('2025-01-03T00:00:00.000Z');
  });

  it('uses smaller gain for near miss', () => {
    const now = new Date('2025-01-02T00:00:00.000Z');
    const state = { ...baseState, repetitions: 2, intervalDays: 5 };
    const result = applySchedulerResult(state, 'near_miss', { now });

    expect(result.repetitions).toBe(3);
    expect(result.intervalDays).toBe(6);
  });

  it('resets on incorrect and uses short retry in-session', () => {
    const now = new Date('2025-01-02T00:00:00.000Z');
    const state = { ...baseState, repetitions: 4, intervalDays: 12 };
    const result = applySchedulerResult(state, 'incorrect', { now, inSession: true, shortRetryWindowMinutes: 10 });

    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
    expect(result.lapses).toBe(1);
    expect(result.nextDueAt.toISOString()).toBe('2025-01-02T00:10:00.000Z');
  });
});

describe('selectDueItems', () => {
  it('returns due items sorted by due time then lapses', () => {
    const now = new Date('2025-01-03T00:00:00.000Z');

    const items = [
      { itemId: 'a', nextDueAt: new Date('2025-01-01T00:00:00.000Z'), lapses: 1, repetitions: 2 },
      { itemId: 'b', nextDueAt: new Date('2025-01-02T00:00:00.000Z'), lapses: 0, repetitions: 1 },
      { itemId: 'c', nextDueAt: new Date('2025-01-01T00:00:00.000Z'), lapses: 3, repetitions: 2 },
      { itemId: 'd', nextDueAt: new Date('2025-01-04T00:00:00.000Z'), lapses: 0, repetitions: 0 }
    ];

    const selected = selectDueItems(items, now, 3);
    expect(selected.map((item) => item.itemId)).toEqual(['c', 'a', 'b']);
  });
});
