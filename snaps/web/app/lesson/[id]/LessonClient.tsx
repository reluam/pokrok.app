'use client';

import { useState, useMemo, useRef, useEffect, Fragment } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  X,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  Target,
  Zap,
  Flame,
  BookOpen,
  HelpCircle,
  MessageCircle,
  Check,
  Circle,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { useWebUserStore } from '@web/lib/user-store';
import { useWebLessonStore } from '@web/lib/lesson-store';
import { useAutoSync } from '@web/lib/use-auto-sync';
import { calculateLessonXp } from '@/lib/xp-engine';
import type { LessonStep, ScenarioOption } from '@/types';

/* ── Markdown ── */
function Md({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**'))
          return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('*') && p.endsWith('*'))
          return <em key={i}>{p.slice(1, -1)}</em>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

function MdBlock({ text }: { text: string }) {
  return (
    <>
      {text.split('\n\n').map((para, i) => (
        <p key={i} className="mb-5 text-[16.5px] leading-[1.8] text-ink-primary">
          <Md text={para} />
        </p>
      ))}
    </>
  );
}

function localizeOptions(opts: ScenarioOption[], lang: 'cs' | 'en'): ScenarioOption[] {
  if (lang === 'cs') return opts;
  return opts.map((o) => ({ ...o, text: o.text_en || o.text, explanation: o.explanation_en || o.explanation }));
}

const STEP_META: Record<string, { label: string; icon: typeof BookOpen }> = {
  lesson_intro: { label: 'Úvod', icon: Sparkles },
  text: { label: 'Teorie', icon: BookOpen },
  key_insight: { label: 'Shrnutí', icon: Lightbulb },
  quiz: { label: 'Kvíz', icon: HelpCircle },
  scenario: { label: 'Scénář', icon: MessageCircle },
  engagement: { label: 'Zamysli se', icon: HelpCircle },
};

export default function LessonClient() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;

  const language = useWebUserStore((s) => s.language);
  const addXp = useWebUserStore((s) => s.addXp);
  const updateStreak = useWebUserStore((s) => s.updateStreak);
  const streakDays = useWebUserStore((s) => s.stats.current_streak);
  const completeLesson = useWebLessonStore((s) => s.completeLesson);
  const pushToServer = useWebLessonStore((s) => s.push);
  const saveCheckpoint = useWebLessonStore((s) => s.saveCheckpoint);

  // Auto-sync progress to server when lessons are completed
  useAutoSync();
  const getCheckpoint = useWebLessonStore((s) => s.getCheckpoint);
  const getLesson = useWebLessonStore((s) => s.getLesson);
  const getModel = useWebLessonStore((s) => s.getModel);
  const getLessonsForModel = useWebLessonStore((s) => s.getLessonsForModel);

  const lesson = getLesson(lessonId);
  const model = lesson ? getModel(lesson.model_id) : undefined;

  // Restore checkpoint if exists
  const savedCheckpoint = getCheckpoint(lessonId);
  const [currentStep, setCurrentStep] = useState(savedCheckpoint?.currentStep ?? 0);
  const [answeredSteps, setAnsweredSteps] = useState<Set<number>>(
    new Set(savedCheckpoint?.answeredSteps ?? []),
  );
  const [firstTrySteps, setFirstTrySteps] = useState<Set<number>>(
    new Set(savedCheckpoint?.firstTrySteps ?? []),
  );
  const [finished, setFinished] = useState(false);
  const stepRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  if (!lesson) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-ink-secondary">Lekce nenalezena</p>
      </div>
    );
  }

  const steps = lesson.content.steps;
  const t = (cs: string, en: string) => (language === 'en' ? en : cs);
  const loc = <T extends string | undefined>(cs: T, en: T | undefined): T =>
    (language === 'en' && en ? en : cs) as T;

  const isLastStep = currentStep === steps.length - 1;
  const isInteractive = (s: LessonStep) =>
    s.type === 'quiz' || s.type === 'scenario' || s.type === 'engagement';

  // Scoring
  const quizIndices = steps.map((s, i) => (s.type === 'quiz' ? i : -1)).filter((i) => i !== -1);
  const hasNoQuiz = quizIndices.length === 0;
  const scoredIndices = hasNoQuiz
    ? steps.map((s, i) => (s.type === 'scenario' ? i : -1)).filter((i) => i !== -1)
    : quizIndices;
  const quizFirstTry = scoredIndices.filter((i) => firstTrySteps.has(i)).length;
  const totalScored = scoredIndices.length;
  const scorePct = totalScored > 0 ? Math.round((quizFirstTry / totalScored) * 100) : 100;
  const allFirstTry = totalScored > 0 ? quizFirstTry === totalScored : true;

  const xpResult = calculateLessonXp({
    baseXp: lesson.xp_reward,
    firstTryCorrect: allFirstTry,
    streakDays,
  });

  // Save checkpoint to store (persisted to localStorage)
  const persistCheckpoint = (step: number, answered: Set<number>, firstTry: Set<number>) => {
    saveCheckpoint(lessonId, {
      currentStep: step,
      answeredSteps: [...answered],
      firstTrySteps: [...firstTry],
    });
  };

  const handleAnswer = (stepIndex: number, correct: boolean, firstTry: boolean) => {
    if (correct) {
      const newAnswered = new Set(answeredSteps).add(stepIndex);
      const newFirstTry = firstTry ? new Set(firstTrySteps).add(stepIndex) : firstTrySteps;
      setAnsweredSteps(newAnswered);
      if (firstTry) setFirstTrySteps(newFirstTry);
      persistCheckpoint(currentStep, newAnswered, newFirstTry);
      // Auto-advance on intermediate steps; on last step let user click "Dokončit"
      if (stepIndex < steps.length - 1) {
        setTimeout(() => advance(), 800);
      }
    }
  };

  const advance = async () => {
    if (isLastStep) {
      completeLesson(lessonId, lesson.model_id, scorePct);
      addXp(xpResult.total);
      updateStreak();
      // Push to server BEFORE showing finish screen — so dashboard pull gets fresh data
      const uid = useWebUserStore.getState().userId;
      if (uid) {
        const freshStats = useWebUserStore.getState().stats;
        await pushToServer(uid, freshStats);
      }
      setFinished(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const next = currentStep + 1;
    setCurrentStep(next);
    persistCheckpoint(next, answeredSteps, firstTrySteps);
    // Scroll to new step after render
    setTimeout(() => {
      stepRefs.current.get(next)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const modelName = model ? (language === 'en' ? model.name : model.name_cz) : '';
  const goBack = () => router.push('/dashboard');

  // Next/prev lesson
  const modelLessons = model ? getLessonsForModel(model.id) : [];
  const curIdx = modelLessons.findIndex((l) => l.id === lessonId);
  const nextLesson = curIdx < modelLessons.length - 1 ? modelLessons[curIdx + 1] : null;

  /* ── Finish ── */
  if (finished) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-lg text-center">
        <Sparkles className="h-14 w-14 text-xp" />
        <h2 className="mt-lg text-2xl font-extrabold text-ink-primary">
          {t('Lekce dokončena!', 'Lesson complete!')}
        </h2>
        <div className="mt-lg w-full max-w-[360px] space-y-sm rounded-2xl border-2 border-[#E5E7EB] bg-white p-lg shadow-[2px_4px_0_0_#D1D5DB]">
          <p className="text-3xl font-extrabold text-xp">+{xpResult.total} XP</p>
          <div className="space-y-xs text-sm">
            <XpRow icon={<Target className="h-4 w-4" />} c="text-ink-secondary">
              {t('Základ', 'Base')}: {xpResult.breakdown.base} XP
            </XpRow>
            {xpResult.breakdown.bonus > 0 && (
              <XpRow icon={<Zap className="h-4 w-4" />} c="text-primary">
                +{xpResult.breakdown.bonus} XP {t('bonus', 'bonus')}
              </XpRow>
            )}
            {xpResult.breakdown.streak > 0 && (
              <XpRow icon={<Flame className="h-4 w-4" />} c="text-streak">
                +{xpResult.breakdown.streak} XP {t('série', 'streak')}
              </XpRow>
            )}
          </div>
        </div>
        <div className="mt-lg flex w-full max-w-[360px] flex-col gap-sm">
          {nextLesson && (
            <button onClick={() => router.push(`/lesson/${nextLesson.id}`)}
              className="w-full rounded-full bg-primary py-md text-md font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark">
              {t('Další lekce', 'Next lesson')}
            </button>
          )}
          <button onClick={goBack}
            className="w-full rounded-full border-2 border-[#E5E7EB] bg-white py-md text-md font-bold text-ink-primary transition-colors hover:bg-surface">
            {t('Zpět na dashboard', 'Back to dashboard')}
          </button>
        </div>
      </div>
    );
  }

  /* ── Main layout ── */
  return (
    <div className="flex min-h-dvh bg-background">
      {/* ── Sidebar ── */}
      <aside className="hidden w-[240px] flex-shrink-0 lg:block">
        <div className="sticky top-0 flex h-dvh flex-col border-r border-[#E5E7EB] bg-white">
          <div className="flex items-center gap-sm border-b border-[#E5E7EB] px-md py-md">
            <button onClick={goBack}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-ink-primary">
              <X className="h-4 w-4" />
            </button>
            <span className="truncate text-sm font-bold text-ink-primary">{modelName}</span>
          </div>

          <nav className="flex-1 overflow-y-auto p-md">
            <p className="mb-sm text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              {t('Obsah lekce', 'Lesson outline')}
            </p>
            <div className="space-y-[2px]">
              {steps.map((s, i) => {
                const meta = STEP_META[s.type] ?? { label: s.type, icon: Circle };
                const Icon = meta.icon;
                const isCurrent = i === currentStep;
                const isPast = i < currentStep;
                const isFuture = i > currentStep;
                const isQuizDone = isInteractive(s) && answeredSteps.has(i);

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (!isFuture) {
                        stepRefs.current.get(i)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    disabled={isFuture}
                    className={`flex w-full items-center gap-sm rounded-lg px-sm py-[6px] text-left text-[13px] transition-colors ${
                      isCurrent
                        ? 'bg-primary/10 font-bold text-primary'
                        : isPast
                          ? 'font-medium text-ink-secondary hover:bg-surface'
                          : 'font-medium text-ink-muted/40'
                    }`}
                  >
                    <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                      isPast || isQuizDone ? 'bg-success text-white'
                      : isCurrent ? 'bg-primary text-white'
                      : 'bg-surface text-ink-muted/40'
                    }`}>
                      {isPast || isQuizDone ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                    </div>
                    <span className="truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Progress */}
            <div className="mt-lg">
              <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
              </div>
              <p className="mt-xs text-[11px] font-bold text-ink-muted">
                {currentStep + 1} / {steps.length}
              </p>
            </div>
          </nav>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-10 border-b border-[#E5E7EB] bg-white/90 backdrop-blur-sm lg:hidden">
          <div className="flex items-center gap-sm px-md py-xs">
            <button onClick={goBack}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted">
              <X className="h-4 w-4" />
            </button>
            <span className="flex-1 truncate text-sm font-bold text-ink-primary">{modelName}</span>
            <span className="text-xs font-bold text-ink-muted">{currentStep + 1}/{steps.length}</span>
          </div>
          <div className="h-[3px] bg-surface">
            <div className="h-full bg-primary transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        <div className="mx-auto max-w-[680px] px-md py-lg lg:px-lg lg:py-xl">
          {/* Render steps 0..currentStep */}
          {steps.slice(0, currentStep + 1).map((s, i) => {
            const isPast = i < currentStep;
            const isCurrent = i === currentStep;

            return (
              <div
                key={i}
                ref={(el) => { if (el) stepRefs.current.set(i, el); }}
                className="scroll-mt-[60px]"
              >
                {/* Past steps are slightly faded */}
                <div className={isPast ? 'opacity-60' : ''}>
                  {isInteractive(s) ? (
                    <QuizBlock
                      key={i}
                      step={s}
                      language={language}
                      loc={loc}
                      t={t}
                      showOptions={isCurrent && !answeredSteps.has(i)}
                      answered={answeredSteps.has(i)}
                      onAnswer={(correct, firstTry) => handleAnswer(i, correct, firstTry)}
                    />
                  ) : (
                    <StepBlock step={s} language={language} loc={loc} t={t} />
                  )}
                </div>

                {/* "Continue" button for current step */}
                {isCurrent && !isLastStep && (
                  (!isInteractive(s) || answeredSteps.has(i)) && (
                    <div className="mb-xl flex justify-center">
                      <button onClick={advance}
                        className="group flex items-center gap-sm rounded-full bg-primary px-xl py-sm text-md font-bold text-white shadow-[2px_3px_0_0_#D1D5DB] transition-all hover:-translate-y-0.5 hover:bg-primary-dark">
                        {t('Pokračovat', 'Continue')}
                        <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                      </button>
                    </div>
                  )
                )}

                {/* Last step: finish button */}
                {isCurrent && isLastStep && (!isInteractive(s) || answeredSteps.has(i)) && (
                  <div className="mb-xl mt-lg border-t border-[#E5E7EB] pt-lg text-center">
                    <button onClick={advance}
                      className="rounded-full bg-primary px-xl py-md text-md font-bold text-white shadow-[2px_4px_0_0_#D1D5DB] transition-all hover:-translate-y-0.5 hover:bg-primary-dark">
                      {t('Dokončit lekci', 'Complete lesson')}
                    </button>
                    <p className="mt-sm text-xs text-ink-muted">+{xpResult.total} XP</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

/* ── Visual step block (no interaction logic, just content) ── */
function StepBlock({
  step,
  language,
  loc,
  t,
}: {
  step: LessonStep;
  language: 'cs' | 'en';
  loc: <T extends string | undefined>(cs: T, en: T | undefined) => T;
  t: (cs: string, en: string) => string;
}) {
  if (step.type === 'lesson_intro') {
    return (
      <div className="mb-xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-light">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <h1 className="mt-md text-3xl font-extrabold tracking-tight text-ink-primary lg:text-[36px]">
          <Md text={loc(step.title, step.title_en) ?? ''} />
        </h1>
        <p className="mx-auto mt-md max-w-[520px] text-md leading-relaxed text-ink-secondary">
          <Md text={loc(step.description, step.description_en) ?? ''} />
        </p>
      </div>
    );
  }

  if (step.type === 'text') {
    return (
      <div className="mb-lg">
        <MdBlock text={loc(step.content, step.content_en) ?? ''} />
      </div>
    );
  }

  if (step.type === 'key_insight') {
    return (
      <div className="my-lg rounded-2xl border-l-4 border-xp bg-xp-light/40 px-lg py-lg">
        <div className="flex items-center gap-sm text-xs font-bold uppercase tracking-wider text-xp">
          <Lightbulb className="h-4 w-4" />
          {t('Klíčový poznatek', 'Key insight')}
        </div>
        <p className="mt-sm text-lg font-bold leading-snug text-ink-primary">
          <Md text={loc(step.content, step.content_en) ?? ''} />
        </p>
      </div>
    );
  }

  // Quiz/scenario/engagement — rendered as part of QuizBlock, skip here
  if (step.type === 'scenario' || step.type === 'quiz' || step.type === 'engagement') {
    return null;
  }

  return null;
}

/* ── Quiz block: question + answers in one unified dark card ── */
function QuizBlock({
  step,
  language,
  loc,
  t,
  showOptions,
  answered,
  onAnswer,
}: {
  step: LessonStep;
  language: 'cs' | 'en';
  loc: <T extends string | undefined>(cs: T, en: T | undefined) => T;
  t: (cs: string, en: string) => string;
  showOptions: boolean;
  answered: boolean;
  onAnswer: (correct: boolean, firstTry: boolean) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [attempts, setAttempts] = useState(0);

  if (step.type !== 'quiz' && step.type !== 'scenario' && step.type !== 'engagement') return null;

  const situation = step.type === 'scenario'
    ? loc((step as any).situation, (step as any).situation_en) ?? ''
    : '';
  const question = loc(step.question, step.question_en) ?? '';
  const label = step.type === 'engagement'
    ? t('Zamysli se', 'Think about it')
    : step.type === 'quiz'
      ? t('Kvíz', 'Quiz')
      : t('Scénář', 'Scenario');

  const options = localizeOptions(step.options, language);
  const optionsKey = options.map((o) => o.text).join('|');
  const shuffled = useMemo(() => {
    const arr = [...options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey]);

  const handleSelect = (index: number) => {
    if (hasAnswered) return;
    setSelectedIndex(index);
    setAttempts((a) => a + 1);
    const option = shuffled[index];
    if (option.correct) {
      setHasAnswered(true);
      onAnswer(true, attempts === 0);
    } else {
      setTimeout(() => setSelectedIndex(null), 1200);
    }
  };

  return (
    <div className="my-lg overflow-hidden rounded-2xl bg-[#1C1917] text-white">
      {/* Question */}
      <div className="p-lg lg:p-xl">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">{label}</p>
        {situation && (
          <p className="mt-md text-[15px] leading-relaxed text-white/70"><Md text={situation} /></p>
        )}
        <h3 className="mt-sm text-xl font-extrabold leading-snug"><Md text={question} /></h3>
      </div>

      {/* Answers */}
      {(showOptions || answered) && (
        <div className="space-y-sm px-lg pb-lg lg:px-xl lg:pb-xl">
          {shuffled.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrect = option.correct;
            const showResult = isSelected;
            // After answered, highlight the correct one
            const showCorrect = answered && isCorrect;

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(index)}
                disabled={hasAnswered || answered}
                className={`w-full rounded-xl border-2 px-md py-sm text-left transition-all ${
                  showResult && isCorrect
                    ? 'border-success bg-success/20'
                    : showResult && !isCorrect
                      ? 'border-error bg-error/20'
                      : showCorrect
                        ? 'border-success/40 bg-success/10'
                        : 'border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08] disabled:hover:border-white/10 disabled:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-md">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    showResult && isCorrect ? 'bg-success text-white'
                    : showResult && !isCorrect ? 'bg-error text-white'
                    : showCorrect ? 'bg-success/30 text-success'
                    : 'bg-white/10 text-white/50'
                  }`}>
                    {showResult && isCorrect ? <CheckCircle2 className="h-[18px] w-[18px]" />
                      : showResult && !isCorrect ? <XCircle className="h-[18px] w-[18px]" />
                      : showCorrect ? <CheckCircle2 className="h-[18px] w-[18px]" />
                      : String.fromCharCode(65 + index)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`text-[15px] font-semibold leading-snug ${
                      showResult && isCorrect ? 'text-green-300'
                      : showResult && !isCorrect ? 'text-red-300'
                      : showCorrect ? 'text-green-300/80'
                      : 'text-white/85'
                    }`}>
                      <Md text={option.text} />
                    </span>
                  </div>
                </div>
                {showResult && (
                  <p className={`mt-sm pl-[44px] text-sm leading-relaxed ${isCorrect ? 'text-green-400/70' : 'text-red-400/70'}`}>
                    <Md text={option.explanation} />
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function XpRow({ icon, c, children }: { icon: React.ReactNode; c: string; children: React.ReactNode }) {
  return <div className={`flex items-center justify-center gap-sm ${c}`}>{icon}<span>{children}</span></div>;
}
