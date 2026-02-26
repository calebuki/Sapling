'use client';

import { TARGET_LOCALE } from '@sapling/shared';

type SpeechRecognitionAlternativeLike = {
  transcript: string;
  confidence: number;
};

type SpeechRecognitionResultLike = {
  0: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  results: {
    0: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

export type ASRResult = {
  transcript: string;
  confidence: number;
};

function getRecognitionConstructor(): BrowserSpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function supportsASR() {
  return Boolean(getRecognitionConstructor());
}

export function createASRController(options: {
  lang?: string;
  onResult: (result: ASRResult) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}) {
  const RecognitionCtor = getRecognitionConstructor();
  if (!RecognitionCtor) {
    return null;
  }

  const recognition = new RecognitionCtor();
  recognition.lang = options.lang ?? TARGET_LOCALE;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const result = event.results[0][0];
    options.onResult({ transcript: result.transcript, confidence: result.confidence });
  };

  recognition.onerror = (event) => {
    options.onError?.(event.error ?? 'unknown_error');
  };

  recognition.onend = () => {
    options.onEnd?.();
  };

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    abort: () => recognition.abort()
  };
}
