'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { CourseMap } from '../components/CourseMap';
import { PillButton } from '../components/PillButton';
import { getCourseMap, listProfiles } from '../lib/api';
import { useAppStore } from '../lib/store';
import { sceneProgression } from '../lib/theme';

export default function HomePage() {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const setProfile = useAppStore((state) => state.setProfile);

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
    queryKey: ['course-map', activeProfileId],
    queryFn: () => getCourseMap(activeProfileId!),
    enabled: Boolean(activeProfileId)
  });

  const scene = sceneProgression.find((entry) => entry.stage === (mapQuery.data?.sceneStage ?? 0));

  return (
    <div className="space-y-6">
      {(profilesQuery.isLoading || mapQuery.isLoading) && (
        <section className="rounded-3xl bg-white p-8 shadow-bubble">Loading course map…</section>
      )}

      {mapQuery.data && (
        <>
          <section className="grid grid-cols-[2fr_1fr] gap-6">
            <div className="rounded-3xl bg-sapling-600 p-6 text-white shadow-bubble">
              <p className="text-xs font-semibold uppercase tracking-wide text-sapling-100">Scene Stage</p>
              <h1 className="font-display text-4xl font-bold">{scene?.title ?? 'Seed Stage'}</h1>
              <p className="mt-2 text-sapling-50">{scene?.description}</p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-bubble">
              <p className="text-xs font-semibold uppercase tracking-wide text-earth-brown">Quick Actions</p>
              <div className="mt-4 flex flex-col gap-3">
                <PillButton
                  onClick={() => {
                    if (!mapQuery.data?.nextLessonId) {
                      return;
                    }
                    router.push(`/lesson/${mapQuery.data.nextLessonId}`);
                  }}
                  disabled={!mapQuery.data.nextLessonId}
                >
                  Start Next Lesson
                </PillButton>
                <PillButton variant="ghost" onClick={() => router.push('/onboarding')}>
                  Audio & Goal Setup
                </PillButton>
                <Link href="/progress" className="rounded-full bg-earth-cream px-5 py-3 text-center font-semibold text-earth-blue">
                  View Progress
                </Link>
              </div>
            </div>
          </section>

          <CourseMap
            data={mapQuery.data}
            onStartLesson={(lessonId) => router.push(`/lesson/${lessonId}`)}
            startLoading={false}
          />
        </>
      )}

      {profilesQuery.error && (
        <section className="rounded-3xl bg-rose-50 p-6 text-rose-700 shadow-bubble">
          Failed to load local profile: {(profilesQuery.error as Error).message}
        </section>
      )}

      {mapQuery.error && (
        <section className="rounded-3xl bg-rose-50 p-6 text-rose-700 shadow-bubble">
          Failed to load course map: {(mapQuery.error as Error).message}
        </section>
      )}
    </div>
  );
}
