'use client';

import { TARGET_LOCALE } from '@sapling/shared';

export type TTSVoice = {
  name: string;
  lang: string;
  voiceURI: string;
  isDefault: boolean;
};

function getSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  return window.speechSynthesis;
}

export function supportsTTS() {
  return Boolean(getSynthesis());
}

export function listVoices(): Promise<TTSVoice[]> {
  const synthesis = getSynthesis();
  if (!synthesis) {
    return Promise.resolve([]);
  }

  const readVoices = () =>
    synthesis.getVoices().map((voice) => ({
      name: voice.name,
      lang: voice.lang,
      voiceURI: voice.voiceURI,
      isDefault: voice.default
    }));

  return new Promise((resolve) => {
    const immediate = readVoices();
    if (immediate.length > 0) {
      resolve(immediate);
      return;
    }

    synthesis.onvoiceschanged = () => {
      resolve(readVoices());
    };
  });
}

export async function listFrenchVoices() {
  const voices = await listVoices();
  return voices
    .filter((voice) => voice.lang.toLowerCase().startsWith('fr'))
    .sort((a, b) => {
      const aIsPreferred = a.lang.toLowerCase() === TARGET_LOCALE.toLowerCase();
      const bIsPreferred = b.lang.toLowerCase() === TARGET_LOCALE.toLowerCase();
      if (aIsPreferred !== bIsPreferred) {
        return aIsPreferred ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });
}

export async function speakText(
  text: string,
  options: {
    voiceURI?: string;
    rate?: number;
    pitch?: number;
    lang?: string;
  } = {}
): Promise<void> {
  const synthesis = getSynthesis();
  if (!synthesis) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang ?? TARGET_LOCALE;
  utterance.rate = options.rate ?? 1;
  utterance.pitch = options.pitch ?? 1;

  const voices = synthesis.getVoices();
  if (options.voiceURI) {
    const selected = voices.find((voice) => voice.voiceURI === options.voiceURI);
    if (selected) {
      utterance.voice = selected;
    }
  } else {
    const fallback =
      voices.find((voice) => voice.lang.toLowerCase() === TARGET_LOCALE.toLowerCase()) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith('fr'));
    if (fallback) {
      utterance.voice = fallback;
    }
  }

  synthesis.cancel();

  await new Promise<void>((resolve, reject) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error('TTS playback failed'));
    synthesis.speak(utterance);
  });
}
