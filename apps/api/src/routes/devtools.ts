import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { EXERCISE_MODALITIES, EXERCISE_TYPES, NATIVE_LANGUAGE, TARGET_LANGUAGE } from '@sapling/shared';
import { prisma } from '../db';
import {
  parseExerciseData,
  serializeExerciseData,
  toExerciseModality,
  toExerciseType
} from '../utils/exercise';

const courseSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  targetLanguage: z.string().default(TARGET_LANGUAGE),
  nativeLanguage: z.string().default(NATIVE_LANGUAGE)
});

const unitSchema = z.object({
  courseId: z.string().min(1),
  order: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  phase: z.string().default('comprehension'),
  isGrammar: z.boolean().default(false)
});

const lessonSchema = z.object({
  unitId: z.string().min(1),
  order: z.number().int().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  isOptionalGrammar: z.boolean().default(false)
});

const patternSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  difficulty: z.number().int().min(1).max(10).default(1)
});

const itemSchema = z.object({
  key: z.string().min(1),
  sourceText: z.string().min(1),
  targetText: z.string().min(1),
  imagePath: z.string().optional(),
  audioText: z.string().optional(),
  difficulty: z.number().int().min(1).max(10).default(1),
  patternIds: z.array(z.string()).default([])
});

const exerciseSchema = z.object({
  lessonId: z.string().nullable().optional(),
  order: z.number().int().min(1),
  type: z.enum(EXERCISE_TYPES),
  modality: z.enum(EXERCISE_MODALITIES),
  promptText: z.string().optional(),
  difficulty: z.number().int().min(1).max(10).default(1),
  data: z.record(z.any()),
  itemIds: z.array(z.string()).default([]),
  patternIds: z.array(z.string()).default([]),
  isTemplate: z.boolean().default(false)
});

const importSchema = z.object({
  conflictStrategy: z.enum(['skip', 'replace']).default('skip'),
  payload: z.object({
    courses: z
      .array(
        z.object({
          slug: z.string().min(1),
          title: z.string().min(1),
          description: z.string().optional(),
          targetLanguage: z.string().default(TARGET_LANGUAGE),
          nativeLanguage: z.string().default(NATIVE_LANGUAGE)
        })
      )
      .default([]),
    units: z
      .array(
        z.object({
          courseSlug: z.string().min(1),
          order: z.number().int().min(1),
          title: z.string().min(1),
          description: z.string().optional(),
          phase: z.string().default('comprehension'),
          isGrammar: z.boolean().default(false)
        })
      )
      .default([]),
    lessons: z
      .array(
        z.object({
          courseSlug: z.string().min(1),
          unitOrder: z.number().int().min(1),
          order: z.number().int().min(1),
          title: z.string().min(1),
          description: z.string().optional(),
          isOptionalGrammar: z.boolean().default(false)
        })
      )
      .default([]),
    patterns: z.array(patternSchema).default([]),
    items: z
      .array(
        z.object({
          key: z.string().min(1),
          sourceText: z.string().min(1),
          targetText: z.string().min(1),
          imagePath: z.string().optional(),
          audioText: z.string().optional(),
          difficulty: z.number().int().min(1).max(10).default(1),
          patternKeys: z.array(z.string()).default([])
        })
      )
      .default([]),
    exercises: z
      .array(
        z.object({
          courseSlug: z.string().min(1),
          unitOrder: z.number().int().min(1),
          lessonOrder: z.number().int().min(1),
          order: z.number().int().min(1),
          type: z.enum(EXERCISE_TYPES),
          modality: z.enum(EXERCISE_MODALITIES),
          promptText: z.string().optional(),
          difficulty: z.number().int().min(1).max(10).default(1),
          data: z.record(z.any()),
          itemKeys: z.array(z.string()).default([]),
          patternKeys: z.array(z.string()).default([])
        })
      )
      .default([])
  })
});

async function mapCourseSlugToId() {
  const courses = await prisma.course.findMany();
  return new Map(courses.map((course) => [course.slug, course.id]));
}

async function mapPatternKeyToId() {
  const patterns = await prisma.pattern.findMany();
  return new Map(patterns.map((pattern) => [pattern.key, pattern.id]));
}

