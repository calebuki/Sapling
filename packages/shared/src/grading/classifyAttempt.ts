import { type AttemptClassification } from '../types';
import { levenshteinDistance } from './levenshtein';
import { normalizeText, normalizeTextWithoutDiacritics } from './normalize';

type ClassifyAttemptOptions = {
  isASR?: boolean;
};

function isSingleAdjacentTokenSwap(input: string, target: string): boolean {
  const inputTokens = input.split(' ').filter(Boolean);
  const targetTokens = target.split(' ').filter(Boolean);

  if (inputTokens.length !== targetTokens.length || inputTokens.length < 2 || inputTokens.length > 6) {
    return false;
  }

  for (let i = 0; i < inputTokens.length - 1; i += 1) {
    const swapped = [...inputTokens];
    [swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
    if (swapped.join(' ') === targetTokens.join(' ')) {
      return true;
    }
  }

  return false;
}

function hasReasonableASRSubsequence(input: string, target: string): boolean {
  const inputTokens = input.split(' ').filter(Boolean);
  const targetTokens = target.split(' ').filter(Boolean);

  if (!inputTokens.length || !targetTokens.length) {
    return false;
  }

  if (inputTokens.length > targetTokens.length + 3) {
    return false;
  }

  let targetIndex = 0;
  for (const token of inputTokens) {
    if (token === targetTokens[targetIndex]) {
      targetIndex += 1;
      if (targetIndex === targetTokens.length) {
        break;
      }
    }
  }

  const ratio = targetTokens.length / inputTokens.length;
  return targetIndex === targetTokens.length && ratio >= 0.5;
}

function buildBaseMetrics(input: string, target: string) {
  const normalizedInput = normalizeText(input);
  const normalizedTarget = normalizeText(target);
  const normalizedInputNoDiacritics = normalizeTextWithoutDiacritics(input);
  const normalizedTargetNoDiacritics = normalizeTextWithoutDiacritics(target);
  const threshold = Math.max(1, Math.floor(normalizedTargetNoDiacritics.length * 0.2));
  const distance = levenshteinDistance(normalizedInputNoDiacritics, normalizedTargetNoDiacritics);
  const tokenSwap = isSingleAdjacentTokenSwap(normalizedInputNoDiacritics, normalizedTargetNoDiacritics);

  return {
    normalizedInput,
    normalizedTarget,
    normalizedInputNoDiacritics,
    normalizedTargetNoDiacritics,
    threshold,
    distance,
    tokenSwap
  };
}

function classifySingle(input: string, target: string, options: ClassifyAttemptOptions = {}): AttemptClassification {
  const metrics = buildBaseMetrics(input, target);

  if (metrics.normalizedInput === metrics.normalizedTarget) {
    return {
      result: 'exact',
      reasonCode: 'exact_match',
      bestMatch: target,
      metrics: {
        ...metrics,
        asrSubsequence: false
      }
    };
  }

  if (metrics.normalizedInputNoDiacritics === metrics.normalizedTargetNoDiacritics) {
    return {
      result: 'near_miss',
      reasonCode: 'accent_only',
      bestMatch: target,
      metrics: {
        ...metrics,
        asrSubsequence: false
      }
    };
  }

  if (metrics.tokenSwap) {
    return {
      result: 'near_miss',
      reasonCode: 'token_swap',
      bestMatch: target,
      metrics: {
        ...metrics,
        asrSubsequence: false
      }
    };
  }

  if (metrics.distance <= metrics.threshold) {
    return {
      result: 'near_miss',
      reasonCode: 'edit_distance',
      bestMatch: target,
      metrics: {
        ...metrics,
        asrSubsequence: false
      }
    };
  }

  if (options.isASR && hasReasonableASRSubsequence(metrics.normalizedInputNoDiacritics, metrics.normalizedTargetNoDiacritics)) {
    return {
      result: 'near_miss',
      reasonCode: 'asr_subsequence',
      bestMatch: target,
      metrics: {
        ...metrics,
        asrSubsequence: true
      }
    };
  }

  return {
    result: 'incorrect',
    reasonCode: 'no_match',
    bestMatch: target,
    metrics: {
      ...metrics,
      asrSubsequence: false
    }
  };
}

function score(result: AttemptClassification['result']): number {
  if (result === 'exact') {
    return 2;
  }

  if (result === 'near_miss') {
    return 1;
  }

  return 0;
}

export function classifyAttempt(
  input: string,
  targets: string[],
  options: ClassifyAttemptOptions = {}
): AttemptClassification {
  if (!targets.length) {
    return classifySingle(input, '', options);
  }

  const matches = targets.map((target) => classifySingle(input, target, options));
  matches.sort((a, b) => {
    const scoreDelta = score(b.result) - score(a.result);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return a.metrics.distance - b.metrics.distance;
  });

  return matches[0];
}
