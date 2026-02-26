'use client';

import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { DAILY_GOAL_DEFAULT } from '@sapling/shared';
import { PillButton } from '../../components/PillButton';
import { updateProfileSettings } from '../../lib/api';
import { useAppStore } from '../../lib/store';
import { listFrenchVoices, speakText, supportsTTS, type TTSVoice } from '../../lib/tts';

const goalOptions = [5, 10, 15];

export default function OnboardingPage() {
  const profile = useAppStore((state) => state.profile);
  const setProfile = useAppStore((state) => state.setProfile);
  const selectedVoiceURI = useAppStore((state) => state.selectedVoiceURI);
  const setVoiceURI = useAppStore((state) => state.setVoiceURI);

  const [dailyGoal, setDailyGoal] = useState<number>(profile?.dailyGoalMinutes ?? DAILY_GOAL_DEFAULT);
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string>('');

  useEffect(() => {
    listFrenchVoices()
      .then((items) => {
        setVoices(items);
        if (!selectedVoiceURI && items[0]) {
          setVoiceURI(items[0].voiceURI);
        }
      })
      .catch(() => setVoiceError('Unable to list local voices in this browser.'));
  }, [selectedVoiceURI, setVoiceURI]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile) {
        throw new Error('Select a profile first.');
      }

      return updateProfileSettings(profile.id, {
        dailyGoalMinutes: dailyGoal,
        targetLanguage: 'fr',
        nativeLanguage: 'en'
      });
    },
    onSuccess: (data) => {
      if (profile) {
        setProfile({ ...profile, ...data.profile });
      }
      setSavedMessage('Settings saved locally.');
    },
    onError: (error) => {
      setSavedMessage(error.message);
    }
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white p-8 shadow-bubble">
        <h1 className="font-display text-4xl font-bold text-sapling-800">Onboarding</h1>
        <p className="mt-2 text-sapling-700">
          French is fixed for this MVP. Set your daily goal and run a quick audio check.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-6">
        <article className="space-y-4 rounded-3xl bg-white p-6 shadow-bubble">
          <h2 className="font-display text-2xl font-bold text-sapling-800">Daily Goal</h2>
          <p className="text-sm text-sapling-700">Pick a target that feels sustainable for repetition-heavy practice.</p>

          <div className="flex gap-3">
            {goalOptions.map((minutes) => (
              <button
                key={minutes}
                onClick={() => setDailyGoal(minutes)}
                className={[
                  'rounded-full px-6 py-3 font-display text-lg font-bold transition',
                  dailyGoal === minutes
                    ? 'bg-sapling-500 text-white shadow'
                    : 'bg-sapling-100 text-sapling-700 hover:bg-sapling-200'
                ].join(' ')}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </article>

        <article className="space-y-4 rounded-3xl bg-white p-6 shadow-bubble">
          <h2 className="font-display text-2xl font-bold text-sapling-800">Audio Check</h2>
          <p className="text-sm text-sapling-700">Can you hear this? Choose a French voice and preview slow/normal playback.</p>

          {!supportsTTS() && (
            <p className="rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-700">
              Browser TTS is unavailable. You can still continue with text-based learning.
            </p>
          )}

          {supportsTTS() && (
            <>
              <select
                value={selectedVoiceURI ?? ''}
                onChange={(event) => setVoiceURI(event.target.value || null)}
                className="w-full rounded-2xl border border-sapling-200 px-3 py-2"
              >
                {voices.length === 0 && <option value="">No French voices detected</option>}
                {voices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>

              <div className="flex gap-3">
                <PillButton
                  variant="ghost"
                  onClick={() =>
                    speakText('Bonjour, peux-tu m’entendre ?', {
                      voiceURI: selectedVoiceURI ?? undefined,
                      rate: 1,
                      lang: 'fr-FR'
                    })
                  }
                >
                  Play Normal
                </PillButton>
                <PillButton
                  variant="ghost"
                  onClick={() =>
                    speakText('Bonjour, peux-tu m’entendre ?', {
                      voiceURI: selectedVoiceURI ?? undefined,
                      rate: 0.8,
                      lang: 'fr-FR'
                    })
                  }
                >
                  Play Slow
                </PillButton>
              </div>
            </>
          )}

          {voiceError && <p className="text-sm text-rose-600">{voiceError}</p>}
        </article>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-bubble">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-sapling-700">Profile: {profile?.name ?? 'No profile selected'}</p>
            <p className="text-xs text-earth-brown">Target language: French (fr-FR), Native language seed: English (en)</p>
          </div>
          <PillButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !profile}>
            Save Onboarding
          </PillButton>
        </div>
        {savedMessage && <p className="mt-3 text-sm font-semibold text-sapling-700">{savedMessage}</p>}
      </section>
    </div>
  );
}
