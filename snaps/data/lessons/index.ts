// Mental Models track
export { mentalModelLessons } from './mental-model-lessons';

// Cognitive Biases track
export { foundationLessons } from './foundations-lessons';
export { decisionBiasesLessons } from './decision-biases-lessons';
export { socialBiasesLessons } from './social-biases-lessons';
export { informationBiasesLessons } from './information-biases-lessons';
export { probabilityBiasesLessons } from './probability-biases-lessons';
export { memoryBiasesLessons } from './memory-biases-lessons';
export { selfPerceptionBiasesLessons } from './self-perception-biases-lessons';
export { attentionBiasesLessons } from './attention-biases-lessons';

// Jak funguje člověk? track
export { hfBodyLessons } from './hf-body-lessons';
export { hfBrainLessons } from './hf-brain-lessons';
export { hfSocietyLessons } from './hf-society-lessons';

// Lifestyle tracks
export { healthLessons } from './health-lessons';
export { mindfulnessLessons } from './mindfulness-lessons';
export { productivityLessons } from './productivity-lessons';
export { mindsetsLessons } from './mindsets-lessons';
export { performanceLessons } from './performance-lessons';

import type { Lesson } from '@/types';
import { mentalModelLessons } from './mental-model-lessons';
import { foundationLessons } from './foundations-lessons';
import { decisionBiasesLessons } from './decision-biases-lessons';
import { socialBiasesLessons } from './social-biases-lessons';
import { informationBiasesLessons } from './information-biases-lessons';
import { probabilityBiasesLessons } from './probability-biases-lessons';
import { memoryBiasesLessons } from './memory-biases-lessons';
import { selfPerceptionBiasesLessons } from './self-perception-biases-lessons';
import { attentionBiasesLessons } from './attention-biases-lessons';
import { hfBodyLessons } from './hf-body-lessons';
import { hfBrainLessons } from './hf-brain-lessons';
import { hfSocietyLessons } from './hf-society-lessons';
import { healthLessons } from './health-lessons';
import { mindfulnessLessons } from './mindfulness-lessons';
import { productivityLessons } from './productivity-lessons';
import { mindsetsLessons } from './mindsets-lessons';
import { performanceLessons } from './performance-lessons';

export const allLessons: Lesson[] = [
  ...mentalModelLessons,
  ...foundationLessons,
  ...decisionBiasesLessons,
  ...socialBiasesLessons,
  ...informationBiasesLessons,
  ...probabilityBiasesLessons,
  ...memoryBiasesLessons,
  ...selfPerceptionBiasesLessons,
  ...attentionBiasesLessons,
  ...hfBodyLessons,
  ...hfBrainLessons,
  ...hfSocietyLessons,
  ...healthLessons,
  ...mindfulnessLessons,
  ...productivityLessons,
  ...mindsetsLessons,
  ...performanceLessons,
];
