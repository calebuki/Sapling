import type { UserItemStateSnapshot } from '../types';

export type DueItem<T = string> = {
  itemId: T;
  nextDueAt: Date;
  lapses: number;
  repetitions: number;
};

export function selectDueItems<T>(
  dueItems: DueItem<T>[],
  now: Date,
  limit: number
): DueItem<T>[] {
  return dueItems
    .filter((item) => item.nextDueAt <= now)
    .sort((a, b) => {
      if (a.nextDueAt.getTime() !== b.nextDueAt.getTime()) {
        return a.nextDueAt.getTime() - b.nextDueAt.getTime();
      }

      if (a.lapses !== b.lapses) {
        return b.lapses - a.lapses;
      }

      return a.repetitions - b.repetitions;
    })
    .slice(0, Math.max(0, limit));
}

export function toDueItem(itemId: string, state: UserItemStateSnapshot): DueItem<string> {
  return {
    itemId,
    nextDueAt: state.nextDueAt,
    lapses: state.lapses,
    repetitions: state.repetitions
  };
}
