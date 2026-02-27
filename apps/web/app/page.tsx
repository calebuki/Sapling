'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';
import { CourseMap } from '../components/CourseMap';
import { PillButton } from '../components/PillButton';
import { getCourseMap, listProfiles } from '../lib/api';
import { getLearningLanguageMeta, isSeededLearningLanguage } from '../lib/languages';
import { useAppStore } from '../lib/store';
import { sceneProgression } from '../lib/theme';

export default function HomePage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const setProfile = useAppStore((state) => state.setProfile);
  const activeLearningLanguage = useAppStore((state) => state.activeLearningLanguage);
  const bottomFocusRef = useRef<HTMLDivElement | null>(null);
  const activeLanguageMeta = getLearningLanguageMeta(activeLearningLanguage);
  const isSeededLanguage = isSeededLearningLanguage(activeLearningLanguage);

  const profilesQuery = useQuery({
    queryKey: ['profiles', 'autoselect'],
    queryFn: listProfiles
  });

  const fallbackProfile = useMemo(() => {
    const profiles = profilesQuery.data?.profiles ?? [];
    return profiles.find((entry) => entry.isGuest) ?? profiles[0] ?? null;
  }, [profilesQuery.data?.profiles]);

  useEffect(() => {
    if (!fallbackProfile) {
      return;
    }

    if (profile?.id === fallbackProfile.id) {
      return;
    }

    setProfile(fallbackProfile);
  }, [fallbackProfile, profile?.id, setProfile]);

  const activeProfileId = profile?.id ?? fallbackProfile?.id;

  const mapQuery = useQuery({
    queryKey: ['course-map', activeProfileId, activeLearningLanguage],
    queryFn: () => getCourseMap(activeProfileId!),
    enabled: Boolean(activeProfileId) && isSeededLanguage
  });

  const scene = sceneProgression.find((entry) => entry.stage === (mapQuery.data?.sceneStage ?? 0));

  useEffect(() => {
    if (isSeededLanguage && !mapQuery.data) {
      return;
    }

    bottomFocusRef.current?.scrollIntoView({
      block: 'end',
      behavior: 'auto'
    });
  }, [activeLearningLanguage, isSeededLanguage, mapQuery.data]);

  return (
    <div className="space-y-6">
      {(profilesQuery.isLoading || (isSeededLanguage && mapQuery.isLoading)) && (
        <section className="rounded-3xl bg-white p-8 shadow-bubble">Loading course map…</section>
      )}

      {isSeededLanguage && mapQuery.data && (
        <>
          <CourseMap
            data={mapQuery.data}
            onStartLesson={(lessonId) => router.push(`/lesson/${lessonId}`)}
          />

          <section className="grid grid-cols-[2fr_1fr] gap-6">
            <div className="rounded-3xl bg-sapling-600 p-6 text-white shadow-bubble">
              <p className="text-xs font-semibold uppercase tracking-wide text-sapling-100">Scene Stage</p>
              <h1 className="font-display text-4xl font-bold">{scene?.title ?? 'Seed Stage'}</h1>
              <p className="mt-2 text-sapling-50">{scene?.description}</p>
            </div>

            <PillButton
              onClick={() => {
                if (!mapQuery.data?.nextLessonId) {
                  return;
                }
                router.push(`/lesson/${mapQuery.data.nextLessonId}`);
              }}
              disabled={!mapQuery.data.nextLessonId}
              className="h-full min-h-[180px] w-full rounded-3xl px-8 py-7 text-center font-display text-5xl leading-tight shadow-bubble"
            >
              Start Next Lesson
            </PillButton>
          </section>
          <div ref={bottomFocusRef} aria-hidden />
        </>
      )}

      {!isSeededLanguage && (
        <>
          <section className="rounded-3xl bg-white p-8 shadow-bubble">
            <p className="text-xs font-semibold uppercase tracking-wide text-earth-brown">Course Map</p>
            <h1 className="mt-2 font-display text-4xl font-bold text-sapling-900">
              {activeLanguageMeta.flag} {activeLanguageMeta.label} is coming soon
            </h1>
            <p className="mt-2 max-w-3xl text-sapling-700">
              Real course data will appear here when this language is seeded. You can still switch
              languages from the header selector.
            </p>
          </section>

          <section className="grid grid-cols-[2fr_1fr] gap-6">
            <div className="rounded-3xl bg-sapling-600 p-6 text-white shadow-bubble">
              <p className="text-xs font-semibold uppercase tracking-wide text-sapling-100">Scene Stage</p>
              <h1 className="font-display text-4xl font-bold">Seed Stage</h1>
              <p className="mt-2 text-sapling-50">
                Start here once {activeLanguageMeta.label} course content is available.
              </p>
            </div>

            <PillButton
              disabled
              className="h-full min-h-[180px] w-full rounded-3xl px-8 py-7 text-center font-display text-5xl leading-tight shadow-bubble"
            >
              Start Next Lesson
            </PillButton>
          </section>
          <div ref={bottomFocusRef} aria-hidden />
        </>
      )}

      {profilesQuery.error && (
        <section className="rounded-3xl bg-rose-50 p-6 text-rose-700 shadow-bubble">
          Failed to load local profile: {(profilesQuery.error as Error).message}
        </section>
      )}

      {isSeededLanguage && mapQuery.error && (
        <section className="rounded-3xl bg-rose-50 p-6 text-rose-700 shadow-bubble">
          Failed to load course map: {(mapQuery.error as Error).message}
        </section>
      )}
    </div>
  );
}
