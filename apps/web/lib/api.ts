import { type SessionExercise } from '@sapling/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(typeof error.error === 'string' ? error.error : JSON.stringify(error.error));
  }

  return response.json() as Promise<T>;
}

export type ProfileSummary = {
  id: string;
  name: string;
  isGuest: boolean;
  hasPin: boolean;
  dailyGoalMinutes: number;
  targetLanguage: string;
  nativeLanguage: string;
  xpTotal?: number;
  streakCurrent?: number;
  sceneStage?: number;
};

export type CourseMapResponse = {
  course: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    targetLanguage: string;
    nativeLanguage: string;
    units: Array<{
      id: string;
      order: number;
      title: string;
      description: string | null;
      phase: string;
      isGrammar: boolean;
      unlocked: boolean;
      completed: boolean;
      lessons: Array<{
        id: string;
        order: number;
        title: string;
        description: string | null;
        isOptionalGrammar: boolean;
        unlocked: boolean;
        completed: boolean;
      }>;
    }>;
  };
  dueReviews: number;
  nextLessonId: string | null;
  sceneStage: number;
};

export type StartSessionResponse = {
  sessionId: string;
  lesson: {
    id: string;
    title: string;
    unitOrder: number;
    unitTitle: string;
  };
  exercises: SessionExercise[];
};

export type SubmitAttemptResponse = {
  result: 'exact' | 'near_miss' | 'incorrect';
  reasonCode: string;
  bestMatch: string;
  countsAsCorrect: boolean;
  xpAwarded: number;
  correctAnswer: string;
  replayText: string;
  tip: string;
  metrics: Record<string, unknown>;
};

export type ProgressResponse = {
  streakCurrent: number;
  streakBest: number;
  xpTotal: number;
  dueReviews: number;
  sceneStage: number;
  saplingGrowth: number;
  strengths: Array<{
    itemId: string;
    phrase: string;
    strength: number;
    nextDueAt: string;
  }>;
  recentActivity: Array<{
    date: string;
    xpEarned: number;
    minutes: number;
  }>;
};

export async function listProfiles() {
  return apiFetch<{ profiles: ProfileSummary[] }>('/profiles');
}

export async function createProfile(input: {
  name: string;
  pin?: string;
  dailyGoalMinutes?: number;
}) {
  return apiFetch<{ profile: ProfileSummary }>('/profiles', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function loginProfile(input: { profileId: string; pin?: string }) {
  return apiFetch<{ success: boolean; profile: ProfileSummary }>('/profiles/login', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function upgradeGuestProfile(
  profileId: string,
  input: {
    name: string;
    pin?: string;
  }
) {
  return apiFetch<{ profile: ProfileSummary }>(`/profiles/${profileId}/upgrade`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateProfileSettings(
  profileId: string,
  input: {
    dailyGoalMinutes?: number;
    targetLanguage?: string;
    nativeLanguage?: string;
  }
) {
  return apiFetch<{ profile: ProfileSummary }>(`/profiles/${profileId}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  });
}

export async function getCourseMap(profileId: string) {
  return apiFetch<CourseMapResponse>(`/course-map?profileId=${profileId}`);
}

export async function startSession(input: { profileId: string; lessonId: string }) {
  return apiFetch<StartSessionResponse>('/sessions/start', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function submitAttempt(input: {
  profileId: string;
  exerciseId: string;
  answer: string;
  mode: 'typed' | 'choice' | 'asr' | 'speak';
  sessionId?: string;
  inSession?: boolean;
}) {
  return apiFetch<SubmitAttemptResponse>('/sessions/attempt', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function completeSession(input: {
  profileId: string;
  lessonId: string;
  accuracy: number;
  xpEarned: number;
  strengthenedItemIds: string[];
}) {
  return apiFetch<{
    completionId: string;
    xpEarned: number;
    accuracy: number;
    strengthenedItems: string[];
    dueReviews: number;
    speakingPracticeRecommended: boolean;
  }>('/sessions/complete', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function getProgress(profileId: string) {
  return apiFetch<ProgressResponse>(`/progress/${profileId}`);
}

export async function transcribeStub(input: { audioBase64?: string; language?: string; hintText?: string }) {
  return apiFetch<{ transcript: string; confidence: number; status: string; message: string }>(
    '/asr/transcribe',
    {
      method: 'POST',
      body: JSON.stringify(input)
    }
  );
}

export async function devOverview() {
  return apiFetch<{
    courses: Array<{ id: string; slug: string; title: string; description: string | null }>;
    units: Array<{ id: string; courseId: string; order: number; title: string; phase: string }>;
    lessons: Array<{ id: string; unitId: string; order: number; title: string }>;
    items: Array<{
      id: string;
      key: string;
      sourceText: string;
      targetText: string;
      imagePath: string | null;
      audioText: string | null;
    }>;
    patterns: Array<{ id: string; key: string; name: string; description: string | null }>;
    exercises: Array<{
      id: string;
      lessonId: string | null;
      order: number;
      type: string;
      modality: string;
      promptText: string | null;
      data: Record<string, unknown>;
      itemLinks: Array<{ itemId: string }>;
      patternLinks: Array<{ patternId: string }>;
    }>;
  }>('/dev/overview');
}

export async function createDevEntity<T>(
  resource: 'courses' | 'units' | 'lessons' | 'items' | 'patterns' | 'exercises',
  body: Record<string, unknown>
) {
  return apiFetch<T>(`/dev/${resource}`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function updateDevEntity<T>(
  resource: 'courses' | 'units' | 'lessons' | 'items' | 'patterns' | 'exercises',
  id: string,
  body: Record<string, unknown>
) {
  return apiFetch<T>(`/dev/${resource}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });
}

export async function deleteDevEntity(
  resource: 'courses' | 'units' | 'lessons' | 'items' | 'patterns' | 'exercises',
  id: string
) {
  return apiFetch<{ success: boolean }>(`/dev/${resource}/${id}`, {
    method: 'DELETE'
  });
}

export async function exportContent() {
  return apiFetch<Record<string, unknown>>('/dev/export');
}

export async function importContent(payload: Record<string, unknown>, conflictStrategy: 'skip' | 'replace') {
  return apiFetch<{ success: boolean; imported: Record<string, number> }>('/dev/import', {
    method: 'POST',
    body: JSON.stringify({ payload, conflictStrategy })
  });
}
