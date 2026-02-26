import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';

export async function registerProgressRoutes(app: FastifyInstance) {
  app.get('/progress/:profileId', async (request, reply) => {
    const params = z.object({ profileId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: params.error.flatten() });
    }

    const profile = await prisma.profile.findUnique({ where: { id: params.data.profileId } });
    if (!profile) {
      return reply.status(404).send({ error: 'Profile not found' });
    }

    const now = new Date();

    const [dueReviews, strengths, recentActivity] = await Promise.all([
      prisma.userItemState.count({
        where: {
          profileId: profile.id,
          nextDueAt: { lte: now }
        }
      }),
      prisma.userItemState.findMany({
        where: { profileId: profile.id },
        orderBy: [{ strength: 'desc' }, { updatedAt: 'desc' }],
        take: 8,
        include: {
          item: true
        }
      }),
      prisma.dailyActivity.findMany({
        where: { profileId: profile.id },
        orderBy: { date: 'desc' },
        take: 14
      })
    ]);

    return {
      streakCurrent: profile.streakCurrent,
      streakBest: profile.streakBest,
      xpTotal: profile.xpTotal,
      dueReviews,
      sceneStage: profile.sceneStage,
      saplingGrowth: Math.min(100, Math.round((profile.xpTotal / 1200) * 100)),
      strengths: strengths.map((state) => ({
        itemId: state.itemId,
        phrase: state.item.targetText,
        strength: state.strength,
        nextDueAt: state.nextDueAt
      })),
      recentActivity: recentActivity.reverse()
    };
  });
}
