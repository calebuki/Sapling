import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { DAILY_GOAL_DEFAULT, NATIVE_LANGUAGE, TARGET_LANGUAGE } from '@sapling/shared';
import { prisma } from '../db';
import { ensureGuestProfile } from '../services/guest';

const createProfileSchema = z.object({
  name: z.string().trim().min(1).max(32),
  pin: z.string().trim().min(4).max(32).optional(),
  dailyGoalMinutes: z.number().int().min(5).max(60).optional()
});

const loginSchema = z.object({
  profileId: z.string().min(1),
  pin: z.string().optional()
});

const upgradeGuestSchema = z.object({
  name: z.string().trim().min(1).max(32),
  pin: z.string().trim().min(4).max(32).optional()
});

const updateSettingsSchema = z.object({
  dailyGoalMinutes: z.number().int().min(5).max(60).optional(),
  targetLanguage: z.string().min(2).max(8).optional(),
  nativeLanguage: z.string().min(2).max(8).optional()
});

export async function registerProfileRoutes(app: FastifyInstance) {
  app.get('/profiles', async () => {
    await ensureGuestProfile();
    const profiles = await prisma.profile.findMany({ orderBy: [{ isGuest: 'desc' }, { createdAt: 'asc' }] });

    return {
      profiles: profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        isGuest: profile.isGuest,
        hasPin: Boolean(profile.pinHash),
        dailyGoalMinutes: profile.dailyGoalMinutes,
        targetLanguage: profile.targetLanguage,
        nativeLanguage: profile.nativeLanguage,
        xpTotal: profile.xpTotal,
        streakCurrent: profile.streakCurrent,
        sceneStage: profile.sceneStage
      }))
    };
  });

  app.post('/profiles', async (request, reply) => {
    const parsed = createProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const pinHash = parsed.data.pin ? await bcrypt.hash(parsed.data.pin, 10) : null;

    const profile = await prisma.profile.create({
      data: {
        name: parsed.data.name,
        pinHash,
        dailyGoalMinutes: parsed.data.dailyGoalMinutes ?? DAILY_GOAL_DEFAULT,
        targetLanguage: TARGET_LANGUAGE,
        nativeLanguage: NATIVE_LANGUAGE,
        isGuest: false
      }
    });

    return {
      profile: {
        id: profile.id,
        name: profile.name,
        isGuest: profile.isGuest,
        hasPin: Boolean(profile.pinHash),
        dailyGoalMinutes: profile.dailyGoalMinutes,
        targetLanguage: profile.targetLanguage,
        nativeLanguage: profile.nativeLanguage
      }
    };
  });

  app.post('/profiles/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const profile = await prisma.profile.findUnique({ where: { id: parsed.data.profileId } });
    if (!profile) {
      return reply.status(404).send({ error: 'Profile not found' });
    }

    if (profile.pinHash) {
      const valid = parsed.data.pin ? await bcrypt.compare(parsed.data.pin, profile.pinHash) : false;
      if (!valid) {
        return reply.status(401).send({ error: 'Invalid PIN' });
      }
    }

    return {
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        isGuest: profile.isGuest,
        hasPin: Boolean(profile.pinHash),
        dailyGoalMinutes: profile.dailyGoalMinutes,
        targetLanguage: profile.targetLanguage,
        nativeLanguage: profile.nativeLanguage,
        xpTotal: profile.xpTotal,
        streakCurrent: profile.streakCurrent,
        sceneStage: profile.sceneStage
      }
    };
  });

  app.post('/profiles/:id/upgrade', async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    const body = upgradeGuestSchema.safeParse(request.body);

    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Invalid request' });
    }

    const profile = await prisma.profile.findUnique({ where: { id: params.data.id } });
    if (!profile) {
      return reply.status(404).send({ error: 'Profile not found' });
    }

    if (!profile.isGuest) {
      return reply.status(400).send({ error: 'Only guest profile can be upgraded' });
    }

    const pinHash = body.data.pin ? await bcrypt.hash(body.data.pin, 10) : null;

    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        name: body.data.name,
        isGuest: false,
        pinHash
      }
    });

    return {
      profile: {
        id: updated.id,
        name: updated.name,
        isGuest: updated.isGuest,
        hasPin: Boolean(updated.pinHash)
      }
    };
  });

  app.patch('/profiles/:id/settings', async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    const body = updateSettingsSchema.safeParse(request.body);

    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Invalid request' });
    }

    const profile = await prisma.profile.update({
      where: { id: params.data.id },
      data: {
        dailyGoalMinutes: body.data.dailyGoalMinutes,
        targetLanguage: body.data.targetLanguage,
        nativeLanguage: body.data.nativeLanguage
      }
    });

    return {
      profile: {
        id: profile.id,
        dailyGoalMinutes: profile.dailyGoalMinutes,
        targetLanguage: profile.targetLanguage,
        nativeLanguage: profile.nativeLanguage
      }
    };
  });
}
