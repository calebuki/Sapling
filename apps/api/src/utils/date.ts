export function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function isYesterday(previous: Date, now: Date): boolean {
  const dayMs = 24 * 60 * 60 * 1000;
  return startOfDay(now).getTime() - startOfDay(previous).getTime() === dayMs;
}
