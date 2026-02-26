'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import {
  completeSession,
  startSession,
  submitAttempt,
  type SubmitAttemptResponse
} from '../lib/api';
import { createASRController, supportsASR } from '../lib/asr';
import { useAppStore } from '../lib/store';
import { speakText } from '../lib/tts';
import { PillButton } from './PillButton';

type LessonSessionProps = {
  lessonId: string;
};

type LocalFeedback = SubmitAttemptResponse & {
  answer: string;
};

function feedbackTone(result: SubmitAttemptResponse['result']) {
  if (result === 'exact') {
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  }

  if (result === 'near_miss') {
    return 'text-amber-800 bg-amber-50 border-amber-200';
  }

  return 'text-rose-700 bg-rose-50 border-rose-200';
}

export function LessonSession({ lessonId }: LessonSessionProps) {
  const router = useRouter();
  const profile = useAppStore((state) => state.profile);
  const selectedVoiceURI = useAppStore((state) => state.selectedVoiceURI);

  const [index, setIndex] = useState(0);
  const [textAnswer, setTextAnswer] = useState('');
  const [tileAnswer, setTileAnswer] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<LocalFeedback | null>(null);
  const [sessionXp, setSessionXp] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [strengthenedItemIds, setStrengthenedItemIds] = useState<Set<string>>(new Set());
  const [asrTranscript, setAsrTranscript] = useState('');
  const [asrError, setAsrError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const asrControllerRef = useRef<ReturnType<typeof createASRController> | null>(null);

  const sessionQuery = useQuery({
    queryKey: ['session', profile?.id, lessonId],
    queryFn: () => startSession({ profileId: profile!.id, lessonId }),
    enabled: Boolean(profile?.id)
  });

  const submitMutation = useMutation({
    mutationFn: submitAttempt,
    onSuccess: (result, variables) => {
      setFeedback({ ...result, answer: variables.answer });
      setSessionXp((current) => current + result.xpAwarded);
      if (result.countsAsCorrect) {
        setCorrectCount((current) => current + 1);
      }

      const session = sessionQuery.data;
      const currentExercise = session?.exercises[index];
      if (currentExercise && result.result !== 'incorrect') {
        setStrengthenedItemIds((previous) => {
          const next = new Set(previous);
          currentExercise.itemIds.forEach((itemId) => next.add(itemId));
          return next;
        });
      }
    }
  });

  const completeMutation = useMutation({
    mutationFn: completeSession
  });

  const session = sessionQuery.data;
  const exercise = session?.exercises[index];

  const totalExercises = session?.exercises.length ?? 0;
  const accuracy = totalExercises > 0 ? correctCount / totalExercises : 0;

  const completePayload = useMemo(() => {
    if (!profile || !session) {
      return null;
    }

    return {
      profileId: profile.id,
      lessonId: session.lesson.id,
      accuracy,
      xpEarned: sessionXp,
      strengthenedItemIds: Array.from(strengthenedItemIds)
    };
  }, [accuracy, profile, session, sessionXp, strengthenedItemIds]);

  if (!profile) {
    return (
      <section className="rounded-3xl bg-white p-8 shadow-bubble">
        <p className="text-lg font-semibold text-sapling-800">Log into a profile before starting a lesson.</p>
        <Link href="/" className="mt-3 inline-block text-sapling-600 underline">
          Return to course map
        </Link>
      </section>
    );
  }

  if (sessionQuery.isLoading) {
    return <section className="rounded-3xl bg-white p-8 shadow-bubble">Loading your lesson session…</section>;
  }

  if (sessionQuery.error || !session) {
    return (
      <section className="rounded-3xl bg-white p-8 shadow-bubble text-rose-700">
        Failed to load lesson. {(sessionQuery.error as Error | undefined)?.message}
      </section>
    );
  }

  if (!exercise) {
    return (
      <section className="space-y-5 rounded-3xl bg-white p-8 shadow-bubble">
        <h2 className="font-display text-3xl font-bold text-sapling-800">Session Complete</h2>
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-2xl bg-sapling-50 p-4">
            <p className="text-xs uppercase tracking-wide text-sapling-700">XP gained</p>
            <p className="font-display text-3xl font-bold text-sapling-800">{sessionXp}</p>
          </div>
          <div className="rounded-2xl bg-earth-cream p-4">
            <p className="text-xs uppercase tracking-wide text-earth-brown">Accuracy</p>
            <p className="font-display text-3xl font-bold text-earth-blue">{Math.round(accuracy * 100)}%</p>
          </div>
          <div className="rounded-2xl bg-sky-50 p-4">
            <p className="text-xs uppercase tracking-wide text-earth-brown">Strengthened</p>
            <p className="font-display text-3xl font-bold text-earth-blue">{strengthenedItemIds.size}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-wide text-earth-brown">Next step</p>
            <p className="font-display text-2xl font-bold text-earth-brown">Speak More</p>
          </div>
        </div>

        {completeMutation.data && (
          <div className="rounded-2xl border border-sapling-200 bg-sapling-50 p-4 text-sapling-800">
            <p className="font-semibold">Due reviews now: {completeMutation.data.dueReviews}</p>
            <p className="text-sm">
              {completeMutation.data.speakingPracticeRecommended
                ? 'Try extra speaking practice to reinforce rhythm and pronunciation.'
                : 'Replay audio loops before your next lesson to boost speaking confidence.'}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <PillButton
            onClick={() => {
              if (!completePayload || completeMutation.isPending || completeMutation.data) {
                return;
              }

              completeMutation.mutate(completePayload);
            }}
            disabled={completeMutation.isPending || Boolean(completeMutation.data)}
          >
            Save Results
          </PillButton>
          <PillButton variant="secondary" onClick={() => router.push('/')}>
            Back to Course Map
          </PillButton>
          <PillButton variant="ghost" onClick={() => router.push('/progress')}>
            View Progress
          </PillButton>
        </div>
      </section>
    );
  }

  const submit = (answer: string, mode: 'typed' | 'choice' | 'asr' | 'speak') => {
    if (!profile) {
      return;
    }

    submitMutation.mutate({
      profileId: profile.id,
      exerciseId: exercise.id,
      answer,
      mode,
      sessionId: session.sessionId,
      inSession: true
    });
  };

  const playAudio = async (rate: number) => {
    const text = exercise.data.audioText ?? exercise.data.answers[0] ?? '';
    if (!text) {
      return;
    }

    await speakText(text, {
      voiceURI: selectedVoiceURI ?? undefined,
      rate,
      lang: 'fr-FR'
    });
  };

  const moveNext = () => {
    setFeedback(null);
    setTextAnswer('');
    setTileAnswer([]);
    setAsrTranscript('');
    setIndex((current) => current + 1);
  };

  return (
    <section className="space-y-4 rounded-3xl bg-white p-8 shadow-bubble">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-earth-brown">
            Unit {session.lesson.unitOrder} · {session.lesson.unitTitle}
          </p>
          <h2 className="font-display text-3xl font-bold text-sapling-800">{session.lesson.title}</h2>
        </div>
        <p className="rounded-full bg-sapling-100 px-3 py-1 text-sm font-semibold text-sapling-700">
          Exercise {index + 1}/{totalExercises}
        </p>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-sapling-100">
        <div
          className="h-full rounded-full bg-sapling-500 transition-all"
          style={{ width: `${Math.round(((index + 1) / totalExercises) * 100)}%` }}
        />
      </div>

      <article className="space-y-5 rounded-2xl border border-sapling-100 bg-sapling-50/40 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-2xl font-bold text-sapling-800">
            {exercise.promptText ?? 'Respond to the prompt'}
          </h3>
          <div className="flex gap-2">
            <PillButton variant="ghost" onClick={() => playAudio(1)}>
              Hear Again
            </PillButton>
            <PillButton variant="ghost" onClick={() => playAudio(0.8)}>
              Slow
            </PillButton>
          </div>
        </div>

        {(exercise.type === 'listen_pick_image' || exercise.type === 'image_pick_word') && (
          <div className="grid grid-cols-3 gap-3">
            {(exercise.type === 'listen_pick_image'
              ? exercise.data.imageChoices ?? []
              : exercise.data.options ?? []
            ).map((option) => (
              <button
                key={option}
                onClick={() => submit(option, 'choice')}
                disabled={submitMutation.isPending || Boolean(feedback)}
                className="rounded-2xl border border-sapling-200 bg-white p-4 text-left text-sm font-semibold text-sapling-700 transition hover:-translate-y-1 hover:shadow"
              >
                {option.endsWith('.svg') ? (
                  <Image src={option} alt={option} width={96} height={96} className="mx-auto h-24 w-24" />
                ) : (
                  <span>{option}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {(exercise.type === 'listen_type' || exercise.type === 'phrase_complete') && (
          <div className="space-y-3">
            <input
              value={textAnswer}
              onChange={(event) => setTextAnswer(event.target.value)}
              placeholder={exercise.data.hint ?? 'Type your answer'}
              className="w-full rounded-2xl border border-sapling-200 px-4 py-3 text-lg"
            />
            <PillButton
              onClick={() => submit(textAnswer, 'typed')}
              disabled={!textAnswer.trim() || submitMutation.isPending || Boolean(feedback)}
            >
              Check Answer
            </PillButton>
          </div>
        )}

        {exercise.type === 'tile_order' && (
          <div className="space-y-3">
            <div className="min-h-14 rounded-2xl border border-dashed border-sapling-300 bg-white p-3">
              <p className="text-lg font-semibold text-sapling-800">{tileAnswer.join(' ')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(exercise.data.options ?? []).map((token, tokenIndex) => (
                <button
                  key={`${token}-${tokenIndex}`}
                  onClick={() => setTileAnswer((current) => [...current, token])}
                  className="rounded-full bg-earth-cream px-4 py-2 font-semibold text-earth-brown transition hover:brightness-95"
                >
                  {token}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <PillButton
                onClick={() => submit(tileAnswer.join(' '), 'typed')}
                disabled={!tileAnswer.length || submitMutation.isPending || Boolean(feedback)}
              >
                Check Order
              </PillButton>
              <PillButton variant="ghost" onClick={() => setTileAnswer([])}>
                Reset
              </PillButton>
            </div>
          </div>
        )}

        {exercise.type === 'speak_repeat' && (
          <div className="space-y-3 rounded-2xl border border-sapling-200 bg-white p-4">
            <p className="text-sm text-sapling-700">
              Speak the phrase aloud, then submit transcript. If your browser does not support speech
              recognition, type your answer below.
            </p>
            {supportsASR() ? (
              <div className="flex items-center gap-3">
                <PillButton
                  variant={isListening ? 'danger' : 'secondary'}
                  onClick={() => {
                    if (isListening) {
                      asrControllerRef.current?.stop();
                      return;
                    }

                    setAsrError(null);
                    asrControllerRef.current = createASRController({
                      lang: 'fr-FR',
                      onResult: (result) => {
                        setAsrTranscript(result.transcript);
                      },
                      onError: (error) => setAsrError(error),
                      onEnd: () => setIsListening(false)
                    });

                    asrControllerRef.current?.start();
                    setIsListening(true);
                  }}
                >
                  {isListening ? 'Stop Listening' : 'Start Listening'}
                </PillButton>
                <PillButton
                  onClick={() => submit(asrTranscript, 'speak')}
                  disabled={!asrTranscript.trim() || submitMutation.isPending || Boolean(feedback)}
                >
                  Submit Speech
                </PillButton>
              </div>
            ) : (
              <p className="rounded-xl bg-earth-cream p-3 text-sm font-semibold text-earth-brown">
                ASR not available in this browser. Use typed response fallback.
              </p>
            )}

            <input
              value={asrTranscript}
              onChange={(event) => setAsrTranscript(event.target.value)}
              placeholder="Speech transcript or typed fallback"
              className="w-full rounded-2xl border border-sapling-200 px-4 py-3"
            />
            {asrError && <p className="text-sm font-semibold text-rose-600">Microphone error: {asrError}</p>}
          </div>
        )}
      </article>

      {feedback && (
        <div className={`rounded-2xl border p-4 ${feedbackTone(feedback.result)}`}>
          <p className="font-semibold">
            {feedback.result === 'exact'
              ? 'Perfect!'
              : feedback.result === 'near_miss'
                ? 'Close enough — counted as correct.'
                : 'Not quite this time.'}
          </p>
          <p className="text-sm">Correct answer: {feedback.correctAnswer || feedback.bestMatch}</p>
          <p className="text-sm">Tip: {feedback.tip}</p>
          <div className="mt-3 flex gap-2">
            <PillButton variant="ghost" onClick={() => playAudio(1)}>
              Replay Audio
            </PillButton>
            <PillButton onClick={moveNext}>Continue</PillButton>
          </div>
        </div>
      )}
    </section>
  );
}
