// Mental Models track
export { mentalModels } from './mental-models';

// Cognitive Biases track
export { foundationModels } from './foundations';
export { decisionBiases } from './decision-biases';
export { socialBiases } from './social-biases';
export { informationBiases } from './information-biases';
export { probabilityBiases } from './probability-biases';
export { memoryBiases } from './memory-biases';
export { selfPerceptionBiases } from './self-perception-biases';
export { attentionBiases } from './attention-biases';

// Jak funguje člověk? track
export { hfBodyModels } from './hf-body';
export { hfBrainModels } from './hf-brain';
export { hfSocietyModels } from './hf-society';

// Lifestyle tracks
export { healthModels } from './health-models';
export { mindfulnessModels } from './mindfulness-models';
export { productivityModels } from './productivity-models';
export { mindsetsModels } from './mindsets-models';
export { performanceModels } from './performance-models';

import type { MentalModel } from '@/types';
import { mentalModels } from './mental-models';
import { foundationModels } from './foundations';
import { decisionBiases } from './decision-biases';
import { socialBiases } from './social-biases';
import { informationBiases } from './information-biases';
import { probabilityBiases } from './probability-biases';
import { memoryBiases } from './memory-biases';
import { selfPerceptionBiases } from './self-perception-biases';
import { attentionBiases } from './attention-biases';
import { hfBodyModels } from './hf-body';
import { hfBrainModels } from './hf-brain';
import { hfSocietyModels } from './hf-society';
import { healthModels } from './health-models';
import { mindfulnessModels } from './mindfulness-models';
import { productivityModels } from './productivity-models';
import { mindsetsModels } from './mindsets-models';
import { performanceModels } from './performance-models';

export const allModels: MentalModel[] = [
  ...mentalModels,
  ...foundationModels,
  ...decisionBiases,
  ...socialBiases,
  ...informationBiases,
  ...probabilityBiases,
  ...memoryBiases,
  ...selfPerceptionBiases,
  ...attentionBiases,
  ...hfBodyModels,
  ...hfBrainModels,
  ...hfSocietyModels,
  ...healthModels,
  ...mindfulnessModels,
  ...productivityModels,
  ...mindsetsModels,
  ...performanceModels,
];
