import { describe, expect, it } from 'vitest';
import { classifyAttempt, normalizeText } from '../src';

describe('normalizeText', () => {
  it('normalizes whitespace and punctuation', () => {
    expect(normalizeText('  Bonjour!!!   le   chat  ')).toBe('bonjour le chat');
  });
});

describe('classifyAttempt', () => {
  it('returns exact for exact normalized match', () => {
    const result = classifyAttempt('Bonjour', ['bonjour']);
    expect(result.result).toBe('exact');
  });

  it('returns near miss for accent-only differences', () => {
    const result = classifyAttempt('tres bien', ['très bien']);
    expect(result.result).toBe('near_miss');
    expect(result.reasonCode).toBe('accent_only');
  });

  it('returns near miss for punctuation and spacing edits', () => {
    const result = classifyAttempt('bonjour,le chat', ['bonjour le chat']);
    expect(result.result).toBe('exact');
  });

  it('returns near miss for single adjacent token swap', () => {
    const result = classifyAttempt('chat le', ['le chat']);
    expect(result.result).toBe('near_miss');
    expect(result.reasonCode).toBe('token_swap');
  });

  it('returns near miss for ASR subsequence match', () => {
    const result = classifyAttempt('oui je suis tres bien', ['je suis très bien'], { isASR: true });
    expect(result.result).toBe('near_miss');
    expect(result.reasonCode).toBe('asr_subsequence');
  });
});
