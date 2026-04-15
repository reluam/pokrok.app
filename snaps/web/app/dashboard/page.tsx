'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Flame,
  Star,
  Trophy,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Play,
  Brain,
  Sparkles,
  Check,
  Lock,
  Circle,
} from 'lucide-react';
import { TopNav } from '@web/components/landing/TopNav';
import { useWebUserStore, useStoreHydrated } from '@web/lib/user-store';
import { useWebLessonStore } from '@web/lib/lesson-store';
import { useAutoSync } from '@web/lib/use-auto-sync';
import { getLevelInfo } from '@/lib/xp-engine';
import type { Course, Track } from '@/types';

/* Neutral gray palette for card chrome (the design-token borders are orange) */
const CARD = 'rounded-2xl border-2 border-[#E5E7EB] bg-card shadow-[2px_4px_0_0_#D1D5DB]';
const CARD_HOVER = `${CARD} transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_12px_rgba(0,0,0,0.08)]`;

interface CourseModelNode {
  modelId: string;
  name: string;
  status: 'completed' | 'in_progress' | 'available' | 'locked';
  /** e.g. "3/7" — step progress from checkpoint, only for in_progress */
  stepProgress?: string;
  /** 0-100 percentage for progress bar */
  stepPct?: number;
}

interface ContinueItem {
  course: Course;
  track: Track | undefined;
  progress: number;
  nextModelId: string | null;
  nextModelName: string;
  totalModels: number;
  completedModels: number;
  lastInteractedAt: number;
  nodes: CourseModelNode[];
}

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const displayName = useWebUserStore((s) => s.displayName);
  const stats = useWebUserStore((s) => s.stats);
  const isAuthenticated = useWebUserStore((s) => s.isAuthenticated);
  const language = useWebUserStore((s) => s.language);

  const getTracks = useWebLessonStore((s) => s.getTracks);
  const getCourses = useWebLessonStore((s) => s.getCourses);
  const getCourseProgress = useWebLessonStore((s) => s.getCourseProgress);
  const getModelProgress = useWebLessonStore((s) => s.getModelProgress);
  const getNodeStatus = useWebLessonStore((s) => s.getNodeStatus);
  const isCourseUnlocked = useWebLessonStore((s) => s.isCourseUnlocked);
  const getNextLessonForModel = useWebLessonStore((s) => s.getNextLessonForModel);
  const getLessonsForModel = useWebLessonStore((s) => s.getLessonsForModel);
  const getModel = useWebLessonStore((s) => s.getModel);
  const getLesson = useWebLessonStore((s) => s.getLesson);
  const getDueReviews = useWebLessonStore((s) => s.getDueReviews);
  const progressMap = useWebLessonStore((s) => s.progress);
  const checkpoints = useWebLessonStore((s) => s.checkpoints);

  const t = (cs: string, en: string) => (language === 'en' ? en : cs);
  const locTitle = (obj: { title: string; title_en?: string }) =>
    language === 'en' && obj.title_en ? obj.title_en : obj.title;
  const locSubtitle = (obj: { subtitle: string; subtitle_en?: string }) =>
    language === 'en' && obj.subtitle_en ? obj.subtitle_en : obj.subtitle;

  const allTracks = getTracks();
  const dueReviews = getDueReviews();
  const levelInfo = getLevelInfo(stats.total_xp);

  const continueItems = useMemo<ContinueItem[]>(() => {
    const items: ContinueItem[] = [];
    for (const course of getCourses()) {
      if (!isCourseUnlocked(course.id)) continue;
      const progress = getCourseProgress(course.id);
      if (progress >= 1) continue;

      let nextModelId: string | null = null;
      for (const node of course.nodes) {
        const status = getNodeStatus(node.modelId);
        if (status === 'available' || status === 'in_progress') {
          nextModelId = node.modelId;
          break;
        }
      }
      if (!nextModelId) continue;

      const completedModels = course.nodes.filter(
        (n) => getModelProgress(n.modelId) >= 1,
      ).length;

      let lastInteractedAt = 0;
      for (const node of course.nodes) {
        for (const lesson of getLessonsForModel(node.modelId)) {
          const p = progressMap[lesson.id];
          if (p?.completed_at) {
            const ts = new Date(p.completed_at).getTime();
            if (ts > lastInteractedAt) lastInteractedAt = ts;
          }
        }
      }

      const nextModel = nextModelId ? getModel(nextModelId) : undefined;

      // Build node list with status, localized names, and lesson checkpoint info
      const nodes: CourseModelNode[] = course.nodes.map((n) => {
        const m = getModel(n.modelId);
        const status = getNodeStatus(n.modelId);

        // Find active lesson checkpoint for this model
        let stepProgress: string | undefined;
        let stepPct: number | undefined;
        if (status === 'in_progress' || status === 'available') {
          const modelLessons = getLessonsForModel(n.modelId);
          for (const ml of modelLessons) {
            const cp = checkpoints[ml.id];
            if (cp) {
              const total = getLesson(ml.id)?.content.steps.length ?? 0;
              if (total > 0) {
                stepProgress = `${cp.currentStep + 1}/${total}`;
                stepPct = Math.round(((cp.currentStep + 1) / total) * 100);
              }
              break;
            }
          }
        }

        return {
          modelId: n.modelId,
          name: m ? (language === 'en' ? m.name : m.name_cz) : n.modelId,
          status,
          stepProgress,
          stepPct,
        };
      });

      items.push({
        course,
        track: allTracks.find((t) => t.id === course.trackId),
        progress,
        nextModelId,
        nextModelName: nextModel
          ? language === 'en'
            ? nextModel.name
            : nextModel.name_cz
          : '',
        totalModels: course.nodes.length,
        completedModels,
        lastInteractedAt,
        nodes,
      });
    }

    items.sort((a, b) => {
      if (b.lastInteractedAt !== a.lastInteractedAt)
        return b.lastInteractedAt - a.lastInteractedAt;
      return b.progress - a.progress;
    });

    return items.slice(0, 6);
  }, [
    allTracks,
    getCourses,
    getCourseProgress,
    getModelProgress,
    getNodeStatus,
    isCourseUnlocked,
    getLessonsForModel,
    getModel,
    progressMap,
    checkpoints,
    language,
  ]);

  // Track IDs already represented in "Continue learning"
  const continueTrackIds = useMemo(
    () => new Set(continueItems.map((i) => i.course.trackId).filter(Boolean)),
    [continueItems],
  );

  const handleStartLesson = (modelId: string) => {
    const lesson = getNextLessonForModel(modelId);
    if (lesson) router.push(`/lesson/${lesson.id}`);
  };

  // Redirect unauthenticated users — wait for store rehydration first
  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace('/login');
  }, [hydrated, isAuthenticated, router]);

  // Sync on mount, on progress change, and on tab focus
  useAutoSync();

  const firstName = displayName?.split(' ')[0] || 'there';

  if (!hydrated || !isAuthenticated) return null;

  return (
    <>
      <TopNav />
      <main className="container-lg py-lg">
        {/* Welcome + Streak */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-ink-primary">
              {t(`Ahoj, ${firstName}!`, `Hey, ${firstName}!`)}
            </h1>
            <p className="mt-xs text-sm text-ink-secondary">
              {t('Co se dnes naučíš?', 'What will you learn today?')}
            </p>
          </div>
          {stats.current_streak > 0 && (
            <div className="flex items-center gap-xs rounded-full bg-card px-md py-xs">
              <Flame className="h-5 w-5 text-streak" fill="currentColor" />
              <span className="text-md font-extrabold text-streak">
                {stats.current_streak}
              </span>
              <span className="text-xs font-bold text-ink-muted">
                {t('dní', 'days')}
              </span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="mt-lg grid grid-cols-2 gap-md md:grid-cols-4">
          <StatCard
            icon={<Star className="h-5 w-5 text-xp" />}
            label="XP"
            value={stats.total_xp.toLocaleString()}
            bg="bg-xp-light"
          />
          <StatCard
            icon={<Trophy className="h-5 w-5 text-primary" />}
            label={t('Level', 'Level')}
            value={`${levelInfo.level} · ${levelInfo.title}`}
            bg="bg-primary-light"
          />
          <StatCard
            icon={<Flame className="h-5 w-5 text-streak" />}
            label={t('Série', 'Streak')}
            value={`${stats.current_streak} ${t('dní', 'days')}`}
            bg="bg-[#FFF3E0]"
          />
          <StatCard
            icon={<BookOpen className="h-5 w-5 text-teal" />}
            label={t('Koncepty', 'Concepts')}
            value={String(stats.models_mastered)}
            bg="bg-teal-light"
          />
        </div>

        {/* Due reviews strip */}
        {dueReviews.length > 0 && (
          <div className="mt-lg flex items-center gap-md rounded-xl bg-card p-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-md font-extrabold text-ink-primary">
                {t('K opakování', 'For review')}
              </p>
              <p className="text-xs text-ink-secondary">
                {dueReviews.length}{' '}
                {t('konceptů čeká', 'concepts waiting')}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-primary" />
          </div>
        )}

        {/* Main 2-column layout */}
        <div className="mt-lg grid gap-lg lg:grid-cols-3">
          {/* Left: Continue Learning — path pager */}
          <div className="lg:col-span-2">
            {continueItems.length > 0 ? (
              <CoursePager
                items={continueItems}
                onStartLesson={handleStartLesson}
                t={t}
                locTitle={locTitle}
                locSubtitle={locSubtitle}
              />
            ) : (
              <>
                <h2 className="text-lg font-extrabold text-ink-primary">
                  {t('Pokračuj v učení', 'Continue learning')}
                </h2>
                <div className={`mt-md flex flex-col items-center gap-sm p-xl text-center ${CARD}`}>
                  <Sparkles className="h-8 w-8 text-primary" />
                  <h3 className="text-lg font-extrabold text-ink-primary">
                    {t('Začni objevovat', 'Start exploring')}
                  </h3>
                  <p className="text-sm text-ink-secondary">
                    {t('Vyber si v knihovně svůj první koncept.', 'Pick your first concept below.')}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Right: Level progress */}
          <div className="space-y-md">
            {/* Level card */}
            <div className="rounded-2xl bg-card p-lg text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-xp bg-xp-light">
                <span className="text-2xl font-extrabold text-xp">
                  {levelInfo.level}
                </span>
              </div>
              <p className="mt-md text-lg font-extrabold text-ink-primary">
                {levelInfo.title}
              </p>
              <div className="mt-md">
                <div className="flex justify-between text-xs font-bold text-ink-muted">
                  <span>{stats.total_xp} XP</span>
                  <span>{levelInfo.xpForNextLevel} XP</span>
                </div>
                <div className="mt-xs h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-xp"
                    style={{ width: `${levelInfo.progress * 100}%` }}
                  />
                </div>
                <p className="mt-xs text-xs text-ink-muted">
                  {levelInfo.xpForNextLevel - stats.total_xp} XP{' '}
                  {t('do dalšího levelu', 'to next level')}
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-sm">
              <div className="rounded-xl bg-card p-md text-center">
                <p className="text-2xl font-extrabold text-streak">
                  {stats.longest_streak}
                </p>
                <p className="text-xs font-bold text-ink-muted">
                  {t('Nejdelší série', 'Best streak')}
                </p>
              </div>
              <div className="rounded-xl bg-card p-md text-center">
                <p className="text-2xl font-extrabold text-teal">
                  {stats.models_mastered}
                </p>
                <p className="text-xs font-bold text-ink-muted">
                  {t('Zvládnuto', 'Mastered')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Other Learning Tracks — excludes courses already in "Continue" */}
        <section className="mt-2xl">
          <h2 className="text-lg font-extrabold text-ink-primary">
            {t('Další učební cesty', 'More learning paths')}
          </h2>
          <div className="mt-md grid gap-md sm:grid-cols-2 lg:grid-cols-4">
            {allTracks
              .filter((track) => {
                // Show track only if it has at least one course NOT in continueItems
                const trackCourses = getCourses(track.id);
                return !continueTrackIds.has(track.id);
              })
              .map((track) => {
                const trackCourses = getCourses(track.id);
                const completedCourses = trackCourses.filter(
                  (c) => getCourseProgress(c.id) >= 1,
                ).length;

                return (
                  <div
                    key={track.id}
                    className={`group flex flex-col p-md ${CARD_HOVER}`}
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ backgroundColor: track.color + '18' }}
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: track.color }}
                      />
                    </div>
                    <h3 className="mt-sm text-md font-extrabold text-ink-primary">
                      {locTitle(track)}
                    </h3>
                    <p className="mt-xs text-xs text-ink-secondary line-clamp-2">
                      {locSubtitle(track)}
                    </p>
                    <div className="mt-auto pt-md">
                      <div className="flex items-center justify-between text-xs font-bold text-ink-muted">
                        <span>
                          {completedCourses}/{trackCourses.length}{' '}
                          {t('kurzů', 'courses')}
                        </span>
                      </div>
                      <div className="mt-xs h-1.5 overflow-hidden rounded-full bg-surface">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width:
                              trackCourses.length > 0
                                ? `${(completedCourses / trackCourses.length) * 100}%`
                                : '0%',
                            backgroundColor: track.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      </main>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-md rounded-xl bg-card p-md">
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${bg}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-ink-muted">{label}</p>
        <p className="truncate text-md font-extrabold text-ink-primary">
          {value}
        </p>
      </div>
    </div>
  );
}

/* ── Course path pager with arrows ── */
function CoursePager({
  items,
  onStartLesson,
  t,
  locTitle,
  locSubtitle,
}: {
  items: ContinueItem[];
  onStartLesson: (modelId: string) => void;
  t: (cs: string, en: string) => string;
  locTitle: (obj: { title: string; title_en?: string }) => string;
  locSubtitle: (obj: { subtitle: string; subtitle_en?: string }) => string;
}) {
  const [page, setPage] = useState(0);
  const item = items[page];
  const accent = item.track?.color ?? '#FF8C42';

  return (
    <div>
      {/* Header with arrows */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-ink-primary">
          {t('Pokračuj v učení', 'Continue learning')}
        </h2>
        {items.length > 1 && (
          <div className="flex items-center gap-xs">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#E5E7EB] bg-white text-ink-secondary transition-colors hover:bg-surface disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[40px] text-center text-xs font-bold text-ink-muted">
              {page + 1}/{items.length}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(items.length - 1, p + 1))}
              disabled={page === items.length - 1}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#E5E7EB] bg-white text-ink-secondary transition-colors hover:bg-surface disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Course card with path */}
      <div className={`mt-md p-lg ${CARD}`}>
        {/* Track + course header */}
        {item.track && (
          <div className="flex items-center gap-xs">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
              {locTitle(item.track)}
            </span>
          </div>
        )}
        <h3 className="mt-xs text-xl font-extrabold text-ink-primary">
          {locTitle(item.course)}
        </h3>
        <p className="mt-xs text-sm text-ink-secondary">{locSubtitle(item.course)}</p>

        {/* Progress bar */}
        <div className="mt-md">
          <div className="flex items-center justify-between text-xs font-bold text-ink-muted">
            <span>{item.completedModels}/{item.totalModels} {t('konceptů', 'concepts')}</span>
            <span>{Math.round(item.progress * 100)}%</span>
          </div>
          <div className="mt-xs h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full transition-all" style={{ width: `${item.progress * 100}%`, backgroundColor: accent }} />
          </div>
        </div>

        {/* Node path */}
        <div className="mt-lg space-y-0">
          {item.nodes.map((node, i) => {
            const isNext = node.modelId === item.nextModelId;
            const isCompleted = node.status === 'completed';
            const isLocked = node.status === 'locked';
            const isLast = i === item.nodes.length - 1;

            return (
              <div key={node.modelId} className="flex">
                {/* Vertical line + node dot */}
                <div className="flex w-10 flex-shrink-0 flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    isCompleted ? 'border-success bg-success text-white'
                    : isNext ? 'border-primary bg-primary text-white'
                    : isLocked ? 'border-[#E5E7EB] bg-surface text-ink-muted/40'
                    : 'border-[#E5E7EB] bg-white text-ink-muted'
                  }`}>
                    {isCompleted ? <Check className="h-4 w-4" />
                      : isLocked ? <Lock className="h-3 w-3" />
                      : isNext ? <Play className="h-3 w-3" fill="currentColor" />
                      : <Circle className="h-3 w-3" />}
                  </div>
                  {!isLast && (
                    <div className={`w-[2px] flex-1 min-h-[16px] ${isCompleted ? 'bg-success' : 'bg-[#E5E7EB]'}`} />
                  )}
                </div>

                {/* Label + action */}
                <div className={`flex flex-1 items-center pb-md pl-sm ${isLocked ? 'opacity-50' : ''}`}>
                  {isNext ? (
                    <button
                      onClick={() => onStartLesson(node.modelId)}
                      className="flex flex-1 items-center gap-sm rounded-xl px-md py-sm text-left transition-all hover:-translate-y-0.5"
                      style={{ backgroundColor: accent + '14' }}
                    >
                      <span className="flex-shrink-0 text-sm font-bold" style={{ color: accent }}>{node.name}</span>
                      {node.stepProgress && (
                        <div className="flex flex-1 items-center gap-sm">
                          <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-black/5">
                            <div className="h-full rounded-full" style={{ width: `${node.stepPct ?? 0}%`, backgroundColor: accent }} />
                          </div>
                          <span className="flex-shrink-0 text-[11px] font-bold text-ink-muted">{node.stepProgress}</span>
                        </div>
                      )}
                      <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: accent }} />
                    </button>
                  ) : (
                    <div className="flex items-center gap-sm px-md py-sm">
                      <span className={`flex-shrink-0 text-sm ${
                        isCompleted ? 'font-semibold text-ink-secondary' : 'font-medium text-ink-muted'
                      }`}>
                        {node.name}
                      </span>
                      {node.stepProgress && (
                        <div className="flex flex-1 items-center gap-sm">
                          <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-surface">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${node.stepPct ?? 0}%` }} />
                          </div>
                          <span className="flex-shrink-0 text-[11px] font-bold text-ink-muted">{node.stepProgress}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
