import type { ExerciseData, SessionExercise } from '@sapling/shared';
import prismaClientPkg from '@prisma/client';

const { ExerciseModality, ExerciseType } = prismaClientPkg;

type PrismaExerciseType = (typeof ExerciseType)[keyof typeof ExerciseType];
type PrismaExerciseModality = (typeof ExerciseModality)[keyof typeof ExerciseModality];

export function mapExerciseType(type: PrismaExerciseType): SessionExercise['type'] {
  switch (type) {
    case ExerciseType.LISTEN_PICK_IMAGE:
      return 'listen_pick_image';
    case ExerciseType.IMAGE_PICK_WORD:
      return 'image_pick_word';
    case ExerciseType.LISTEN_TYPE:
      return 'listen_type';
    case ExerciseType.TILE_ORDER:
      return 'tile_order';
    case ExerciseType.SPEAK_REPEAT:
      return 'speak_repeat';
    case ExerciseType.PHRASE_COMPLETE:
      return 'phrase_complete';
    default:
      return 'image_pick_word';
  }
}

export function mapExerciseModality(modality: PrismaExerciseModality): SessionExercise['modality'] {
  switch (modality) {
    case ExerciseModality.LISTEN:
      return 'listen';
    case ExerciseModality.SPEAK:
      return 'speak';
    case ExerciseModality.TYPE:
      return 'type';
    case ExerciseModality.MIXED:
      return 'mixed';
    default:
      return 'mixed';
  }
}

export function toExerciseType(type: SessionExercise['type']): PrismaExerciseType {
  switch (type) {
    case 'listen_pick_image':
      return ExerciseType.LISTEN_PICK_IMAGE;
    case 'image_pick_word':
      return ExerciseType.IMAGE_PICK_WORD;
    case 'listen_type':
      return ExerciseType.LISTEN_TYPE;
    case 'tile_order':
      return ExerciseType.TILE_ORDER;
    case 'speak_repeat':
      return ExerciseType.SPEAK_REPEAT;
    case 'phrase_complete':
      return ExerciseType.PHRASE_COMPLETE;
    default:
      return ExerciseType.IMAGE_PICK_WORD;
  }
}

export function toExerciseModality(modality: SessionExercise['modality']): PrismaExerciseModality {
  switch (modality) {
    case 'listen':
      return ExerciseModality.LISTEN;
    case 'speak':
      return ExerciseModality.SPEAK;
    case 'type':
      return ExerciseModality.TYPE;
    case 'mixed':
      return ExerciseModality.MIXED;
    default:
      return ExerciseModality.MIXED;
  }
}

export function parseExerciseData(data: unknown): ExerciseData {
  let parsed: unknown = data;

  if (typeof data === 'string') {
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = {};
    }
  }

  const value =
    typeof parsed === 'object' && parsed !== null ? (parsed as Partial<ExerciseData>) : {};

  return {
    answers: Array.isArray(value.answers)
      ? value.answers.filter((answer): answer is string => typeof answer === 'string')
      : [],
    prompt: typeof value.prompt === 'string' ? value.prompt : undefined,
    options: Array.isArray(value.options)
      ? value.options.filter((option): option is string => typeof option === 'string')
      : undefined,
    imageChoices: Array.isArray(value.imageChoices)
      ? value.imageChoices.filter((option): option is string => typeof option === 'string')
      : undefined,
    hint: typeof value.hint === 'string' ? value.hint : undefined,
    audioText: typeof value.audioText === 'string' ? value.audioText : undefined,
    playbackRate:
      value.playbackRate === 'slow' || value.playbackRate === 'normal' ? value.playbackRate : undefined
  };
}

export function serializeExerciseData(data: unknown): string {
  return JSON.stringify(parseExerciseData(data));
}
