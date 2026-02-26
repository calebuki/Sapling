export const ATTEMPT_RESULTS = ['exact', 'near_miss', 'incorrect'] as const;
export type AttemptResult = (typeof ATTEMPT_RESULTS)[number];

export const ATTEMPT_REASON_CODES = [
  'exact_match',
  'accent_only',
  'edit_distance',
  'token_swap',
  'asr_subsequence',
  'no_match'
] as const;
export type AttemptReasonCode = (typeof ATTEMPT_REASON_CODES)[number];

export const EXERCISE_TYPES = [
  'listen_pick_image',
  'image_pick_word',
  'listen_type',
  'tile_order',
  'speak_repeat',
  'phrase_complete'
] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export const EXERCISE_MODALITIES = ['listen', 'speak', 'type', 'mixed'] as const;
export type ExerciseModality = (typeof EXERCISE_MODALITIES)[number];

export type ExerciseData = {
  prompt?: string;
  answers: string[];
  options?: string[];
  imageChoices?: string[];
  hint?: string;
  audioText?: string;
  playbackRate?: 'slow' | 'normal';
};

export type SessionExercise = {
  id: string;
  lessonId: string | null;
  type: ExerciseType;
  modality: ExerciseModality;
  promptText: string | null;
  difficulty: number;
  data: ExerciseData;
  itemIds: string[];
  patternIds: string[];
  isReview: boolean;
};

export interface ThemeTokens {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  text: string;
  node: string;
  nodeCompleted: string;
  nodeLocked: string;
}

export interface SceneProgression {
  stage: number;
  key: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface UserItemStateSnapshot {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextDueAt: Date;
  lastReviewedAt: Date | null;
  lapses: number;
}

export interface AttemptClassification {
  result: AttemptResult;
  reasonCode: AttemptReasonCode;
  bestMatch: string;
  metrics: {
    distance: number;
    threshold: number;
    normalizedInput: string;
    normalizedTarget: string;
    normalizedInputNoDiacritics: string;
    normalizedTargetNoDiacritics: string;
    tokenSwap: boolean;
    asrSubsequence: boolean;
  };
}
