import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';

export async function registerCourseRoutes(app: FastifyInstance) {
  app.get('/course-map', async (request, reply) => {
    const query = z.object({ profileId: z.string().min(1) }).safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({ error: query.error.flatten() });
    }

    const [profile, course] = await Promise.all([
      prisma.profile.findUnique({ where: { id: query.data.profileId } }),
      prisma.course.findFirst({
        orderBy: { createdAt: 'asc' },
        include: {
          units: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' }
              }
            }
          }
        }
      })
    ]);

    if (!profile) {
      return reply.status(404).send({ error: 'Profile not found' });
    }

    if (!course) {
      return reply.status(404).send({ error: 'Course not found' });
    }

    const completions = await prisma.lessonCompletion.findMany({
      where: {
        profileId: profile.id,
        lesson: {
          unit: {
            courseId: course.id
          }
        }
      }
    });

    const completionSet = new Set(completions.map((completion) => completion.lessonId));

    let previousUnitCompleted = true;
    let nextLessonId: string | null = null;

    const units = course.units.map((unit) => {
      const unitUnlocked = unit.order === 1 || previousUnitCompleted;
      let previousLessonCompleted = true;

      const lessons = unit.lessons.map((lesson) => {
        const completed = completionSet.has(lesson.id);
        const unlocked = unitUnlocked && (lesson.order === 1 || previousLessonCompleted);

        if (!nextLessonId && unlocked && !completed) {
          nextLessonId = lesson.id;
        }

        previousLessonCompleted = completed;

        return {
          id: lesson.id,
          order: lesson.order,
          title: lesson.title,
          description: lesson.description,
          isOptionalGrammar: lesson.isOptionalGrammar,
          unlocked,
          completed
        };
      });

      previousUnitCompleted = lessons.length > 0 ? lessons.every((lesson) => lesson.completed) : previousUnitCompleted;

      return {
        id: unit.id,
        order: unit.order,
        title: unit.title,
        description: unit.description,
        phase: unit.phase,
        isGrammar: unit.isGrammar,
        unlocked: unitUnlocked,
        completed: lessons.every((lesson) => lesson.completed),
        lessons
      };
    });

    const dueReviews = await prisma.userItemState.count({
      where: {
        profileId: profile.id,
        nextDueAt: {
          lte: new Date()
        }
      }
    });

    return {
      course: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        targetLanguage: course.targetLanguage,
        nativeLanguage: course.nativeLanguage,
        units
      },
      dueReviews,
      nextLessonId,
      sceneStage: profile.sceneStage
    };
  });
}
