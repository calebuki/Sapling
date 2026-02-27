'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { exportContent, getProgress } from '../../lib/api';
import { getLearningLanguageMeta, isSeededLearningLanguage } from '../../lib/languages';
import { useAppStore } from '../../lib/store';

type StageKey = 'seed' | 'sprouting' | 'sapling' | 'young_tree' | 'canopy';

type ExportData = {
  units?: Array<{
    courseSlug: string;
    order: number;
    title: string;
    description?: string;
    phase: string;
  }>;
  items?: Array<{
    key: string;
    targetText: string;
  }>;
  exercises?: Array<{
    unitOrder: number;
    itemKeys: string[];
  }>;
};

type StageUnit = {
  label: string;
  subtitle: string;
};

type StageContent = {
  key: StageKey;
  title: string;
  subtitle: string;
  units: StageUnit[];
  words: string[];
  paletteClassName: string;
};

const stageMeta: Array<{
  key: StageKey;
  label: string;
  chipClassName: string;
}> = [
  {
    key: 'seed',
    label: 'Seed',
    chipClassName: 'border-[#c9ab87] bg-[#f6ebd9] text-[#6a5235]'
  },
  {
    key: 'sprouting',
    label: 'Sprouting',
    chipClassName: 'border-[#c69f86] bg-[#f4e5db] text-[#704731]'
  },
  {
    key: 'sapling',
    label: 'Sapling',
    chipClassName: 'border-[#aac39c] bg-[#eaf4e2] text-[#35633b]'
  },
  {
    key: 'young_tree',
    label: 'Young Tree',
    chipClassName: 'border-[#8fb2cb] bg-[#e5f0f8] text-[#345d79]'
  },
  {
    key: 'canopy',
    label: 'Canopy',
    chipClassName: 'border-[#8fa6d1] bg-[#e8edfb] text-[#3b4d7c]'
  }
];

const placeholderStageContent: Record<Exclude<StageKey, 'seed'>, Omit<StageContent, 'key'>> = {
  sprouting: {
    title: 'Sprouting',
    subtitle: 'Early expression and day-to-day basics.',
    units: [
      { label: 'Unité 4: La maison', subtitle: 'Objets et pièces' },
      { label: 'Unité 5: La famille', subtitle: 'Relations et descriptions' },
      { label: 'Unité 6: Les routines', subtitle: 'Matin, midi, soir' }
    ],
    words: [
      'la maison',
      'la porte',
      'la fenêtre',
      'la mère',
      'le père',
      'la sœur',
      'le frère',
      'se réveiller',
      'se coucher',
      'le matin',
      'le soir',
      'la cuisine'
    ],
    paletteClassName: 'border-[#c69f86] bg-[linear-gradient(135deg,#f8eee8_0%,#f2e1d4_100%)]'
  },
  sapling: {
    title: 'Sapling',
    subtitle: 'Topic expansion and longer practical phrases.',
    units: [
      { label: 'Unité 7: En ville', subtitle: 'Lieux et direction' },
      { label: 'Unité 8: Nourriture', subtitle: 'Repas et préférences' },
      { label: 'Unité 9: Temps libre', subtitle: 'Activités et invitations' }
    ],
    words: [
      'la ville',
      'la rue',
      'tourner',
      'aller tout droit',
      'le restaurant',
      'le petit déjeuner',
      'le déjeuner',
      'le dîner',
      'j’aime',
      'je préfère',
      'jouer',
      'sortir'
    ],
    paletteClassName: 'border-[#aac39c] bg-[linear-gradient(135deg,#edf7e8_0%,#dff0d7_100%)]'
  },
  young_tree: {
    title: 'Young Tree',
    subtitle: 'Conversation growth with broader contexts.',
    units: [
      { label: 'Unité 10: Voyage', subtitle: 'Transports et plans' },
      { label: 'Unité 11: Travail', subtitle: 'Tâches et horaires' },
      { label: 'Unité 12: Santé', subtitle: 'Corps et bien-être' }
    ],
    words: [
      'le train',
      'l’avion',
      'la gare',
      'réserver',
      'le bureau',
      'le projet',
      'la réunion',
      'commencer',
      'la santé',
      'le médecin',
      'la tête',
      'se reposer'
    ],
    paletteClassName: 'border-[#8fb2cb] bg-[linear-gradient(135deg,#eaf3fa_0%,#dceaf5_100%)]'
  },
  canopy: {
    title: 'Canopy',
    subtitle: 'Advanced clarity, nuance, and confident flow.',
    units: [
      { label: 'Unité 13: Opinions', subtitle: 'Nuance et argumentation' },
      { label: 'Unité 14: Actualités', subtitle: 'Sujets abstraits' },
      { label: 'Unité 15: Culture', subtitle: 'Références et style' }
    ],
    words: [
      'à mon avis',
      'cependant',
      'pourtant',
      'en revanche',
      'la société',
      'le débat',
      'la recherche',
      'la littérature',
      'la perspective',
      'soutenir',
      'nuancer',
      'approfondir'
    ],
    paletteClassName: 'border-[#8fa6d1] bg-[linear-gradient(135deg,#ebeffc_0%,#dee6fb_100%)]'
  }
};

