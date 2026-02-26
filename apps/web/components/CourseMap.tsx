'use client';

import type { CourseMapResponse } from '../lib/api';
import { PillButton } from './PillButton';

type CourseMapProps = {
  data: CourseMapResponse;
  onStartLesson: (lessonId: string) => void;
  startLoading?: boolean;
};

export function CourseMap({ data, onStartLesson, startLoading = false }: CourseMapProps) {
  return (
    <section className="space-y-6 rounded-3xl bg-white p-6 shadow-bubble">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold text-sapling-800">{data.course.title}</h2>
          <p className="max-w-2xl text-sm text-sapling-700">{data.course.description}</p>
        </div>

        <div className="rounded-2xl bg-earth-cream px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-earth-brown">Due Reviews</p>
          <p className="font-display text-2xl font-bold text-earth-blue">{data.dueReviews}</p>
        </div>
      </div>

      <div className="space-y-8">
        {data.course.units.map((unit) => (
          <article key={unit.id} className="rounded-3xl border border-sapling-100 bg-sapling-50/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-earth-brown">
                  Unit {unit.order} · {unit.phase.replace('_', ' ')}
                </p>
                <h3 className="font-display text-2xl font-bold text-sapling-800">{unit.title}</h3>
              </div>
              {!unit.unlocked && (
                <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-700">
                  Locked
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4">
              {unit.lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  disabled={!lesson.unlocked}
                  onClick={() => onStartLesson(lesson.id)}
                  className={[
                    'group relative h-28 rounded-3xl border-2 p-4 text-left transition disabled:cursor-not-allowed',
                    lesson.completed
                      ? 'border-sapling-500 bg-sapling-500 text-white'
                      : lesson.unlocked
                        ? 'border-sapling-200 bg-white hover:-translate-y-1 hover:shadow-lg'
                        : 'border-stone-200 bg-stone-100 text-stone-500'
                  ].join(' ')}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Lesson {lesson.order}</p>
                  <p className="mt-2 font-display text-lg font-bold">{lesson.title}</p>
                  {lesson.isOptionalGrammar && (
                    <span className="absolute right-3 top-3 rounded-full bg-earth-yellow px-2 py-0.5 text-[10px] font-bold text-earth-brown">
                      Clarifier
                    </span>
                  )}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>

      {data.nextLessonId && (
        <div className="flex justify-end">
          <PillButton disabled={startLoading} onClick={() => onStartLesson(data.nextLessonId!)}>
            Start Next Lesson
          </PillButton>
        </div>
      )}
    </section>
  );
}
