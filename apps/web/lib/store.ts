'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProfileSummary } from './api';
import type { LearningLanguageCode } from './languages';

type AppStore = {
  profile: ProfileSummary | null;
  activeLearningLanguage: LearningLanguageCode;
  selectedVoiceURI: string | null;
  preferredRate: number;
  devToolsVisible: boolean;
  setProfile: (profile: ProfileSummary | null) => void;
  setActiveLearningLanguage: (language: LearningLanguageCode) => void;
  setVoiceURI: (voiceURI: string | null) => void;
  setPreferredRate: (rate: number) => void;
  setDevToolsVisible: (visible: boolean) => void;
  toggleDevToolsVisible: () => void;
};

const defaultDevToolsVisible = process.env.NEXT_PUBLIC_ENABLE_DEVTOOLS === 'true';

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      profile: null,
      activeLearningLanguage: 'fr',
      selectedVoiceURI: null,
      preferredRate: 1,
      devToolsVisible: defaultDevToolsVisible,
      setProfile: (profile) => set({ profile }),
      setActiveLearningLanguage: (activeLearningLanguage) => set({ activeLearningLanguage }),
      setVoiceURI: (selectedVoiceURI) => set({ selectedVoiceURI }),
      setPreferredRate: (preferredRate) => set({ preferredRate }),
      setDevToolsVisible: (devToolsVisible) => set({ devToolsVisible }),
      toggleDevToolsVisible: () =>
        set((state) => ({
          devToolsVisible: !state.devToolsVisible
        }))
    }),
    {
      name: 'sapling-store',
      partialize: (state) => ({
        profile: state.profile,
        activeLearningLanguage: state.activeLearningLanguage,
        selectedVoiceURI: state.selectedVoiceURI,
        preferredRate: state.preferredRate,
        devToolsVisible: state.devToolsVisible
      })
    }
  )
);
