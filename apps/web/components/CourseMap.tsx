'use client';

import { useMemo } from 'react';
import type { CourseMapResponse } from '../lib/api';

type CourseMapProps = {
  data: CourseMapResponse;
  onStartLesson: (lessonId: string) => void;
};

type StageKey = 'canopy' | 'young_tree' | 'sapling' | 'sprouting';

type StageConfig = {
  key: StageKey;
  title: string;
  subtitle: string;
  description: string;
  sectionClassName: string;
  titleClassName: string;
  badgeClassName: string;
  comingSoonClassName: string;
};

const stageConfigs: StageConfig[] = [
  {
    key: 'canopy',
    title: 'Canopy',
    subtitle: 'Fluent Thought Space',
    description: 'High-complexity topics and nuanced expression.',
    sectionClassName: 'border-[#97b5c9] bg-[linear-gradient(135deg,#eaf4fb_0%,#dbeaf5_100%)]',
    titleClassName: 'text-[#2f5d7a]',
    badgeClassName: 'bg-[#5c88a7] text-white',
    comingSoonClassName: 'border-[#a4bfd0] bg-[#f3f8fc] text-[#4c738e]'
  },
  {
    key: 'young_tree',
    title: 'Young Tree',
    subtitle: 'Conversation Expansion',
    description: 'Broader speaking confidence with stronger syntax.',
    sectionClassName: 'border-[#8fb889] bg-[linear-gradient(135deg,#e7f5e3_0%,#d6ebcf_100%)]',
    titleClassName: 'text-[#2e5e34]',
    badgeClassName: 'bg-[#5f9460] text-white',
    comingSoonClassName: 'border-[#a7c99f] bg-[#f1f8ee] text-[#517f52]'
  },
  {
    key: 'sapling',
    title: 'Sapling',
    subtitle: 'Topic Broadening',
    description: 'Major jump from basics into richer contexts and production.',
    sectionClassName: 'border-[#c4ad84] bg-[linear-gradient(135deg,#fbf2df_0%,#f2e1be_100%)]',
    titleClassName: 'text-[#6d5534]',
    badgeClassName: 'bg-[#b58a4c] text-white',
    comingSoonClassName: 'border-[#d4bc91] bg-[#fdf8ec] text-[#916f3f]'
  },
  {
    key: 'sprouting',
    title: 'Sprouting',
    subtitle: 'Elementary Foundations',
    description: 'Meaning-first listening, concrete vocabulary, and gentle production.',
    sectionClassName: 'border-[#c29a84] bg-[linear-gradient(135deg,#f8ece4_0%,#f0dbcd_100%)]',
    titleClassName: 'text-[#734733]',
    badgeClassName: 'bg-[#a86f4f] text-white',
    comingSoonClassName: 'border-[#d0ad99] bg-[#fcf4ef] text-[#8e6047]'
  }
];

const STAGE_SCOPE_COPY = 'Each stage is a major topic/proficiency shift and typically spans 10–30 lessons.';

export function CourseMap({ data, onStartLesson }: CourseMapProps) {
  const sproutingUnits = useMemo(
    () => [...data.course.units].sort((a, b) => b.order - a.order),
    [data.course.units]
  );

  return (
    <section className="space-y-8">
      <div className="flex items-end justify-between px-1">
        <div>
          <h2 className="font-display text-4xl font-bold text-sapling-800">{data.course.title}</h2>
          <p className="max-w-3xl text-sm text-sapling-700">{data.course.description}</p>
        </div>

        <div className="rounded-full bg-earth-cream px-4 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-earth-brown">Due Reviews</p>
          <p className="font-display text-xl font-bold text-earth-blue">{data.dueReviews}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-sapling-50 px-4 py-3 text-sm font-semibold text-sapling-700">
        Growth direction: begin at the bottom (Sprouting), then scroll upward into the next stages.
      </div>

      <div className="space-y-12">
        {stageConfigs.map((stage) => (
          <section
            key={stage.key}
            className={`min-h-[72vh] rounded-[2.5rem] border px-8 py-10 lg:px-10 lg:py-12 ${stage.sectionClassName}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`font-display text-4xl font-bold ${stage.titleClassName}`}>{stage.title}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-earth-brown">
                  {stage.subtitle}
                </p>
                <p className="mt-2 max-w-3xl text-sm text-sapling-900/80">{stage.description}</p>
                <p className="mt-2 text-xs font-semibold text-sapling-900/70">{STAGE_SCOPE_COPY}</p>
              </div>
              <span className={`rounded-full px-4 py-1 text-xs font-bold ${stage.badgeClassName}`}>
                Stage
              </span>
            </div>

            {stage.key === 'sprouting' ? (
              <div className="mt-10 space-y-10">
                {sproutingUnits.map((unit) => (
                  <div key={unit.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-earth-brown">
                          Unit {unit.order} · {unit.phase.replace('_', ' ')}
                        </p>
                        <h3 className="font-display text-3xl font-bold text-sapling-900">{unit.title}</h3>
                      </div>
                      {!unit.unlocked && (
                        <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-700">
                          Locked
                        </span>
                      )}
                    </div>

                    <div className="mx-auto flex max-w-[380px] flex-col items-center gap-3">
                      {[...unit.lessons]
                        .sort((a, b) => b.order - a.order)
                        .map((lesson) => (
                        <button
                          key={lesson.id}
                          disabled={!lesson.unlocked}
                          onClick={() => onStartLesson(lesson.id)}
                          className={[
                            'group relative w-full max-w-[360px] rounded-3xl border-2 px-5 py-4 text-left transition disabled:cursor-not-allowed',
                            lesson.completed
                              ? 'border-sapling-500 bg-sapling-500 text-white'
                              : lesson.unlocked
                                ? 'border-sapling-200 bg-white/90 hover:-translate-y-1 hover:shadow-lg'
                                : 'border-stone-200 bg-stone-100 text-stone-500'
                          ].join(' ')}
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                            Lesson {lesson.order}
                          </p>
                          <p className="mt-1 font-display text-xl font-bold">{lesson.title}</p>
                          {lesson.isOptionalGrammar && (
                            <span className="absolute right-3 top-3 rounded-full bg-earth-yellow px-2 py-0.5 text-[10px] font-bold text-earth-brown">
                              Clarifier
                            </span>
                          )}
                        </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={`mt-10 flex min-h-[46vh] items-center justify-center rounded-3xl border border-dashed px-8 text-center ${stage.comingSoonClassName}`}
              >
                <div>
                  <p className="font-display text-4xl font-bold">Coming Soon</p>
                  <p className="mt-3 text-base font-semibold">
                    This stage will unlock as a major shift in topics and learning progress.
                  </p>
                  <p className="mt-1 text-sm opacity-90">Planned scope: 10-30 lessons.</p>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
