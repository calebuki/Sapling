import { DAILY_GOAL_DEFAULT, NATIVE_LANGUAGE, TARGET_LANGUAGE } from '@sapling/shared';
import { prisma } from '../db';

export async function ensureGuestProfile() {
  const existingGuest = await prisma.profile.findFirst({ where: { isGuest: true } });
  if (existingGuest) {
    return existingGuest;
  }

  return prisma.profile.create({
    data: {
      name: 'Guest',
      isGuest: true,
      dailyGoalMinutes: DAILY_GOAL_DEFAULT,
      targetLanguage: TARGET_LANGUAGE,
      nativeLanguage: NATIVE_LANGUAGE
    }
  });
}
