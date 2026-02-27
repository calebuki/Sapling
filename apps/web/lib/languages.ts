export type LearningLanguageCode = 'fr' | 'de' | 'es';

export type LearningLanguageMeta = {
  code: LearningLanguageCode;
  label: string;
  flag: string;
  locale: string;
  seeded: boolean;
};

export const LEARNING_LANGUAGES: LearningLanguageMeta[] = [
  {
    code: 'fr',
    label: 'French',
    flag: '🇫🇷',
    locale: 'fr-FR',
    seeded: true
  },
  {
    code: 'de',
    label: 'German',
    flag: '🇩🇪',
    locale: 'de-DE',
    seeded: false
  },
  {
    code: 'es',
    label: 'Spanish',
    flag: '🇪🇸',
    locale: 'es-ES',
    seeded: false
  }
];

export function getLearningLanguageMeta(code: LearningLanguageCode): LearningLanguageMeta {
  return LEARNING_LANGUAGES.find((language) => language.code === code) ?? LEARNING_LANGUAGES[0];
}

export function isSeededLearningLanguage(code: LearningLanguageCode): boolean {
  return getLearningLanguageMeta(code).seeded;
}
