import prismaClientPkg from '@prisma/client';
import {
  COMPREHENSION_PHASE_UNITS,
  DAILY_GOAL_DEFAULT,
  NATIVE_LANGUAGE,
  TARGET_LANGUAGE
} from '@sapling/shared';

const { PrismaClient, ExerciseModality, ExerciseType } = prismaClientPkg;
const prisma = new PrismaClient();

type PrismaExerciseType = (typeof ExerciseType)[keyof typeof ExerciseType];
type PrismaExerciseModality = (typeof ExerciseModality)[keyof typeof ExerciseModality];

type SeedExercise = {
  order: number;
  type: PrismaExerciseType;
  modality: PrismaExerciseModality;
  promptText: string;
  difficulty?: number;
  data: Record<string, unknown>;
  itemKeys: string[];
  patternKeys: string[];
};

type SeedLesson = {
  order: number;
  title: string;
  description: string;
  exercises: SeedExercise[];
};

type SeedUnit = {
  order: number;
  title: string;
  description: string;
  phase: string;
  lessons: SeedLesson[];
};

async function main() {
  await prisma.$transaction([
    prisma.attempt.deleteMany(),
    prisma.lessonCompletion.deleteMany(),
    prisma.dailyActivity.deleteMany(),
    prisma.userItemState.deleteMany(),
    prisma.exercisePattern.deleteMany(),
    prisma.exerciseItem.deleteMany(),
    prisma.itemPattern.deleteMany(),
    prisma.exercise.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.unit.deleteMany(),
    prisma.course.deleteMany(),
    prisma.pattern.deleteMany(),
    prisma.item.deleteMany(),
    prisma.profile.deleteMany()
  ]);

  const course = await prisma.course.create({
    data: {
      slug: 'fr-en-sapling-path',
      title: 'French Sapling Path',
      description:
        'Meaning-first French for English speakers, with listening and speaking at the center.',
      targetLanguage: TARGET_LANGUAGE,
      nativeLanguage: NATIVE_LANGUAGE
    }
  });

  const patternInputs = [
    {
      key: 'noun_concrete',
      name: 'Concrete Noun Mapping',
      description: 'Direct image-audio mapping for concrete objects.',
      difficulty: 1
    },
    {
      key: 'deictic_cest',
      name: 'C’est Frames',
      description: 'Implicit exposure to c\'est + noun phrase.',
      difficulty: 1
    },
    {
      key: 'present_je_verb',
      name: 'Present Tense Je + Verb',
      description: 'High-frequency first-person present forms.',
      difficulty: 2
    },
    {
      key: 'present_il_elle_verb',
      name: 'Present Tense Il/Elle + Verb',
      description: 'Short third-person present forms.',
      difficulty: 2
    },
    {
      key: 'greeting_formula',
      name: 'Greeting Formulae',
      description: 'Polite interaction chunks.',
      difficulty: 2
    },
    {
      key: 'adj_after_noun',
      name: 'Adjective Exposure',
      description: 'Noun-adjective phrase recognition and production.',
      difficulty: 3
    }
  ] as const;

  const patterns = new Map<string, { id: string; key: string }>();
  for (const input of patternInputs) {
    const pattern = await prisma.pattern.create({ data: input });
    patterns.set(input.key, pattern);
  }

  const itemInputs = [
    {
      key: 'chat',
      sourceText: 'cat',
      targetText: 'le chat',
      imagePath: '/images/chat.svg',
      audioText: 'le chat',
      difficulty: 1,
      patternKeys: ['noun_concrete', 'deictic_cest']
    },
    {
      key: 'chien',
      sourceText: 'dog',
      targetText: 'le chien',
      imagePath: '/images/chien.svg',
      audioText: 'le chien',
      difficulty: 1,
      patternKeys: ['noun_concrete', 'deictic_cest']
    },
    {
      key: 'pomme',
      sourceText: 'apple',
      targetText: 'la pomme',
      imagePath: '/images/pomme.svg',
      audioText: 'la pomme',
      difficulty: 1,
      patternKeys: ['noun_concrete', 'deictic_cest']
    },
    {
      key: 'eau',
      sourceText: 'water',
      targetText: 'l\'eau',
      imagePath: '/images/eau.svg',
      audioText: 'l\'eau',
      difficulty: 1,
      patternKeys: ['noun_concrete', 'deictic_cest']
    },
    {
      key: 'je_mange',
      sourceText: 'I eat',
      targetText: 'je mange',
      audioText: 'je mange',
      difficulty: 2,
      patternKeys: ['present_je_verb']
    },
    {
      key: 'je_bois',
      sourceText: 'I drink',
      targetText: 'je bois',
      audioText: 'je bois',
      difficulty: 2,
      patternKeys: ['present_je_verb']
    },
    {
      key: 'je_vais',
      sourceText: 'I go',
      targetText: 'je vais',
      audioText: 'je vais',
      difficulty: 2,
      patternKeys: ['present_je_verb']
    },
    {
      key: 'il_mange',
      sourceText: 'he eats',
      targetText: 'il mange',
      audioText: 'il mange',
      difficulty: 2,
      patternKeys: ['present_il_elle_verb']
    },
    {
      key: 'elle_boit',
      sourceText: 'she drinks',
      targetText: 'elle boit',
      audioText: 'elle boit',
      difficulty: 2,
      patternKeys: ['present_il_elle_verb']
    },
    {
      key: 'bonjour',
      sourceText: 'hello',
      targetText: 'bonjour',
      audioText: 'bonjour',
      difficulty: 2,
      patternKeys: ['greeting_formula']
    },
    {
      key: 'merci',
      sourceText: 'thank you',
      targetText: 'merci',
      audioText: 'merci',
      difficulty: 2,
      patternKeys: ['greeting_formula']
    },
    {
      key: 'tres_bien',
      sourceText: 'very well',
      targetText: 'très bien',
      audioText: 'très bien',
      difficulty: 2,
      patternKeys: ['greeting_formula']
    },
    {
      key: 'petit_chat',
      sourceText: 'small cat',
      targetText: 'petit chat',
      audioText: 'petit chat',
      difficulty: 3,
      patternKeys: ['adj_after_noun']
    },
    {
      key: 'grand_chien',
      sourceText: 'big dog',
      targetText: 'grand chien',
      audioText: 'grand chien',
      difficulty: 3,
      patternKeys: ['adj_after_noun']
    },
    {
      key: 'ca_va',
      sourceText: 'it\'s going well',
      targetText: 'ça va',
      audioText: 'ça va',
      difficulty: 3,
      patternKeys: ['greeting_formula']
    }
  ] as const;

  const items = new Map<string, { id: string; key: string; targetText: string; imagePath: string | null }>();
  for (const input of itemInputs) {
    const item = await prisma.item.create({
      data: {
        key: input.key,
        sourceText: input.sourceText,
        targetText: input.targetText,
        imagePath: input.imagePath,
        audioText: input.audioText,
        difficulty: input.difficulty
      }
    });

    items.set(input.key, item);

    for (const patternKey of input.patternKeys) {
      const pattern = patterns.get(patternKey);
      if (pattern) {
        await prisma.itemPattern.create({
          data: {
            itemId: item.id,
            patternId: pattern.id
          }
        });
      }
    }
  }

  const units: SeedUnit[] = [
    {
      order: 1,
      title: 'See and Hear Basics',
      description: 'Build meaning with images and sound first.',
      phase: 'comprehension',
      lessons: [
        {
          order: 1,
          title: 'Animals and Things',
          description: 'Recognize core nouns from audio and images.',
          exercises: [
            {
              order: 1,
              type: ExerciseType.LISTEN_PICK_IMAGE,
              modality: ExerciseModality.LISTEN,
              promptText: 'Listen and pick the right image.',
              data: {
                answers: ['le chat'],
                imageChoices: ['/images/chat.svg', '/images/chien.svg', '/images/pomme.svg'],
                audioText: 'le chat'
              },
              itemKeys: ['chat'],
              patternKeys: ['noun_concrete']
            },
            {
              order: 2,
              type: ExerciseType.LISTEN_PICK_IMAGE,
              modality: ExerciseModality.LISTEN,
              promptText: 'Listen and pick the right image.',
              data: {
                answers: ['le chien'],
                imageChoices: ['/images/chien.svg', '/images/chat.svg', '/images/eau.svg'],
                audioText: 'le chien'
              },
              itemKeys: ['chien'],
              patternKeys: ['noun_concrete']
            },
            {
              order: 3,
              type: ExerciseType.LISTEN_PICK_IMAGE,
              modality: ExerciseModality.LISTEN,
              promptText: 'Listen and pick the right image.',
              data: {
                answers: ['la pomme'],
                imageChoices: ['/images/pomme.svg', '/images/chat.svg', '/images/eau.svg'],
                audioText: 'la pomme'
              },
              itemKeys: ['pomme'],
              patternKeys: ['noun_concrete']
            },
            {
              order: 4,
              type: ExerciseType.IMAGE_PICK_WORD,
              modality: ExerciseModality.LISTEN,
              promptText: 'Pick the French phrase for this image.',
              data: {
                answers: ['l\'eau'],
                options: ['la pomme', 'le chien', "l'eau"],
                imageChoices: ['/images/eau.svg']
              },
              itemKeys: ['eau'],
              patternKeys: ['noun_concrete']
            },
            {
              order: 5,
              type: ExerciseType.IMAGE_PICK_WORD,
              modality: ExerciseModality.LISTEN,
              promptText: 'Pick the French phrase for this image.',
              data: {
                answers: ['le chat'],
                options: ['le chien', 'le chat', "l'eau"],
                imageChoices: ['/images/chat.svg']
              },
              itemKeys: ['chat'],
              patternKeys: ['noun_concrete']
            },
            {
              order: 6,
              type: ExerciseType.SPEAK_REPEAT,
              modality: ExerciseModality.SPEAK,
              promptText: 'Repeat the phrase aloud.',
              data: {
                answers: ['le chien'],
                audioText: 'le chien'
              },
              itemKeys: ['chien'],
              patternKeys: ['noun_concrete']
            }
          ]
        },
        {
          order: 2,
          title: 'C’est + Noun',
          description: 'Understand simple deictic frames by exposure.',
          exercises: [
            {
              order: 1,
              type: ExerciseType.LISTEN_PICK_IMAGE,
              modality: ExerciseModality.LISTEN,
              promptText: 'Listen and choose the image.',
              data: {
                answers: ["c'est le chat"],
                imageChoices: ['/images/chat.svg', '/images/pomme.svg', '/images/eau.svg'],
                audioText: "c'est le chat"
              },
              itemKeys: ['chat'],
              patternKeys: ['deictic_cest']
            },
            {
              order: 2,
              type: ExerciseType.LISTEN_PICK_IMAGE,
              modality: ExerciseModality.LISTEN,
              promptText: 'Listen and choose the image.',
              data: {
                answers: ["c'est la pomme"],
                imageChoices: ['/images/pomme.svg', '/images/chat.svg', '/images/chien.svg'],
                audioText: "c'est la pomme"
              },
              itemKeys: ['pomme'],
              patternKeys: ['deictic_cest']
            },
            {
              order: 3,
              type: ExerciseType.IMAGE_PICK_WORD,
              modality: ExerciseModality.LISTEN,
              promptText: 'Pick the phrase that fits the image.',
              data: {
                answers: ["c'est l'eau"],
                options: ["c'est le chien", "c'est l'eau", "c'est la pomme"],
                imageChoices: ['/images/eau.svg']
              },
              itemKeys: ['eau'],
              patternKeys: ['deictic_cest']
            },
            {
              order: 4,
              type: ExerciseType.SPEAK_REPEAT,
              modality: ExerciseModality.SPEAK,
              promptText: 'Repeat the phrase aloud.',
              data: {
                answers: ["c'est le chien"],
                audioText: "c'est le chien"
              },
              itemKeys: ['chien'],
              patternKeys: ['deictic_cest']
            }
          ]
        }
      ]
    },
    {
      order: 2,
      title: 'Actions in Motion',
      description: 'Build short action phrases with high-frequency verbs.',
      phase: 'comprehension',
      lessons: [
        {
          order: 1,
          title: 'Je + Action',
          description: 'Listen and produce short first-person forms.',
          exercises: [
            {
              order: 1,
              type: ExerciseType.LISTEN_PICK_IMAGE,
              modality: ExerciseModality.LISTEN,
              promptText: 'Listen and choose the matching picture.',
              data: {
                answers: ['je mange'],
                imageChoices: ['/images/manger.svg', '/images/boire.svg', '/images/aller.svg'],
                audioText: 'je mange'
              },
              itemKeys: ['je_mange'],
              patternKeys: ['present_je_verb']
            },
            {
              order: 2,
              type: ExerciseType.IMAGE_PICK_WORD,
              modality: ExerciseModality.LISTEN,
              promptText: 'Pick the phrase for this action.',
              data: {
                answers: ['je bois'],
                options: ['je vais', 'je bois', 'je mange'],
                imageChoices: ['/images/boire.svg']
              },
              itemKeys: ['je_bois'],
              patternKeys: ['present_je_verb']
            },
            {
              order: 3,
              type: ExerciseType.LISTEN_TYPE,
              modality: ExerciseModality.TYPE,
              promptText: 'Type what you hear.',
              data: {
                answers: ['je vais'],
                audioText: 'je vais',
                hint: 'Starts with je ...'
              },
              itemKeys: ['je_vais'],
              patternKeys: ['present_je_verb']
            },
            {
              order: 4,
              type: ExerciseType.SPEAK_REPEAT,
              modality: ExerciseModality.SPEAK,
              promptText: 'Repeat after the audio.',
              data: {
                answers: ['je mange'],
                audioText: 'je mange'
              },
              itemKeys: ['je_mange'],
              patternKeys: ['present_je_verb']
            }
          ]
        },
        {
          order: 2,
          title: 'He and She Actions',
          description: 'Recognize short third-person action phrases.',
          exercises: [
            {
              order: 1,
              type: ExerciseType.IMAGE_PICK_WORD,
              modality: ExerciseModality.LISTEN,
              promptText: 'Pick the phrase that matches.',
              data: {
                answers: ['il mange'],
                options: ['il mange', 'elle boit', 'je vais'],
                imageChoices: ['/images/manger.svg']
              },
              itemKeys: ['il_mange'],
              patternKeys: ['present_il_elle_verb']
            },
            {
              order: 2,
              type: ExerciseType.LISTEN_TYPE,
              modality: ExerciseModality.TYPE,
              promptText: 'Type what you hear.',
              data: {
                answers: ['elle boit'],
                audioText: 'elle boit',
                hint: 'Starts with elle ...'
              },
              itemKeys: ['elle_boit'],
              patternKeys: ['present_il_elle_verb']
            },
            {
              order: 3,
              type: ExerciseType.TILE_ORDER,
              modality: ExerciseModality.TYPE,
              promptText: 'Arrange the tiles.',
              data: {
                answers: ['il mange'],
                options: ['mange', 'il', 'boit']
              },
              itemKeys: ['il_mange'],
              patternKeys: ['present_il_elle_verb']
            },
            {
              order: 4,
              type: ExerciseType.SPEAK_REPEAT,
              modality: ExerciseModality.SPEAK,
              promptText: 'Say the phrase out loud.',
              data: {
                answers: ['elle boit'],
                audioText: 'elle boit'
              },
              itemKeys: ['elle_boit'],
              patternKeys: ['present_il_elle_verb']
            }
          ]
        }
      ]
    },
    {
      order: 3,
      title: 'Greetings and Descriptions',
      description: 'Blend greetings and simple descriptive phrases.',
      phase: 'guided_production',
      lessons: [
        {
          order: 1,
          title: 'Polite Phrases',
          description: 'Practice greeting chunks and short responses.',
          exercises: [
            {
              order: 1,
              type: ExerciseType.LISTEN_PICK_IMAGE,
              modality: ExerciseModality.LISTEN,
              promptText: 'Listen and select the phrase card.',
              data: {
                answers: ['bonjour'],
                options: ['bonjour', 'merci', 'très bien'],
                audioText: 'bonjour'
              },
              itemKeys: ['bonjour'],
              patternKeys: ['greeting_formula']
            },
            {
              order: 2,
              type: ExerciseType.LISTEN_TYPE,
              modality: ExerciseModality.TYPE,
              promptText: 'Type what you hear.',
              data: {
                answers: ['merci'],
                audioText: 'merci',
                hint: 'A common thank-you phrase.'
              },
              itemKeys: ['merci'],
              patternKeys: ['greeting_formula']
            },
            {
              order: 3,
              type: ExerciseType.PHRASE_COMPLETE,
              modality: ExerciseModality.TYPE,
              promptText: 'Complete the phrase: je vais ___',
              data: {
                answers: ['très bien'],
                options: ['bonjour', 'très bien', 'merci']
              },
              itemKeys: ['tres_bien'],
              patternKeys: ['greeting_formula']
            },
            {
              order: 4,
              type: ExerciseType.SPEAK_REPEAT,
              modality: ExerciseModality.SPEAK,
              promptText: 'Say it with the same rhythm.',
              data: {
                answers: ['ça va'],
                audioText: 'ça va'
              },
              itemKeys: ['ca_va'],
              patternKeys: ['greeting_formula']
            }
          ]
        },
        {
          order: 2,
          title: 'Small and Big',
          description: 'Use adjective phrases with confidence.',
          exercises: [
            {
              order: 1,
              type: ExerciseType.IMAGE_PICK_WORD,
              modality: ExerciseModality.LISTEN,
              promptText: 'Choose the phrase for this image.',
              data: {
                answers: ['petit chat'],
                options: ['grand chien', 'petit chat', 'bonjour'],
                imageChoices: ['/images/chat.svg']
              },
              itemKeys: ['petit_chat'],
              patternKeys: ['adj_after_noun']
            },
            {
              order: 2,
              type: ExerciseType.TILE_ORDER,
              modality: ExerciseModality.TYPE,
              promptText: 'Arrange tiles into a phrase.',
              data: {
                answers: ['grand chien'],
                options: ['chien', 'grand', 'petit']
              },
              itemKeys: ['grand_chien'],
              patternKeys: ['adj_after_noun']
            },
            {
              order: 3,
              type: ExerciseType.LISTEN_TYPE,
              modality: ExerciseModality.TYPE,
              promptText: 'Type what you hear.',
              data: {
                answers: ['petit chat'],
                audioText: 'petit chat',
                hint: 'Two words. First means small.'
              },
              itemKeys: ['petit_chat'],
              patternKeys: ['adj_after_noun']
            },
            {
              order: 4,
              type: ExerciseType.SPEAK_REPEAT,
              modality: ExerciseModality.SPEAK,
              promptText: 'Repeat the phrase aloud.',
              data: {
                answers: ['grand chien'],
                audioText: 'grand chien'
              },
              itemKeys: ['grand_chien'],
              patternKeys: ['adj_after_noun']
            }
          ]
        }
      ]
    }
  ];

  for (const unitInput of units) {
    const unit = await prisma.unit.create({
      data: {
        courseId: course.id,
        order: unitInput.order,
        title: unitInput.title,
        description: unitInput.description,
        phase: unitInput.phase,
        isGrammar: unitInput.order >= COMPREHENSION_PHASE_UNITS + 2
      }
    });

    for (const lessonInput of unitInput.lessons) {
      const lesson = await prisma.lesson.create({
        data: {
          unitId: unit.id,
          order: lessonInput.order,
          title: lessonInput.title,
          description: lessonInput.description,
          isOptionalGrammar: false
        }
      });

      for (const exerciseInput of lessonInput.exercises) {
        const exercise = await prisma.exercise.create({
          data: {
            lessonId: lesson.id,
            order: exerciseInput.order,
            type: exerciseInput.type,
            modality: exerciseInput.modality,
            promptText: exerciseInput.promptText,
            difficulty: exerciseInput.difficulty ?? unitInput.order,
            data: JSON.stringify(exerciseInput.data)
          }
        });

        for (const itemKey of exerciseInput.itemKeys) {
          const item = items.get(itemKey);
          if (item) {
            await prisma.exerciseItem.create({
              data: {
                exerciseId: exercise.id,
                itemId: item.id
              }
            });
          }
        }

        for (const patternKey of exerciseInput.patternKeys) {
          const pattern = patterns.get(patternKey);
          if (pattern) {
            await prisma.exercisePattern.create({
              data: {
                exerciseId: exercise.id,
                patternId: pattern.id
              }
            });
          }
        }
      }
    }
  }

  await prisma.profile.create({
    data: {
      name: 'Guest',
      isGuest: true,
      dailyGoalMinutes: DAILY_GOAL_DEFAULT,
      targetLanguage: TARGET_LANGUAGE,
      nativeLanguage: NATIVE_LANGUAGE
    }
  });

  console.info('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
