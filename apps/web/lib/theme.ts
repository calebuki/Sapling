import type { SceneProgression, ThemeTokens } from '@sapling/shared';

export const saplingThemeTokens: ThemeTokens = {
  primary: '#5ba558',
  secondary: '#4B7FA0',
  accent: '#F6C453',
  surface: '#FDF7EA',
  text: '#19331c',
  node: '#A4D39D',
  nodeCompleted: '#5BA558',
  nodeLocked: '#D6D0C8'
};

export const sceneProgression: SceneProgression[] = [
  {
    stage: 0,
    key: 'seed',
    title: 'Seed Stage',
    subtitle: 'Early listening roots',
    description: 'Ground-level sapling growth with image and audio association.'
  },
  {
    stage: 1,
    key: 'young_sapling',
    title: 'Young Sapling',
    subtitle: 'Pattern branches',
    description: 'Guided production starts while keeping listening dominant.'
  },
  {
    stage: 2,
    key: 'tall_tree',
    title: 'Tall Tree',
    subtitle: 'Speaking canopy',
    description: 'Speech confidence and natural phrase production increase.'
  },
  {
    stage: 3,
    key: 'sky_climb',
    title: 'Sky Climb',
    subtitle: 'Future stage placeholder',
    description: 'Future scene transition toward upper-sky and beyond.'
  }
];
