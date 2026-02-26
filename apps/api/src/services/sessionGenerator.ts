import {
  COMPREHENSION_PHASE_UNITS,
  REVIEW_INJECTION_LIMIT,
  SESSION_DEFAULT_EXERCISE_COUNT,
  selectDueItems,
  type SessionExercise
} from '@sapling/shared';
import { prisma } from '../db';
import { mapExerciseModality, mapExerciseType, parseExerciseData } from '../utils/exercise';

type LoadedExercise = {
  id: string;
  lessonId: string | null;
  order: number;
  type: string;
  modality: string;
  promptText: string | null;
  difficulty: number;
  data: string;
  itemLinks: Array<{ itemId: string; item: { id: string; targetText: string } }>;
  patternLinks: Array<{ patternId: string; pattern: { id: string; key: string } }>;
};

function isRecognitionExercise(type: SessionExercise['type']) {
  return type === 'listen_pick_image' || type === 'image_pick_word';
}

function toSessionExercise(exercise: LoadedExercise, isReview: boolean): SessionExercise {
  return {
    id: exercise.id,
    lessonId: exercise.lessonId,
    type: mapExerciseType(exercise.type as never),
    modality: mapExerciseModality(exercise.modality as never),
    promptText: exercise.promptText,
    difficulty: exercise.difficulty,
    data: parseExerciseData(exercise.data),
    itemIds: exercise.itemLinks.map((link) => link.itemId),
    patternIds: exercise.patternLinks.map((link) => link.patternId),
    isReview
  };
}

function reorderByComplexity(exercises: SessionExercise[], unitOrder: number): SessionExercise[] {
  const recognition = exercises.filter((exercise) => isRecognitionExercise(exercise.type));
  const guidedProduction = exercises.filter(
    (exercise) =>
      exercise.type === 'listen_type' ||
      exercise.type === 'tile_order' ||
      exercise.type === 'phrase_complete'
  );
  const speaking = exercises.filter((exercise) => exercise.type === 'speak_repeat');

  if (unitOrder <= COMPREHENSION_PHASE_UNITS) {
    const cappedProduction = [...guidedProduction, ...speaking].slice(0, 2);
    return [...recognition, ...cappedProduction];
  }

  return [...recognition, ...guidedProduction, ...speaking];
}

function injectReviews(baseExercises: SessionExercise[], reviewExercises: SessionExercise[]) {
  const output: SessionExercise[] = [];
  let reviewIndex = 0;

  for (let index = 0; index < baseExercises.length; index += 1) {
    output.push(baseExercises[index]);

    if ((index + 1) % 3 === 0 && reviewIndex < reviewExercises.length) {
      output.push(reviewExercises[reviewIndex]);
      reviewIndex += 1;
    }
  }

  while (reviewIndex < reviewExercises.length) {
    output.push(reviewExercises[reviewIndex]);
    reviewIndex += 1;
  }

  return output;
}

export async function generateSession(profileId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      unit: true,
      exercises: {
        orderBy: { order: 'asc' },
        include: {
          itemLinks: { include: { item: true } },
          patternLinks: { include: { pattern: true } }
        }
      }
    }
  });

  if (!lesson) {
    throw new Error('Lesson not found');
  }

  const now = new Date();

  const dueStates = await prisma.userItemState.findMany({
    where: {
      profileId,
      nextDueAt: { lte: now }
    },
    orderBy: [{ nextDueAt: 'asc' }, { lapses: 'desc' }]
  });

  const dueItems = selectDueItems(
    dueStates.map((state) => ({
      itemId: state.itemId,
      nextDueAt: state.nextDueAt,
      lapses: state.lapses,
      repetitions: state.repetitions
    })),
    now,
    REVIEW_INJECTION_LIMIT
  );

  const dueItemIds = dueItems.map((item) => item.itemId);

  const dueExercisePool = dueItemIds.length
    ? await prisma.exercise.findMany({
        where: {
          itemLinks: {
            some: {
              itemId: {
                in: dueItemIds
              }
            }
          }
        },
        include: {
          itemLinks: { include: { item: true } },
          patternLinks: { include: { pattern: true } }
        },
        orderBy: [{ difficulty: 'asc' }, { id: 'asc' }]
      })
    : [];

  const baseExercises = reorderByComplexity(
    lesson.exercises.map((exercise) => toSessionExercise(exercise as LoadedExercise, false)),
    lesson.unit.order
  );

  const reviewExercises = dueItemIds
    .map((itemId) => {
      const candidates = dueExercisePool.filter((exercise) =>
        exercise.itemLinks.some((link) => link.itemId === itemId)
      );

      if (!candidates.length) {
        return null;
      }

      const selected =
        candidates.find((candidate) => isRecognitionExercise(mapExerciseType(candidate.type))) ??
        candidates[0];

      return toSessionExercise(selected as LoadedExercise, true);
    })
    .filter((exercise): exercise is SessionExercise => exercise !== null);

  const ordered = injectReviews(baseExercises, reviewExercises);
  const minimumExercises = Math.min(Math.max(ordered.length, 6), 12);
  const targetCount = Math.min(Math.max(SESSION_DEFAULT_EXERCISE_COUNT, minimumExercises), 12);

  return {
    sessionId: crypto.randomUUID(),
    lesson: {
      id: lesson.id,
      title: lesson.title,
      unitOrder: lesson.unit.order,
      unitTitle: lesson.unit.title
    },
    exercises: ordered.slice(0, targetCount)
  };
}