async function mapItemKeyToId() {
  const items = await prisma.item.findMany();
  return new Map(items.map((item) => [item.key, item.id]));
}

async function linkExercise(exerciseId: string, itemIds: string[], patternIds: string[]) {
  await prisma.exerciseItem.deleteMany({ where: { exerciseId } });
  await prisma.exercisePattern.deleteMany({ where: { exerciseId } });

  if (itemIds.length) {
    await prisma.exerciseItem.createMany({
      data: itemIds.map((itemId) => ({
        exerciseId,
        itemId
      }))
    });
  }

  if (patternIds.length) {
    await prisma.exercisePattern.createMany({
      data: patternIds.map((patternId) => ({
        exerciseId,
        patternId
      }))
    });
  }
}

export async function registerDevToolsRoutes(app: FastifyInstance) {
  app.get('/dev/overview', async () => {
    const [courses, units, lessons, items, patterns, exercises] = await Promise.all([
      prisma.course.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.unit.findMany({ orderBy: [{ courseId: 'asc' }, { order: 'asc' }] }),
      prisma.lesson.findMany({ orderBy: [{ unitId: 'asc' }, { order: 'asc' }] }),
      prisma.item.findMany({ orderBy: { key: 'asc' } }),
      prisma.pattern.findMany({ orderBy: { key: 'asc' } }),
      prisma.exercise.findMany({
        orderBy: [{ lessonId: 'asc' }, { order: 'asc' }],
        include: {
          itemLinks: true,
          patternLinks: true
        }
      })
    ]);

    return {
      courses,
      units,
      lessons,
      items,
      patterns,
      exercises: exercises.map((exercise) => ({
        ...exercise,
        data: parseExerciseData(exercise.data)
      }))
    };
  });

  app.post('/dev/courses', async (request, reply) => {
    const parsed = courseSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const course = await prisma.course.create({ data: parsed.data });
    return { course };
  });

  app.patch('/dev/courses/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    const body = courseSchema.partial().safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Invalid request' });
    }

    const course = await prisma.course.update({
      where: { id: params.data.id },
      data: body.data
    });

    return { course };
  });

  app.delete('/dev/courses/:id', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    await prisma.course.delete({ where: { id: params.id } });
    return { success: true };
  });

  app.post('/dev/units', async (request, reply) => {
    const parsed = unitSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const unit = await prisma.unit.create({ data: parsed.data });
    return { unit };
  });

  app.patch('/dev/units/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    const body = unitSchema.partial().safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Invalid request' });
    }

    const unit = await prisma.unit.update({
      where: { id: params.data.id },
      data: body.data
    });

    return { unit };
  });

  app.delete('/dev/units/:id', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    await prisma.unit.delete({ where: { id: params.id } });
    return { success: true };
  });

  app.post('/dev/lessons', async (request, reply) => {
    const parsed = lessonSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const lesson = await prisma.lesson.create({ data: parsed.data });
    return { lesson };
  });

  app.patch('/dev/lessons/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    const body = lessonSchema.partial().safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Invalid request' });
    }

    const lesson = await prisma.lesson.update({
      where: { id: params.data.id },
      data: body.data
    });

    return { lesson };
  });

  app.delete('/dev/lessons/:id', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    await prisma.lesson.delete({ where: { id: params.id } });
    return { success: true };
  });

  app.post('/dev/items', async (request, reply) => {
    const parsed = itemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { patternIds, ...rest } = parsed.data;

    const item = await prisma.item.create({ data: rest });

    if (patternIds.length) {
      await prisma.itemPattern.createMany({
        data: patternIds.map((patternId) => ({ itemId: item.id, patternId }))
      });
    }

    return { item };
  });

  app.patch('/dev/items/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    const body = itemSchema.partial().safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Invalid request' });
    }

    const { patternIds, ...rest } = body.data;

    const item = await prisma.item.update({
      where: { id: params.data.id },
      data: rest
    });

    if (patternIds) {
      await prisma.itemPattern.deleteMany({ where: { itemId: item.id } });
      if (patternIds.length) {
        await prisma.itemPattern.createMany({
          data: patternIds.map((patternId) => ({ itemId: item.id, patternId }))
        });
      }
    }

    return { item };
  });

  app.delete('/dev/items/:id', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    await prisma.item.delete({ where: { id: params.id } });
    return { success: true };
  });

  app.post('/dev/patterns', async (request, reply) => {
    const parsed = patternSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const pattern = await prisma.pattern.create({ data: parsed.data });
    return { pattern };
  });

  app.patch('/dev/patterns/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    const body = patternSchema.partial().safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Invalid request' });
    }

    const pattern = await prisma.pattern.update({
      where: { id: params.data.id },
      data: body.data
    });

    return { pattern };
  });

  app.delete('/dev/patterns/:id', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    await prisma.pattern.delete({ where: { id: params.id } });
    return { success: true };
  });

  app.post('/dev/exercises', async (request, reply) => {
    const parsed = exerciseSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { itemIds, patternIds, ...rest } = parsed.data;

    const exercise = await prisma.exercise.create({
      data: {
        lessonId: rest.lessonId ?? null,
        order: rest.order,
        type: toExerciseType(rest.type),
        modality: toExerciseModality(rest.modality),
        promptText: rest.promptText,
        difficulty: rest.difficulty,
        data: serializeExerciseData(rest.data),
        isTemplate: rest.isTemplate
      }
    });

    await linkExercise(exercise.id, itemIds, patternIds);

    return { exercise };
  });

  app.patch('/dev/exercises/:id', async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    const body = exerciseSchema.partial().safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'Invalid request' });
    }

    const { itemIds, patternIds, ...rest } = body.data;

    const exercise = await prisma.exercise.update({
      where: { id: params.data.id },
      data: {
        lessonId: rest.lessonId,
        order: rest.order,
        type: rest.type ? toExerciseType(rest.type) : undefined,
        modality: rest.modality ? toExerciseModality(rest.modality) : undefined,
        promptText: rest.promptText,
        difficulty: rest.difficulty,
        data: rest.data ? serializeExerciseData(rest.data) : undefined,
        isTemplate: rest.isTemplate
      }
    });

    if (itemIds || patternIds) {
      await linkExercise(exercise.id, itemIds ?? [], patternIds ?? []);
    }

    return { exercise };
  });

  app.delete('/dev/exercises/:id', async (request) => {
    const params = z.object({ id: z.string() }).parse(request.params);
    await prisma.exercise.delete({ where: { id: params.id } });
    return { success: true };
  });

  app.get('/dev/export', async () => {
    const courses = await prisma.course.findMany({ orderBy: { createdAt: 'asc' } });
    const units = await prisma.unit.findMany({
      orderBy: [{ courseId: 'asc' }, { order: 'asc' }],
      include: { course: true }
    });
    const lessons = await prisma.lesson.findMany({
      orderBy: [{ unitId: 'asc' }, { order: 'asc' }],
      include: { unit: { include: { course: true } } }
    });
    const patterns = await prisma.pattern.findMany({ orderBy: { key: 'asc' } });
    const items = await prisma.item.findMany({
      orderBy: { key: 'asc' },
      include: { patternLinks: { include: { pattern: true } } }
    });
    const exercises = await prisma.exercise.findMany({
      orderBy: [{ lessonId: 'asc' }, { order: 'asc' }],
      include: {
        lesson: {
          include: {
            unit: {
              include: {
                course: true
              }
            }
          }
        },
        itemLinks: {
          include: {
            item: true
          }
        },
        patternLinks: {
          include: {
            pattern: true
          }
        }
      }
    });

    return {
      courses: courses.map((course) => ({
        slug: course.slug,
        title: course.title,
        description: course.description,
        targetLanguage: course.targetLanguage,
        nativeLanguage: course.nativeLanguage
      })),
      units: units.map((unit) => ({
        courseSlug: unit.course.slug,
        order: unit.order,
        title: unit.title,
        description: unit.description,
        phase: unit.phase,
        isGrammar: unit.isGrammar
      })),
      lessons: lessons.map((lesson) => ({
        courseSlug: lesson.unit.course.slug,
        unitOrder: lesson.unit.order,
        order: lesson.order,
        title: lesson.title,
        description: lesson.description,
        isOptionalGrammar: lesson.isOptionalGrammar
      })),
      patterns: patterns.map((pattern) => ({
        key: pattern.key,
        name: pattern.name,
        description: pattern.description,
        difficulty: pattern.difficulty
      })),
      items: items.map((item) => ({
        key: item.key,
        sourceText: item.sourceText,
        targetText: item.targetText,
        imagePath: item.imagePath,
        audioText: item.audioText,
        difficulty: item.difficulty,
        patternKeys: item.patternLinks.map((link) => link.pattern.key)
      })),
      exercises: exercises
        .filter((exercise) => Boolean(exercise.lesson))
        .map((exercise) => ({
          courseSlug: exercise.lesson!.unit.course.slug,
          unitOrder: exercise.lesson!.unit.order,
          lessonOrder: exercise.lesson!.order,
          order: exercise.order,
          type: exercise.type.toLowerCase(),
          modality: exercise.modality.toLowerCase(),
          promptText: exercise.promptText,
          difficulty: exercise.difficulty,
          data: parseExerciseData(exercise.data),
          itemKeys: exercise.itemLinks.map((link) => link.item.key),
          patternKeys: exercise.patternLinks.map((link) => link.pattern.key)
        }))
    };
  });

  app.post('/dev/import', async (request, reply) => {
    const parsed = importSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { payload, conflictStrategy } = parsed.data;

    const courseMap = await mapCourseSlugToId();

    for (const course of payload.courses) {
      const existing = await prisma.course.findUnique({ where: { slug: course.slug } });

      if (existing) {
        courseMap.set(course.slug, existing.id);
        if (conflictStrategy === 'replace') {
          await prisma.course.update({ where: { id: existing.id }, data: course });
        }
      } else {
        const created = await prisma.course.create({ data: course });
        courseMap.set(course.slug, created.id);
      }
    }

    const patternMap = await mapPatternKeyToId();
    for (const pattern of payload.patterns) {
      const existing = await prisma.pattern.findUnique({ where: { key: pattern.key } });
      if (existing) {
        patternMap.set(pattern.key, existing.id);
        if (conflictStrategy === 'replace') {
          await prisma.pattern.update({ where: { id: existing.id }, data: pattern });
        }
      } else {
        const created = await prisma.pattern.create({ data: pattern });
        patternMap.set(pattern.key, created.id);
      }
    }

    const itemMap = await mapItemKeyToId();
    for (const item of payload.items) {
      const existing = await prisma.item.findUnique({ where: { key: item.key } });
      let itemId = existing?.id;

      if (existing) {
        if (conflictStrategy === 'replace') {
          const updated = await prisma.item.update({
            where: { id: existing.id },
            data: {
              key: item.key,
              sourceText: item.sourceText,
              targetText: item.targetText,
              imagePath: item.imagePath,
              audioText: item.audioText,
              difficulty: item.difficulty
            }
          });
          itemId = updated.id;
        }
      } else {
        const created = await prisma.item.create({
          data: {
            key: item.key,
            sourceText: item.sourceText,
            targetText: item.targetText,
            imagePath: item.imagePath,
            audioText: item.audioText,
            difficulty: item.difficulty
          }
        });
        itemId = created.id;
      }

      if (!itemId) {
        continue;
      }

      itemMap.set(item.key, itemId);

      if (conflictStrategy === 'replace') {
        await prisma.itemPattern.deleteMany({ where: { itemId } });
      }

      for (const patternKey of item.patternKeys) {
        const patternId = patternMap.get(patternKey);
        if (!patternId) {
          continue;
        }

        await prisma.itemPattern.upsert({
          where: {
            itemId_patternId: {
              itemId,
              patternId
            }
          },
          create: {
            itemId,
            patternId
          },
          update: {}
        });
      }
    }

    const unitKeyToId = new Map<string, string>();

    for (const unit of payload.units) {
      const courseId = courseMap.get(unit.courseSlug);
      if (!courseId) {
        continue;
      }

      const existing = await prisma.unit.findUnique({
        where: {
          courseId_order: {
            courseId,
            order: unit.order
          }
        }
      });

      if (existing) {
        unitKeyToId.set(`${unit.courseSlug}:${unit.order}`, existing.id);
        if (conflictStrategy === 'replace') {
          await prisma.unit.update({
            where: { id: existing.id },
            data: {
              title: unit.title,
              description: unit.description,
              phase: unit.phase,
              isGrammar: unit.isGrammar
            }
          });
        }
      } else {
        const created = await prisma.unit.create({
          data: {
            courseId,
            order: unit.order,
            title: unit.title,
            description: unit.description,
            phase: unit.phase,
            isGrammar: unit.isGrammar
          }
        });
        unitKeyToId.set(`${unit.courseSlug}:${unit.order}`, created.id);
      }
    }

    const lessonKeyToId = new Map<string, string>();

    for (const lesson of payload.lessons) {
      const unitId = unitKeyToId.get(`${lesson.courseSlug}:${lesson.unitOrder}`);
      if (!unitId) {
        continue;
      }

      const existing = await prisma.lesson.findUnique({
        where: {
          unitId_order: {
            unitId,
            order: lesson.order
          }
        }
      });

      if (existing) {
        lessonKeyToId.set(`${lesson.courseSlug}:${lesson.unitOrder}:${lesson.order}`, existing.id);
        if (conflictStrategy === 'replace') {
          await prisma.lesson.update({
            where: { id: existing.id },
            data: {
              title: lesson.title,
              description: lesson.description,
              isOptionalGrammar: lesson.isOptionalGrammar
            }
          });
        }
      } else {
        const created = await prisma.lesson.create({
          data: {
            unitId,
            order: lesson.order,
            title: lesson.title,
            description: lesson.description,
            isOptionalGrammar: lesson.isOptionalGrammar
          }
        });
        lessonKeyToId.set(`${lesson.courseSlug}:${lesson.unitOrder}:${lesson.order}`, created.id);
      }
    }

    for (const exercise of payload.exercises) {
      const lessonId = lessonKeyToId.get(
        `${exercise.courseSlug}:${exercise.unitOrder}:${exercise.lessonOrder}`
      );
      if (!lessonId) {
        continue;
      }

      const existing = await prisma.exercise.findFirst({
        where: {
          lessonId,
          order: exercise.order
        }
      });

      let exerciseId: string;

      if (existing) {
        exerciseId = existing.id;
        if (conflictStrategy === 'replace') {
          await prisma.exercise.update({
            where: { id: existing.id },
            data: {
              type: toExerciseType(exercise.type),
              modality: toExerciseModality(exercise.modality),
              promptText: exercise.promptText,
              difficulty: exercise.difficulty,
              data: serializeExerciseData(exercise.data)
            }
          });
        }
      } else {
        const created = await prisma.exercise.create({
          data: {
            lessonId,
            order: exercise.order,
            type: toExerciseType(exercise.type),
            modality: toExerciseModality(exercise.modality),
            promptText: exercise.promptText,
            difficulty: exercise.difficulty,
              data: serializeExerciseData(exercise.data)
          }
        });
        exerciseId = created.id;
      }

      if (conflictStrategy === 'replace') {
        await prisma.exerciseItem.deleteMany({ where: { exerciseId } });
        await prisma.exercisePattern.deleteMany({ where: { exerciseId } });
      }

      for (const itemKey of exercise.itemKeys) {
        const itemId = itemMap.get(itemKey);
        if (!itemId) {
          continue;
        }

        await prisma.exerciseItem.upsert({
          where: {
            exerciseId_itemId: {
              exerciseId,
              itemId
            }
          },
          create: {
            exerciseId,
            itemId
          },
          update: {}
        });
      }

      for (const patternKey of exercise.patternKeys) {
        const patternId = patternMap.get(patternKey);
        if (!patternId) {
          continue;
        }

        await prisma.exercisePattern.upsert({
          where: {
            exerciseId_patternId: {
              exerciseId,
              patternId
            }
          },
          create: {
            exerciseId,
            patternId
          },
          update: {}
        });
      }
    }

    return {
      success: true,
      imported: {
        courses: payload.courses.length,
        units: payload.units.length,
        lessons: payload.lessons.length,
        patterns: payload.patterns.length,
        items: payload.items.length,
        exercises: payload.exercises.length
      }
    };
  });
}
