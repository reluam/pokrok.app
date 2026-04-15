import { allLessons } from '@/data/lessons/index';
import LessonClient from './LessonClient';

export function generateStaticParams() {
  return allLessons.map((l) => ({ id: l.id }));
}

export default function LessonPage() {
  return <LessonClient />;
}
