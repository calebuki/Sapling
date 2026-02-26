import { prisma } from '../db';
import { isSameDay, isYesterday, startOfDay } from '../utils/date';

export function scoreToXp(result: 'exact' | 'near_miss' | 'incorrect'): number {
  if (result === 'exact') {
    return 12;
  }

  if (result === 'near_miss') {
    return 9;
  }

  return 3;
}

export function computeStrength(repetitions: number, lapses: number, easeFactor: number): number {
  const raw = repetitions * easeFactor - lapses * 0.8;
  return Number(Math.max(0, Math.min(10, raw)).toFixed(2));
}

export async function applyProfileActivity(profileId: string, xpEarned: number, minutes: number, now = new Date()) {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) {
    return;
  }

  const day = startOfDay(now);

  await prisma.dailyActivity.upsert({
    where: {
      profileId_date: {
        profileId,
        date: day
      }
    },
    create: {
      profileId,
      date: day,
      xpEarned,
      minutes
    },
    update: {
      xpEarned: { increment: xpEarned },
      minutes: { increment: minutes }
    }
  });

  let streakCurrent = profile.streakCurrent;
  let streakBest = profile.streakBest;

  if (!profile.lastActiveDate) {
    streakCurrent = 1;
  } else if (isSameDay(profile.lastActiveDate, now)) {
    streakCurrent = profile.streakCurrent;
  } else if (isYesterday(profile.lastActiveDate, now)) {
    streakCurrent = profile.streakCurrent + 1;
  } else {
    streakCurrent = 1;
  }

  streakBest = Math.max(streakBest, streakCurrent);

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      xpTotal: { increment: xpEarned },
      streakCurrent,
      streakBest,
      lastActiveDate: now
    }
  });
}
