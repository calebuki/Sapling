'use client';

import { useQuery } from '@tanstack/react-query';
import { getProgress } from '../../lib/api';
import { useAppStore } from '../../lib/store';

export default function ProgressPage() {
  const profile = useAppStore((state) => state.profile);

  const progressQuery = useQuery({
    queryKey: ['progress', profile?.id],
    queryFn: () => getProgress(profile!.id),
    enabled: Boolean(profile?.id)
  });

  if (!profile) {
    return (
      <section className="rounded-3xl bg-white p-8 shadow-bubble">
        <h1 className="font-display text-3xl font-bold text-sapling-800">Progress</h1>
        <p className="text-sapling-700">Log into a profile to view progress stats.</p>
      </section>
    );
  }

  if (progressQuery.isLoading) {
    return <section className="rounded-3xl bg-white p-8 shadow-bubble">Loading progress…</section>;
  }

  if (progressQuery.error || !progressQuery.data) {
    return (
      <section className="rounded-3xl bg-rose-50 p-8 text-rose-700 shadow-bubble">
        Failed to load progress: {(progressQuery.error as Error | undefined)?.message}
      </section>
    );
  }

  const progress = progressQuery.data;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-8 shadow-bubble">
        <h1 className="font-display text-4xl font-bold text-sapling-800">Progress</h1>
        <p className="mt-2 text-sapling-700">Track your streak, XP, due reviews, and strongest phrases.</p>
      </section>

      <section className="grid grid-cols-4 gap-4">
        <article className="rounded-2xl bg-white p-5 shadow-bubble">
          <p className="text-xs uppercase tracking-wide text-earth-brown">Current streak</p>
          <p className="font-display text-3xl font-bold text-sapling-800">{progress.streakCurrent}</p>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow-bubble">
          <p className="text-xs uppercase tracking-wide text-earth-brown">Best streak</p>
          <p className="font-display text-3xl font-bold text-earth-blue">{progress.streakBest}</p>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow-bubble">
          <p className="text-xs uppercase tracking-wide text-earth-brown">XP total</p>
          <p className="font-display text-3xl font-bold text-sapling-800">{progress.xpTotal}</p>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow-bubble">
          <p className="text-xs uppercase tracking-wide text-earth-brown">Due reviews</p>
          <p className="font-display text-3xl font-bold text-earth-blue">{progress.dueReviews}</p>
        </article>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-bubble">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-sapling-800">Sapling Growth</h2>
          <p className="text-sm font-semibold text-earth-brown">Scene stage: {progress.sceneStage}</p>
        </div>
        <div className="h-5 overflow-hidden rounded-full bg-sapling-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sapling-400 via-sapling-500 to-earth-blue transition-all"
            style={{ width: `${progress.saplingGrowth}%` }}
          />
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-bubble">
        <h2 className="font-display text-2xl font-bold text-sapling-800">Strengths</h2>
        {progress.strengths.length === 0 ? (
          <p className="mt-2 text-sapling-700">No strengths yet. Complete a few lesson exercises first.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {progress.strengths.map((entry) => (
              <article key={entry.itemId} className="rounded-2xl border border-sapling-100 bg-sapling-50/50 p-4">
                <p className="font-semibold text-sapling-800">{entry.phrase}</p>
                <p className="text-sm text-sapling-700">Strength: {entry.strength.toFixed(2)}</p>
                <p className="text-xs text-earth-brown">Next due: {new Date(entry.nextDueAt).toLocaleString()}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