const nonFrenchStageContent = {
  de: {
    seed: {
      title: 'Seed',
      subtitle: 'Frühe Grundwörter und einfache Zuordnung.',
      units: [
        { label: 'Einheit 1: Grundlagen', subtitle: 'Konkrete Dinge' },
        { label: 'Einheit 2: Aktionen', subtitle: 'Alltagsverben' },
        { label: 'Einheit 3: Begrüßungen', subtitle: 'Höfliche Ausdrücke' }
      ],
      words: [
        'die Katze',
        'der Hund',
        'der Apfel',
        'das Wasser',
        'ich esse',
        'ich trinke',
        'ich gehe',
        'hallo',
        'danke',
        'sehr gut'
      ],
      paletteClassName: 'border-[#c9ab87] bg-[linear-gradient(135deg,#faf1e3_0%,#f2e3c9_100%)]'
    },
    sprouting: {
      title: 'Sprouting',
      subtitle: 'Frühe Erweiterung für Alltagsthemen.',
      units: [
        { label: 'Einheit 4: Zuhause', subtitle: 'Räume und Gegenstände' },
        { label: 'Einheit 5: Familie', subtitle: 'Personen und Beziehungen' },
        { label: 'Einheit 6: Routinen', subtitle: 'Tag und Zeit' }
      ],
      words: ['das Haus', 'die Tür', 'das Fenster', 'die Mutter', 'der Vater', 'der Morgen', 'der Abend'],
      paletteClassName: 'border-[#c69f86] bg-[linear-gradient(135deg,#f8eee8_0%,#f2e1d4_100%)]'
    },
    sapling: {
      title: 'Sapling',
      subtitle: 'Mehr Themen und längere Sätze.',
      units: [
        { label: 'Einheit 7: In der Stadt', subtitle: 'Orte und Wege' },
        { label: 'Einheit 8: Essen', subtitle: 'Mahlzeiten' },
        { label: 'Einheit 9: Freizeit', subtitle: 'Aktivitäten' }
      ],
      words: ['die Stadt', 'die Straße', 'geradeaus', 'das Restaurant', 'das Frühstück', 'ich mag'],
      paletteClassName: 'border-[#aac39c] bg-[linear-gradient(135deg,#edf7e8_0%,#dff0d7_100%)]'
    },
    young_tree: {
      title: 'Young Tree',
      subtitle: 'Mehr Gesprächssicherheit.',
      units: [
        { label: 'Einheit 10: Reisen', subtitle: 'Transport und Planung' },
        { label: 'Einheit 11: Arbeit', subtitle: 'Aufgaben und Zeit' },
        { label: 'Einheit 12: Gesundheit', subtitle: 'Wohlbefinden' }
      ],
      words: ['der Zug', 'das Flugzeug', 'buchen', 'das Büro', 'das Projekt', 'die Gesundheit'],
      paletteClassName: 'border-[#8fb2cb] bg-[linear-gradient(135deg,#eaf3fa_0%,#dceaf5_100%)]'
    },
    canopy: {
      title: 'Canopy',
      subtitle: 'Fortgeschrittene Nuancen.',
      units: [
        { label: 'Einheit 13: Meinungen', subtitle: 'Argumentation' },
        { label: 'Einheit 14: Nachrichten', subtitle: 'Abstrakte Themen' },
        { label: 'Einheit 15: Kultur', subtitle: 'Stil und Kontext' }
      ],
      words: ['meiner Meinung nach', 'jedoch', 'außerdem', 'die Gesellschaft', 'die Perspektive'],
      paletteClassName: 'border-[#8fa6d1] bg-[linear-gradient(135deg,#ebeffc_0%,#dee6fb_100%)]'
    }
  },
  es: {
    seed: {
      title: 'Seed',
      subtitle: 'Palabras base y asociación inicial.',
      units: [
        { label: 'Unidad 1: Fundamentos', subtitle: 'Objetos concretos' },
        { label: 'Unidad 2: Acciones', subtitle: 'Verbos frecuentes' },
        { label: 'Unidad 3: Saludos', subtitle: 'Frases comunes' }
      ],
      words: [
        'el gato',
        'el perro',
        'la manzana',
        'el agua',
        'yo como',
        'yo bebo',
        'yo voy',
        'hola',
        'gracias',
        'muy bien'
      ],
      paletteClassName: 'border-[#c9ab87] bg-[linear-gradient(135deg,#faf1e3_0%,#f2e3c9_100%)]'
    },
    sprouting: {
      title: 'Sprouting',
      subtitle: 'Primer crecimiento temático.',
      units: [
        { label: 'Unidad 4: La casa', subtitle: 'Habitaciones y objetos' },
        { label: 'Unidad 5: La familia', subtitle: 'Relaciones' },
        { label: 'Unidad 6: Rutinas', subtitle: 'Mañana y noche' }
      ],
      words: ['la casa', 'la puerta', 'la ventana', 'la madre', 'el padre', 'la mañana', 'la noche'],
      paletteClassName: 'border-[#c69f86] bg-[linear-gradient(135deg,#f8eee8_0%,#f2e1d4_100%)]'
    },
    sapling: {
      title: 'Sapling',
      subtitle: 'Más amplitud y frases largas.',
      units: [
        { label: 'Unidad 7: En la ciudad', subtitle: 'Lugares y direcciones' },
        { label: 'Unidad 8: Comida', subtitle: 'Preferencias' },
        { label: 'Unidad 9: Tiempo libre', subtitle: 'Actividades' }
      ],
      words: ['la ciudad', 'la calle', 'todo recto', 'el restaurante', 'el desayuno', 'me gusta'],
      paletteClassName: 'border-[#aac39c] bg-[linear-gradient(135deg,#edf7e8_0%,#dff0d7_100%)]'
    },
    young_tree: {
      title: 'Young Tree',
      subtitle: 'Confianza conversacional.',
      units: [
        { label: 'Unidad 10: Viajes', subtitle: 'Transporte y planes' },
        { label: 'Unidad 11: Trabajo', subtitle: 'Proyecto y horario' },
        { label: 'Unidad 12: Salud', subtitle: 'Bienestar' }
      ],
      words: ['el tren', 'el avión', 'reservar', 'la oficina', 'el proyecto', 'la salud'],
      paletteClassName: 'border-[#8fb2cb] bg-[linear-gradient(135deg,#eaf3fa_0%,#dceaf5_100%)]'
    },
    canopy: {
      title: 'Canopy',
      subtitle: 'Matiz y dominio avanzado.',
      units: [
        { label: 'Unidad 13: Opiniones', subtitle: 'Argumentación' },
        { label: 'Unidad 14: Actualidad', subtitle: 'Temas abstractos' },
        { label: 'Unidad 15: Cultura', subtitle: 'Estilo y contexto' }
      ],
      words: ['en mi opinión', 'sin embargo', 'además', 'la sociedad', 'la perspectiva'],
      paletteClassName: 'border-[#8fa6d1] bg-[linear-gradient(135deg,#ebeffc_0%,#dee6fb_100%)]'
    }
  }
} as const;

