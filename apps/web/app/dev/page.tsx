'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { EXERCISE_MODALITIES, EXERCISE_TYPES } from '@sapling/shared';
import { PillButton } from '../../components/PillButton';
import {
  createDevEntity,
  deleteDevEntity,
  devOverview,
  exportContent,
  importContent,
  updateDevEntity
} from '../../lib/api';
import { useAppStore } from '../../lib/store';
import { speakText } from '../../lib/tts';

const shellClassName = 'rounded-3xl bg-white p-6 shadow-bubble';

function refreshAfterMutation(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['dev-overview'] });
  queryClient.invalidateQueries({ queryKey: ['content-export'] });
}

export default function DeveloperToolsPage() {
  const devToolsVisible = useAppStore((state) => state.devToolsVisible);
  const selectedVoiceURI = useAppStore((state) => state.selectedVoiceURI);
  const queryClient = useQueryClient();

  const [message, setMessage] = useState('');
  const [exportJson, setExportJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [conflictStrategy, setConflictStrategy] = useState<'skip' | 'replace'>('skip');

  const [courseForm, setCourseForm] = useState({ slug: '', title: '', description: '' });
  const [unitForm, setUnitForm] = useState({ courseId: '', order: 1, title: '', phase: 'comprehension' });
  const [lessonForm, setLessonForm] = useState({ unitId: '', order: 1, title: '' });
  const [patternForm, setPatternForm] = useState({ key: '', name: '', description: '' });
  const [itemForm, setItemForm] = useState({ key: '', sourceText: '', targetText: '', imagePath: '', audioText: '' });
  const [exerciseForm, setExerciseForm] = useState({
    lessonId: '',
    order: 1,
    type: EXERCISE_TYPES[0],
    modality: EXERCISE_MODALITIES[0],
    promptText: '',
    answers: '',
    options: '',
    imageChoices: '',
    audioText: '',
    itemIds: [] as string[],
    patternIds: [] as string[]
  });

  const overviewQuery = useQuery({
    queryKey: ['dev-overview'],
    queryFn: devOverview,
    enabled: devToolsVisible
  });

  const crudMutation = useMutation({
    mutationFn: async (
      input:
        | { mode: 'create'; resource: 'courses' | 'units' | 'lessons' | 'items' | 'patterns' | 'exercises'; body: Record<string, unknown> }
        | {
            mode: 'update';
            resource: 'courses' | 'units' | 'lessons' | 'items' | 'patterns' | 'exercises';
            id: string;
            body: Record<string, unknown>;
          }
        | { mode: 'delete'; resource: 'courses' | 'units' | 'lessons' | 'items' | 'patterns' | 'exercises'; id: string }
    ) => {
      if (input.mode === 'create') {
        return createDevEntity(input.resource, input.body);
      }

      if (input.mode === 'update') {
        return updateDevEntity(input.resource, input.id, input.body);
      }

      return deleteDevEntity(input.resource, input.id);
    },
    onSuccess: () => {
      setMessage('Saved.');
      refreshAfterMutation(queryClient);
    },
    onError: (error) => {
      setMessage(error.message);
    }
  });

  const exportMutation = useMutation({
    mutationFn: exportContent,
    onSuccess: (data) => {
      setExportJson(JSON.stringify(data, null, 2));
      setMessage('Exported JSON ready.');
    },
    onError: (error) => setMessage(error.message)
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const payload = JSON.parse(importJson) as Record<string, unknown>;
      return importContent(payload, conflictStrategy);
    },
    onSuccess: () => {
      setMessage('Import complete.');
      refreshAfterMutation(queryClient);
    },
    onError: (error) => setMessage(error.message)
  });

  const overview = overviewQuery.data;

  const lessonsByUnit = useMemo(() => {
    if (!overview) {
      return [];
    }

    return overview.lessons
      .map((lesson) => {
        const unit = overview.units.find((candidate) => candidate.id === lesson.unitId);
        return {
          ...lesson,
          label: `${unit?.title ?? 'Unit'} · Lesson ${lesson.order} · ${lesson.title}`
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [overview]);

  if (!devToolsVisible) {
    return (
      <section className={shellClassName}>
        <h1 className="font-display text-3xl font-bold text-sapling-800">Developer Tools Hidden</h1>
        <p className="mt-2 text-sapling-700">Press Shift + D to toggle Developer Tools visibility.</p>
      </section>
    );
  }

  if (overviewQuery.isLoading) {
    return <section className={shellClassName}>Loading developer data…</section>;
  }

  if (overviewQuery.error || !overview) {
    return (
      <section className={`${shellClassName} bg-rose-50 text-rose-700`}>
        Failed to load developer data: {(overviewQuery.error as Error | undefined)?.message}
      </section>
    );
  }

  const previewAudioText = exerciseForm.audioText || exerciseForm.answers.split(',')[0]?.trim() || '';

  return (
    <div className="space-y-6">
      <section className={shellClassName}>
        <h1 className="font-display text-4xl font-bold text-sapling-800">Developer Tools</h1>
        <p className="mt-2 text-sapling-700">Local-only builder for course content and exercise composition.</p>
        {message && <p className="mt-2 text-sm font-semibold text-earth-blue">{message}</p>}
      </section>

      <section className="grid grid-cols-2 gap-6">
        <article className={shellClassName}>
          <h2 className="font-display text-2xl font-bold text-sapling-800">Create Course</h2>
          <div className="mt-3 space-y-2">
            <input
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="slug"
              value={courseForm.slug}
              onChange={(event) => setCourseForm((state) => ({ ...state, slug: event.target.value }))}
            />
            <input
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="title"
              value={courseForm.title}
              onChange={(event) => setCourseForm((state) => ({ ...state, title: event.target.value }))}
            />
            <input
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="description"
              value={courseForm.description}
              onChange={(event) =>
                setCourseForm((state) => ({ ...state, description: event.target.value }))
              }
            />
            <PillButton
              onClick={() =>
                crudMutation.mutate({
                  mode: 'create',
                  resource: 'courses',
                  body: {
                    ...courseForm,
                    targetLanguage: 'fr',
                    nativeLanguage: 'en'
                  }
                })
              }
            >
              Create Course
            </PillButton>
          </div>

          <div className="mt-4 space-y-2">
            {overview.courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between rounded-xl bg-sapling-50 px-3 py-2">
                <div>
                  <p className="font-semibold text-sapling-800">{course.title}</p>
                  <p className="text-xs text-sapling-700">{course.slug}</p>
                </div>
                <div className="flex gap-2">
                  <PillButton
                    variant="ghost"
                    onClick={() => {
                      const title = window.prompt('Update course title', course.title);
                      if (!title) {
                        return;
                      }

                      crudMutation.mutate({
                        mode: 'update',
                        resource: 'courses',
                        id: course.id,
                        body: { title }
                      });
                    }}
                  >
                    Edit
                  </PillButton>
                  <PillButton
                    variant="danger"
                    onClick={() =>
                      crudMutation.mutate({ mode: 'delete', resource: 'courses', id: course.id })
                    }
                  >
                    Delete
                  </PillButton>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={shellClassName}>
          <h2 className="font-display text-2xl font-bold text-sapling-800">Create Unit / Lesson</h2>
          <div className="space-y-2">
            <select
              value={unitForm.courseId}
              onChange={(event) => setUnitForm((state) => ({ ...state, courseId: event.target.value }))}
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
            >
              <option value="">Pick course</option>
              {overview.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={unitForm.order}
              onChange={(event) =>
                setUnitForm((state) => ({ ...state, order: Number(event.target.value) || 1 }))
              }
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="Unit order"
            />
            <input
              value={unitForm.title}
              onChange={(event) => setUnitForm((state) => ({ ...state, title: event.target.value }))}
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="Unit title"
            />
            <select
              value={unitForm.phase}
              onChange={(event) => setUnitForm((state) => ({ ...state, phase: event.target.value }))}
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
            >
              <option value="comprehension">comprehension</option>
              <option value="guided_production">guided_production</option>
              <option value="speaking">speaking</option>
            </select>
            <PillButton
              onClick={() =>
                crudMutation.mutate({
                  mode: 'create',
                  resource: 'units',
                  body: {
                    ...unitForm,
                    description: ''
                  }
                })
              }
            >
              Create Unit
            </PillButton>
          </div>

          <div className="mt-4 space-y-2">
            <select
              value={lessonForm.unitId}
              onChange={(event) => setLessonForm((state) => ({ ...state, unitId: event.target.value }))}
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
            >
              <option value="">Pick unit</option>
              {overview.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  Unit {unit.order}: {unit.title}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={lessonForm.order}
              onChange={(event) =>
                setLessonForm((state) => ({ ...state, order: Number(event.target.value) || 1 }))
              }
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
            />
            <input
              value={lessonForm.title}
              onChange={(event) => setLessonForm((state) => ({ ...state, title: event.target.value }))}
              placeholder="Lesson title"
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
            />
            <PillButton
              onClick={() =>
                crudMutation.mutate({
                  mode: 'create',
                  resource: 'lessons',
                  body: {
                    ...lessonForm,
                    description: '',
                    isOptionalGrammar: false
                  }
                })
              }
            >
              Create Lesson
            </PillButton>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-2 gap-6">
        <article className={shellClassName}>
          <h2 className="font-display text-2xl font-bold text-sapling-800">Create Pattern / Item</h2>
          <div className="space-y-2">
            <input
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="Pattern key"
              value={patternForm.key}
              onChange={(event) => setPatternForm((state) => ({ ...state, key: event.target.value }))}
            />
            <input
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="Pattern name"
              value={patternForm.name}
              onChange={(event) => setPatternForm((state) => ({ ...state, name: event.target.value }))}
            />
            <input
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="Description"
              value={patternForm.description}
              onChange={(event) =>
                setPatternForm((state) => ({ ...state, description: event.target.value }))
              }
            />
            <PillButton
              onClick={() =>
                crudMutation.mutate({
                  mode: 'create',
                  resource: 'patterns',
                  body: {
                    ...patternForm,
                    difficulty: 1
                  }
                })
              }
            >
              Create Pattern
            </PillButton>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <input
              className="rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="Item key"
              value={itemForm.key}
              onChange={(event) => setItemForm((state) => ({ ...state, key: event.target.value }))}
            />
            <input
              className="rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="Source text"
              value={itemForm.sourceText}
              onChange={(event) =>
                setItemForm((state) => ({ ...state, sourceText: event.target.value }))
              }
            />
            <input
              className="rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="Target text"
              value={itemForm.targetText}
              onChange={(event) =>
                setItemForm((state) => ({ ...state, targetText: event.target.value }))
              }
            />
            <input
              className="rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="Image path"
              value={itemForm.imagePath}
              onChange={(event) => setItemForm((state) => ({ ...state, imagePath: event.target.value }))}
            />
            <input
              className="col-span-2 rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="Audio text"
              value={itemForm.audioText}
              onChange={(event) => setItemForm((state) => ({ ...state, audioText: event.target.value }))}
            />
            <PillButton
              onClick={() =>
                crudMutation.mutate({
                  mode: 'create',
                  resource: 'items',
                  body: {
                    ...itemForm,
                    difficulty: 1,
                    patternIds: []
                  }
                })
              }
            >
              Create Item
            </PillButton>
          </div>
        </article>

        <article className={shellClassName}>
          <h2 className="font-display text-2xl font-bold text-sapling-800">Compose Exercise</h2>
          <div className="space-y-2">
            <select
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
              value={exerciseForm.lessonId}
              onChange={(event) =>
                setExerciseForm((state) => ({ ...state, lessonId: event.target.value }))
              }
            >
              <option value="">Pick lesson</option>
              {lessonsByUnit.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.label}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                min={1}
                value={exerciseForm.order}
                onChange={(event) =>
                  setExerciseForm((state) => ({ ...state, order: Number(event.target.value) || 1 }))
                }
                className="rounded-2xl border border-sapling-200 px-3 py-2"
              />
              <select
                value={exerciseForm.type}
                onChange={(event) =>
                  setExerciseForm((state) => ({ ...state, type: event.target.value as (typeof EXERCISE_TYPES)[number] }))
                }
                className="rounded-2xl border border-sapling-200 px-3 py-2"
              >
                {EXERCISE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                value={exerciseForm.modality}
                onChange={(event) =>
                  setExerciseForm((state) => ({
                    ...state,
                    modality: event.target.value as (typeof EXERCISE_MODALITIES)[number]
                  }))
                }
                className="rounded-2xl border border-sapling-200 px-3 py-2"
              >
                {EXERCISE_MODALITIES.map((modality) => (
                  <option key={modality} value={modality}>
                    {modality}
                  </option>
                ))}
              </select>
            </div>

            <input
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="Prompt text"
              value={exerciseForm.promptText}
              onChange={(event) =>
                setExerciseForm((state) => ({ ...state, promptText: event.target.value }))
              }
            />
            <input
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="answers (comma separated)"
              value={exerciseForm.answers}
              onChange={(event) => setExerciseForm((state) => ({ ...state, answers: event.target.value }))}
            />
            <input
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="options (comma separated)"
              value={exerciseForm.options}
              onChange={(event) => setExerciseForm((state) => ({ ...state, options: event.target.value }))}
            />
            <input
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="image choices (comma separated)"
              value={exerciseForm.imageChoices}
              onChange={(event) =>
                setExerciseForm((state) => ({ ...state, imageChoices: event.target.value }))
              }
            />
            <input
              className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
              placeholder="audio text"
              value={exerciseForm.audioText}
              onChange={(event) =>
                setExerciseForm((state) => ({ ...state, audioText: event.target.value }))
              }
            />

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-sapling-100 p-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-earth-brown">Items</p>
                <div className="max-h-32 space-y-1 overflow-auto">
                  {overview.items.map((item) => (
                    <label key={item.id} className="flex items-center gap-2 text-xs text-sapling-700">
                      <input
                        type="checkbox"
                        checked={exerciseForm.itemIds.includes(item.id)}
                        onChange={(event) => {
                          setExerciseForm((state) => ({
                            ...state,
                            itemIds: event.target.checked
                              ? [...state.itemIds, item.id]
                              : state.itemIds.filter((id) => id !== item.id)
                          }));
                        }}
                      />
                      {item.key}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-earth-brown">Patterns</p>
                <div className="max-h-32 space-y-1 overflow-auto">
                  {overview.patterns.map((pattern) => (
                    <label key={pattern.id} className="flex items-center gap-2 text-xs text-sapling-700">
                      <input
                        type="checkbox"
                        checked={exerciseForm.patternIds.includes(pattern.id)}
                        onChange={(event) => {
                          setExerciseForm((state) => ({
                            ...state,
                            patternIds: event.target.checked
                              ? [...state.patternIds, pattern.id]
                              : state.patternIds.filter((id) => id !== pattern.id)
                          }));
                        }}
                      />
                      {pattern.key}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <PillButton
                onClick={() =>
                  crudMutation.mutate({
                    mode: 'create',
                    resource: 'exercises',
                    body: {
                      lessonId: exerciseForm.lessonId || null,
                      order: exerciseForm.order,
                      type: exerciseForm.type,
                      modality: exerciseForm.modality,
                      promptText: exerciseForm.promptText,
                      difficulty: 1,
                      data: {
                        answers: exerciseForm.answers
                          .split(',')
                          .map((value) => value.trim())
                          .filter(Boolean),
                        options: exerciseForm.options
                          .split(',')
                          .map((value) => value.trim())
                          .filter(Boolean),
                        imageChoices: exerciseForm.imageChoices
                          .split(',')
                          .map((value) => value.trim())
                          .filter(Boolean),
                        audioText: exerciseForm.audioText
                      },
                      itemIds: exerciseForm.itemIds,
                      patternIds: exerciseForm.patternIds,
                      isTemplate: false
                    }
                  })
                }
              >
                Create Exercise
              </PillButton>
              <PillButton
                variant="ghost"
                onClick={() =>
                  speakText(previewAudioText, {
                    voiceURI: selectedVoiceURI ?? undefined,
                    lang: 'fr-FR',
                    rate: 1
                  })
                }
                disabled={!previewAudioText}
              >
                Preview Exercise Audio
              </PillButton>
            </div>
          </div>
        </article>
      </section>

      <section className={shellClassName}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-sapling-800">Import / Export JSON</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-sapling-700">Conflict:</label>
            <select
              value={conflictStrategy}
              onChange={(event) => setConflictStrategy(event.target.value as 'skip' | 'replace')}
              className="rounded-xl border border-sapling-200 px-2 py-1"
            >
              <option value="skip">skip</option>
              <option value="replace">replace</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <textarea
              className="h-64 w-full rounded-2xl border border-sapling-200 p-3 font-mono text-xs"
              value={exportJson}
              readOnly
            />
            <PillButton className="mt-2" onClick={() => exportMutation.mutate()}>
              Export JSON
            </PillButton>
          </div>
          <div>
            <textarea
              className="h-64 w-full rounded-2xl border border-sapling-200 p-3 font-mono text-xs"
              value={importJson}
              onChange={(event) => setImportJson(event.target.value)}
              placeholder="Paste content JSON here"
            />
            <PillButton className="mt-2" onClick={() => importMutation.mutate()} disabled={!importJson.trim()}>
              Import JSON
            </PillButton>
          </div>
        </div>
      </section>

      <section className={shellClassName}>
        <h2 className="font-display text-2xl font-bold text-sapling-800">Quick Data Lists</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-sapling-50 p-3">
            <p className="font-semibold text-sapling-800">Units ({overview.units.length})</p>
            <div className="mt-2 max-h-48 space-y-1 overflow-auto text-xs text-sapling-700">
              {overview.units.map((unit) => (
                <div key={unit.id} className="flex items-center justify-between">
                  <span>
                    {unit.order}. {unit.title}
                  </span>
                  <button
                    onClick={() =>
                      crudMutation.mutate({ mode: 'delete', resource: 'units', id: unit.id })
                    }
                    className="text-rose-600"
                  >
                    delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-earth-cream p-3">
            <p className="font-semibold text-earth-brown">Lessons ({overview.lessons.length})</p>
            <div className="mt-2 max-h-48 space-y-1 overflow-auto text-xs text-earth-brown">
              {overview.lessons.map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between">
                  <span>
                    {lesson.order}. {lesson.title}
                  </span>
                  <button
                    onClick={() =>
                      crudMutation.mutate({ mode: 'delete', resource: 'lessons', id: lesson.id })
                    }
                    className="text-rose-600"
                  >
                    delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-sky-50 p-3">
            <p className="font-semibold text-earth-blue">Exercises ({overview.exercises.length})</p>
            <div className="mt-2 max-h-48 space-y-1 overflow-auto text-xs text-earth-blue">
              {overview.exercises.map((exercise) => (
                <div key={exercise.id} className="flex items-center justify-between">
                  <span>
                    {exercise.order}. {exercise.type.toLowerCase()}
                  </span>
                  <button
                    onClick={() =>
                      crudMutation.mutate({ mode: 'delete', resource: 'exercises', id: exercise.id })
                    }
                    className="text-rose-600"
                  >
                    delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
