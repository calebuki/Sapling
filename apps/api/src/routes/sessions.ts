import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { applySchedulerResult, classifyAttempt, normalizeText } from '@sapling/shared';
import prismaClientPkg from '@prisma/client';
import { prisma } from '../db';
import { applyProfileActivity, computeStrength, scoreToXp } from '../services/progressTracker';
import { generateSession } from '../services/sessionGenerator';
import { parseExerciseData } from '../utils/exercise';

const { AttemptResult: PrismaAttemptResultEnum } = prismaClientPkg;
type PrismaAttemptResult = (typeof PrismaAttemptResultEnum)[keyof typeof PrismaAttemptResultEnum];

const startSessionSchema = z.object({
  profileId: z.string().min(1),
  lessonId: z.string().min(1)
});

const submitAttemptSchema = z.object({
  profileId: z.string().min(1),
  exerciseId: z.string().min(1),
  answer: z.string().min(1),
  mode: z.enum(['typed', 'choice', 'asr', 'speak']).default('typed'),
  sessionId: z.string().optional(),
  inSession: z.boolean().default(true)
});

const completeSessionSchema = z.object({
  profileId: z.string().min(1),
  lessonId: z.string().min(1),
  accuracy: z.number().min(0).max(1),
  xpEarned: z.number().int().min(0),
  strengthenedItemIds: z.array(z.string()).default([])
});

function toPrismaResult(result: 'exact' | 'near_miss' | 'incorrect'): PrismaAttemptResult {
  if (result === 'exact') {
    return PrismaAttemptResultEnum.EXACT;
  }

  if (result === 'near_miss') {
    return PrismaAttemptResultEnum.NEAR_MISS;
  }

  return PrismaAttemptResultEnum.INCORRECT;
}

function tipForReason(reasonCode: string): string {
  switch (reasonCode) {
    case 'accent_only':
      return 'Good meaning match. Next time try the accent marks for a native-like answer.';
    case 'token_swap':
      return 'You got the right words. Keep the order steady and try again.';
    case 'edit_distance':
      return 'Close answer. Focus on one small spelling/sound detail.';
    case 'asr_subsequence':
      return 'Your spoken response was understood with extra words. Keep it short and crisp.';
    default:
      return 'Nice effort. Listen once more and mirror the phrase rhythm.';
  }
}

export async function registerSessionRoutes(app: FastifyInstance) {
  app.post('/sessions/start', async (request, reply) => {
    const parsed = startSessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const [profile, lesson] = await Promise.all([
      prisma.profile.findUnique({ where: { id: parsed.data.profileId } }),
      prisma.lesson.findUnique({ where: { id: parsed.data.lessonId } })
    ]);

    if (!profile) {
      return reply.status(404).send({ error: 'Profile not found' });
    }

    if (!lesson) {
      return reply.status(404).send({ error: 'Lesson not found' });
    }

    const session = await generateSession(parsed.data.profileId, parsed.data.lessonId);

    return session;
  });

  app.post('/sessions/attempt', async (request, reply) => {
    const parsed = submitAttemptSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id: parsed.data.exerciseId },
      include: {
        itemLinks: {
          include: {
            item: true
          }
        }
      }
    });

    if (!exercise) {
      return reply.status(404).send({ error: 'Exercise not found' });
    }

    const data = parseExerciseData(exercise.data);
    const itemTargets = exercise.itemLinks.map((link) => link.item.targetText);
    const targets = Array.from(new Set([...data.answers, ...itemTargets])).filter(Boolean);

    const classification = classifyAttempt(parsed.data.answer, targets, {
      isASR: parsed.data.mode === 'asr' || parsed.data.mode === 'speak'
    });

    const now = new Date();
    const normalizedAnswer = normalizeText(parsed.data.answer);

    const xpAwarded = scoreToXp(classification.result);

    await prisma.attempt.create({
      data: {
        profileId: parsed.data.profileId,
        exerciseId: exercise.id,
        itemId: exercise.itemLinks[0]?.itemId,
        sessionId: parsed.data.sessionId,
        result: toPrismaResult(classification.result),
        submittedAnswer: parsed.data.answer,
        normalizedAnswer,
        reasonCode: classification.reasonCode,
        bestMatch: classification.bestMatch,
        metrics: JSON.stringify(classification.metrics)
      }
    });

    for (const itemLink of exercise.itemLinks) {
      const existing = await prisma.userItemState.findUnique({
        where: {
          profileId_itemId: {
            profileId: parsed.data.profileId,
            itemId: itemLink.itemId
          }
        }
      });

      const baseState = {
        easeFactor: existing?.easeFactor ?? 2.5,
        intervalDays: existing?.intervalDays ?? 0,
        repetitions: existing?.repetitions ?? 0,
        nextDueAt: existing?.nextDueAt ?? now,
        lastReviewedAt: existing?.lastReviewedAt ?? null,
        lapses: existing?.lapses ?? 0
      };

      const updatedState = applySchedulerResult(baseState, classification.result, {
        now,
        inSession: parsed.data.inSession
      });

      const strength = computeStrength(
        updatedState.repetitions,
        updatedState.lapses,
        updatedState.easeFactor
      );

      await prisma.userItemState.upsert({
        where: {
          profileId_itemId: {
            profileId: parsed.data.profileId,
            itemId: itemLink.itemId
          }
        },
        create: {
          profileId: parsed.data.profileId,
          itemId: itemLink.itemId,
          easeFactor: updatedState.easeFactor,
          intervalDays: updatedState.intervalDays,
          repetitions: updatedState.repetitions,
          nextDueAt: updatedState.nextDueAt,
          lastReviewedAt: updatedState.lastReviewedAt,
          lapses: updatedState.lapses,
          strength
        },
        update: {
          easeFactor: updatedState.easeFactor,
          intervalDays: updatedState.intervalDays,
          repetitions: updatedState.repetitions,
          nextDueAt: updatedState.nextDueAt,
          lastReviewedAt: updatedState.lastReviewedAt,
          lapses: updatedState.lapses,
          strength
        }
      });
    }

    await applyProfileActivity(parsed.data.profileId, xpAwarded, 1, now);

    return {
      result: classification.result,
      reasonCode: classification.reasonCode,
      bestMatch: classification.bestMatch,
      countsAsCorrect: classification.result !== 'incorrect',
      xpAwarded,
      correctAnswer: targets[0] ?? '',
      replayText: data.audioText ?? targets[0] ?? '',
      tip: tipForReason(classification.reasonCode),
      metrics: classification.metrics
    };
  });

  app.post('/sessions/complete', async (request, reply) => {
    const parsed = completeSessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const completion = await prisma.lessonCompletion.upsert({
      where: {
        profileId_lessonId: {
          profileId: parsed.data.profileId,
          lessonId: parsed.data.lessonId
        }
      },
      create: {
        profileId: parsed.data.profileId,
        lessonId: parsed.data.lessonId,
        accuracy: parsed.data.accuracy,
        xpEarned: parsed.data.xpEarned,
        completedAt: new Date()
      },
      update: {
        accuracy: parsed.data.accuracy,
        xpEarned: parsed.data.xpEarned,
        completedAt: new Date()
      }
    });

    const dueReviews = await prisma.userItemState.count({
      where: {
        profileId: parsed.data.profileId,
        nextDueAt: { lte: new Date() }
      }
    });

    return {
      completionId: completion.id,
      xpEarned: parsed.data.xpEarned,
      accuracy: parsed.data.accuracy,
      strengthenedItems: parsed.data.strengthenedItemIds,
      dueReviews,
      speakingPracticeRecommended: parsed.data.accuracy > 0.7
    };
  });
}