export default function ProgressPage() {
  const [selectedStage, setSelectedStage] = useState<StageKey>('seed');
  const profile = useAppStore((state) => state.profile);
  const activeLearningLanguage = useAppStore((state) => state.activeLearningLanguage);
  const isSeededLanguage = isSeededLearningLanguage(activeLearningLanguage);
  const activeLanguageMeta = getLearningLanguageMeta(activeLearningLanguage);

  const progressQuery = useQuery({
    queryKey: ['progress', profile?.id],
    queryFn: () => getProgress(profile!.id),
    enabled: Boolean(profile?.id)
  });

  const contentQuery = useQuery({
    queryKey: ['content-export', activeLearningLanguage],
    queryFn: exportContent,
    enabled: isSeededLanguage
  });

  const contentData = (contentQuery.data as ExportData | undefined) ?? {};

  const seedStageContent = useMemo<Omit<StageContent, 'key'>>(() => {
    const units = [...(contentData.units ?? [])]
      .sort((a, b) => a.order - b.order)
      .map((unit) => ({
        label: `Unité ${unit.order}: ${unit.title}`,
        subtitle: unit.phase.replace('_', ' ')
      }));

    const itemKeyToWord = new Map((contentData.items ?? []).map((item) => [item.key, item.targetText]));
    const words = new Set<string>();

    for (const exercise of contentData.exercises ?? []) {
      for (const itemKey of exercise.itemKeys ?? []) {
        const word = itemKeyToWord.get(itemKey);
        if (word) {
          words.add(word);
        }
      }
    }

    return {
      title: 'Seed',
      subtitle: 'Foundational concrete vocabulary.',
      units,
      words: [...words].sort((a, b) => a.localeCompare(b, 'fr')),
      paletteClassName: 'border-[#c9ab87] bg-[linear-gradient(135deg,#faf1e3_0%,#f2e3c9_100%)]'
    };
  }, [contentData.exercises, contentData.items, contentData.units]);

  const selectedStageContent = useMemo<StageContent>(() => {
    if (!isSeededLanguage) {
      const nonFrenchContent = nonFrenchStageContent[activeLearningLanguage as 'de' | 'es'];
      return {
        key: selectedStage,
        ...nonFrenchContent[selectedStage]
      };
    }

    if (selectedStage === 'seed') {
      return {
        key: 'seed',
        ...seedStageContent
      };
    }

    return {
      key: selectedStage,
      ...placeholderStageContent[selectedStage]
    };
  }, [activeLearningLanguage, isSeededLanguage, seedStageContent, selectedStage]);

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
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-bubble">
        <h1 className="font-display text-4xl font-bold text-sapling-800">Progress</h1>
        <p className="mt-2 text-sapling-700">Track your streak, XP, due reviews, strongest phrases, and stage vocabulary.</p>
      </section>

      <section className="space-y-4 rounded-3xl border border-sapling-100 bg-white p-6 shadow-bubble">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-earth-brown">Overview</p>
          <h2 className="font-display text-3xl font-bold text-sapling-800">Daily Snapshot</h2>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <article className="rounded-2xl border border-sapling-100 bg-sapling-50/50 p-5">
            <p className="text-xs uppercase tracking-wide text-earth-brown">Current streak</p>
            <p className="font-display text-3xl font-bold text-sapling-800">{progress.streakCurrent}</p>
          </article>
          <article className="rounded-2xl border border-sapling-100 bg-sapling-50/50 p-5">
            <p className="text-xs uppercase tracking-wide text-earth-brown">Best streak</p>
            <p className="font-display text-3xl font-bold text-earth-blue">{progress.streakBest}</p>
          </article>
          <article className="rounded-2xl border border-sapling-100 bg-sapling-50/50 p-5">
            <p className="text-xs uppercase tracking-wide text-earth-brown">XP total</p>
            <p className="font-display text-3xl font-bold text-sapling-800">{progress.xpTotal}</p>
          </article>
          <article className="rounded-2xl border border-sapling-100 bg-sapling-50/50 p-5">
            <p className="text-xs uppercase tracking-wide text-earth-brown">Due reviews</p>
            <p className="font-display text-3xl font-bold text-earth-blue">{progress.dueReviews}</p>
          </article>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-sapling-100 bg-white p-6 shadow-bubble">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-earth-brown">Growth + Strengths</p>
          <h2 className="font-display text-3xl font-bold text-sapling-800">How Your Sapling Is Doing</h2>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <article className="rounded-2xl border border-sapling-100 bg-sapling-50/40 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold text-sapling-800">Sapling Growth</h3>
              <p className="text-sm font-semibold text-earth-brown">Scene stage: {progress.sceneStage}</p>
            </div>
            <div className="h-5 overflow-hidden rounded-full bg-sapling-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sapling-400 via-sapling-500 to-earth-blue transition-all"
                style={{ width: `${progress.saplingGrowth}%` }}
              />
            </div>
          </article>

          <article className="rounded-2xl border border-sapling-100 bg-sapling-50/40 p-5">
            <h3 className="font-display text-2xl font-bold text-sapling-800">Strengths</h3>
            {progress.strengths.length === 0 ? (
              <p className="mt-2 text-sapling-700">No strengths yet. Complete a few lesson exercises first.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {progress.strengths.map((entry) => (
                  <article key={entry.itemId} className="rounded-2xl border border-sapling-100 bg-white/80 p-4">
                    <p className="font-semibold text-sapling-800">{entry.phrase}</p>
                    <p className="text-sm text-sapling-700">Strength: {entry.strength.toFixed(2)}</p>
                    <p className="text-xs text-earth-brown">Next due: {new Date(entry.nextDueAt).toLocaleString()}</p>
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="space-y-5 rounded-3xl border border-sapling-200 bg-[linear-gradient(135deg,#f9f5ea_0%,#f1f8ef_100%)] p-6 shadow-bubble">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-earth-brown">Vocabulary Explorer</p>
          <h2 className="font-display text-3xl font-bold text-sapling-800">Vocabulary by Stage</h2>
          <p className="mt-2 text-sapling-700">
            {isSeededLanguage
              ? 'Select a stage to review units and all words introduced in that stage.'
              : `Showing placeholder stage vocabulary for ${activeLanguageMeta.flag} ${activeLanguageMeta.label}.`}
          </p>
        </div>

        {isSeededLanguage && contentQuery.isLoading && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">Loading stage vocabulary…</div>
        )}

        {isSeededLanguage && contentQuery.error && (
          <div className="rounded-2xl bg-rose-50 p-6 text-rose-700 shadow-sm">
            Failed to load stage vocabulary: {(contentQuery.error as Error | undefined)?.message}
          </div>
        )}

        {isSeededLanguage && !contentQuery.isLoading && !contentQuery.error && !contentQuery.data && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">No stage vocabulary content is available yet.</div>
        )}

        {(!isSeededLanguage || contentQuery.data) && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/90 p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-earth-brown">Stage Filter</p>
              <div className="flex flex-wrap gap-2">
                {stageMeta.map((stage) => (
                  <button
                    key={stage.key}
                    onClick={() => setSelectedStage(stage.key)}
                    className={[
                      'rounded-full border px-4 py-2 text-sm font-semibold transition',
                      stage.chipClassName,
                      selectedStage === stage.key ? 'ring-2 ring-sapling-400' : 'opacity-80 hover:opacity-100'
                    ].join(' ')}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`rounded-2xl border p-5 shadow-sm ${selectedStageContent.paletteClassName}`}>
              <div className="mb-5">
                <h3 className="font-display text-3xl font-bold text-sapling-900">{selectedStageContent.title}</h3>
                <p className="text-sm font-semibold text-sapling-800/80">{selectedStageContent.subtitle}</p>
              </div>

              <div className="grid grid-cols-[1fr_1.3fr] gap-6">
                <article className="rounded-2xl bg-white/85 p-4">
                  <h4 className="font-display text-2xl font-bold text-sapling-900">Units</h4>
                  <div className="mt-3 space-y-2">
                    {selectedStageContent.units.map((unit) => (
                      <div key={unit.label} className="rounded-xl bg-sapling-50 px-3 py-2">
                        <p className="font-semibold text-sapling-900">{unit.label}</p>
                        <p className="text-xs font-semibold uppercase tracking-wide text-earth-brown">{unit.subtitle}</p>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-2xl bg-white/85 p-4">
                  <h4 className="font-display text-2xl font-bold text-sapling-900">Words</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedStageContent.words.map((word) => (
                      <span
                        key={word}
                        className="rounded-full bg-earth-cream px-3 py-1 text-sm font-semibold text-earth-brown"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </article>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
