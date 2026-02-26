'use client';

import { useQuery } from '@tanstack/react-query';
import { exportContent } from '../../lib/api';

export default function ContentViewerPage() {
  const contentQuery = useQuery({
    queryKey: ['content-export'],
    queryFn: exportContent
  });

  if (contentQuery.isLoading) {
    return <section className="rounded-3xl bg-white p-8 shadow-bubble">Loading seeded content…</section>;
  }

  if (contentQuery.error || !contentQuery.data) {
    return (
      <section className="rounded-3xl bg-rose-50 p-8 text-rose-700 shadow-bubble">
        Failed to load content: {(contentQuery.error as Error | undefined)?.message}
      </section>
    );
  }

  const data = contentQuery.data as {
    units?: Array<{
      courseSlug: string;
      order: number;
      title: string;
      description?: string;
      phase: string;
    }>;
    lessons?: Array<{
      courseSlug: string;
      unitOrder: number;
      order: number;
      title: string;
      description?: string;
    }>;
    items?: Array<{
      key: string;
      sourceText: string;
      targetText: string;
      imagePath?: string;
      patternKeys: string[];
    }>;
    patterns?: Array<{
      key: string;
      name: string;
      description?: string;
    }>;
    exercises?: Array<{
      courseSlug: string;
      unitOrder: number;
      lessonOrder: number;
      order: number;
      type: string;
      modality: string;
      itemKeys: string[];
      patternKeys: string[];
      data: Record<string, unknown>;
    }>;
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-8 shadow-bubble">
        <h1 className="font-display text-4xl font-bold text-sapling-800">Content Viewer</h1>
        <p className="mt-2 text-sapling-700">
          Read-only view of seeded course data (Units 1–3) including items, patterns, and exercises.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-6">
        <article className="rounded-3xl bg-white p-6 shadow-bubble">
          <h2 className="font-display text-2xl font-bold text-sapling-800">Units</h2>
          <div className="mt-4 space-y-3">
            {(data.units ?? []).map((unit) => (
              <div key={`${unit.courseSlug}-${unit.order}`} className="rounded-2xl bg-sapling-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-earth-brown">Unit {unit.order}</p>
                <p className="font-semibold text-sapling-800">{unit.title}</p>
                <p className="text-sm text-sapling-700">{unit.phase}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-bubble">
          <h2 className="font-display text-2xl font-bold text-sapling-800">Patterns</h2>
          <div className="mt-4 space-y-3">
            {(data.patterns ?? []).map((pattern) => (
              <div key={pattern.key} className="rounded-2xl bg-earth-cream p-3">
                <p className="font-semibold text-earth-brown">{pattern.key}</p>
                <p className="text-sm text-sapling-800">{pattern.name}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-bubble">
        <h2 className="font-display text-2xl font-bold text-sapling-800">Items</h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {(data.items ?? []).map((item) => (
            <article key={item.key} className="rounded-2xl border border-sapling-100 bg-sapling-50/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-earth-brown">{item.sourceText}</p>
              <p className="font-semibold text-sapling-800">{item.targetText}</p>
              <p className="text-xs text-sapling-700">patterns: {item.patternKeys.join(', ')}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-bubble">
        <h2 className="font-display text-2xl font-bold text-sapling-800">Exercises</h2>
        <div className="mt-4 space-y-3">
          {(data.exercises ?? []).map((exercise) => (
            <article
              key={`${exercise.unitOrder}-${exercise.lessonOrder}-${exercise.order}-${exercise.type}`}
              className="rounded-2xl border border-sapling-100 p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-earth-brown">
                Unit {exercise.unitOrder} · Lesson {exercise.lessonOrder} · #{exercise.order}
              </p>
              <p className="font-semibold text-sapling-800">
                {exercise.type} ({exercise.modality})
              </p>
              <p className="text-sm text-sapling-700">items: {exercise.itemKeys.join(', ')}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
