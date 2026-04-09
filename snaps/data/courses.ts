import type { Course } from '@/types';

export const courses: Course[] = [
  {
    id: 'course-01',
    title: 'Ostrost mysli',
    subtitle: 'Základní nástroje jasného myšlení',
    icon_name: 'Zap',
    color: '#0EA5E9',
    order: 0,
    nodes: [
      { modelId: 'mm-02', order: 0 }, // Occam's Razor
      { modelId: 'mm-07', order: 1 }, // Hanlon's Razor
      { modelId: 'mm-09', order: 2 }, // Pareto Principle
      { modelId: 'mm-15', order: 3 }, // Eisenhower Matrix
    ],
  },
  {
    id: 'course-02',
    title: 'Pasti mysli',
    subtitle: 'Rozpoznej kognitivní zkreslení',
    icon_name: 'AlertTriangle',
    color: '#F59E0B',
    order: 1,
    nodes: [
      { modelId: 'mm-10', order: 0 }, // Sunk Cost Fallacy
      { modelId: 'mm-08', order: 1 }, // Confirmation Bias
      { modelId: 'mm-11', order: 2 }, // Survivorship Bias
      { modelId: 'mm-12', order: 3 }, // Opportunity Cost
    ],
  },
  {
    id: 'course-03',
    title: 'Strategické nástroje',
    subtitle: 'Myšlení pro lepší rozhodování',
    icon_name: 'Target',
    color: '#22C55E',
    order: 2,
    nodes: [
      { modelId: 'mm-01', order: 0 }, // First Principles
      { modelId: 'mm-04', order: 1 }, // Inversion
      { modelId: 'mm-05', order: 2 }, // Circle of Competence
      { modelId: 'mm-13', order: 3 }, // Margin of Safety
    ],
  },
  {
    id: 'course-04',
    title: 'Systémové myšlení',
    subtitle: 'Pochop komplexní systémy',
    icon_name: 'Network',
    color: '#A855F7',
    order: 3,
    nodes: [
      { modelId: 'mm-06', order: 0 }, // Map is Not the Territory
      { modelId: 'mm-14', order: 1 }, // Feedback Loops
      { modelId: 'mm-03', order: 2 }, // Second-Order Thinking
    ],
  },
];
