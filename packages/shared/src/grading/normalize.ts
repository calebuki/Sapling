const PUNCTUATION_REGEX = /[.,!?;:'"“”‘’()[\]{}<>«»_-]/g;

export function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(PUNCTUATION_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeTextWithoutDiacritics(value: string): string {
  return stripDiacritics(normalizeText(value));
}
