"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AGE_GROUPS,
  LIFE_AREAS,
  USER_PROFILE_KEY,
  type AgeGroup,
  type Gender,
  type UserProfile,
} from "@repo/types";
import { createClient } from "../lib/supabase/client";
import styles from "./Onboarding.module.css";

// Celkový počet kroků
const TOTAL_STEPS = 3 + LIFE_AREAS.length + 3; // jméno + věk/pohlaví + oblasti + moment + známí + rodiče

type Step =
  | { type: "name" }
  | { type: "age-gender" }
  | { type: "life-area"; index: number }
  | { type: "happiest-moment" }
  | { type: "friends-say" }
  | { type: "parents-say" };

function getStep(stepIndex: number): Step {
  if (stepIndex === 0) return { type: "name" };
  if (stepIndex === 1) return { type: "age-gender" };
  if (stepIndex >= 2 && stepIndex < 2 + LIFE_AREAS.length) {
    return { type: "life-area", index: stepIndex - 2 };
  }
  if (stepIndex === 2 + LIFE_AREAS.length) return { type: "happiest-moment" };
  if (stepIndex === 3 + LIFE_AREAS.length) return { type: "friends-say" };
  return { type: "parents-say" };
}

export function Onboarding() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function guardCheck() {
      // Rychlá cesta: localStorage
      if (localStorage.getItem(USER_PROFILE_KEY)) {
        router.replace("/");
        return;
      }
      // Pomalá cesta: Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setChecking(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.replace("/");
        return;
      }
      setChecking(false);
    }
    guardCheck();
  }, [router]);

  if (checking) return null;

  // Formulářová data
  const [name, setName] = useState("");
  const [age, setAge] = useState<AgeGroup | "">("");
  const [gender, setGender] = useState<Gender | "">("");
  const [lifeScores, setLifeScores] = useState<number[]>(
    LIFE_AREAS.map(() => 5)
  );
  const [scorePop, setScorePop] = useState(false);
  const [happiestMoment, setHappiestMoment] = useState("");
  const [friendsSay, setFriendsSay] = useState("");
  const [parentsSay, setParentsSay] = useState("");

  const step = getStep(stepIndex);
  const progress = ((stepIndex + 1) / TOTAL_STEPS) * 100;

  function canAdvance(): boolean {
    if (step.type === "name") return name.trim().length > 0;
    if (step.type === "age-gender")
      return age.trim().length > 0 && gender !== "";
    if (step.type === "life-area") return true;
    if (step.type === "happiest-moment") return happiestMoment.trim().length > 0;
    if (step.type === "friends-say") return friendsSay.trim().length > 0;
    if (step.type === "parents-say") return parentsSay.trim().length > 0;
    return false;
  }

  function advance() {
    if (!canAdvance()) return;
    if (stepIndex < TOTAL_STEPS - 1) {
      setStepIndex((s) => s + 1);
    } else {
      saveAndFinish();
    }
  }

  async function saveAndFinish() {
    const profile: UserProfile = {
      name: name.trim(),
      age: age as AgeGroup,
      gender: gender as Gender,
      lifeAreas: LIFE_AREAS.map((area, i) => ({
        ...area,
        score: lifeScores[i] ?? 0,
      })),
      happiestMoment: happiestMoment.trim(),
      whatFriendsSay: friendsSay.trim(),
      whatParentsSay: parentsSay.trim(),
      completedAt: Date.now(),
    };

    // Ulož lokálně pro okamžité použití v chatu
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));

    // Ulož do Supabase
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").upsert({
        id: user.id,
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        life_areas: profile.lifeAreas as unknown as import("../lib/supabase/database.types").Json,
        happiest_moment: profile.happiestMoment,
        what_friends_say: profile.whatFriendsSay,
        what_parents_say: profile.whatParentsSay,
        onboarding_completed: true,
      });
    }

    router.push("/");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      advance();
    }
  }

  const firstName = name.split(" ")[0];

  function handleSliderChange(index: number, value: number) {
    const next = [...lifeScores];
    next[index] = value;
    setLifeScores(next);
    setScorePop(true);
    setTimeout(() => setScorePop(false), 150);
  }

  return (
    <div className={styles.container}>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.logo}>
        <Image src="/pokrok-logo.png" alt="Pokrok" width={100} height={22} />
      </div>

      <div className={styles.content}>
        {/* Krok: Jméno */}
        {step.type === "name" && (
          <div className={styles.step}>
            <p className={styles.label}>Vítej! Jak se jmenuješ?</p>
            <input
              autoFocus
              className={styles.input}
              type="text"
              placeholder="Tvoje jméno"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        )}

        {/* Krok: Věk + pohlaví */}
        {step.type === "age-gender" && (
          <div className={styles.step}>
            <p className={styles.label}>
              Příjemné setkání, {firstName}! Do které věkové skupiny patříš a jaké je tvoje pohlaví?
            </p>
            <div className={styles.genderGroup}>
              {AGE_GROUPS.map((group) => (
                <button
                  key={group}
                  className={`${styles.genderBtn} ${age === group ? styles.genderBtnActive : ""}`}
                  onClick={() => setAge(group)}
                  type="button"
                >
                  {group}
                </button>
              ))}
            </div>
            <div className={styles.genderGroup} style={{ marginTop: "1rem" }}>
              {(
                [
                  { value: "male", label: "Muž" },
                  { value: "female", label: "Žena" },
                  { value: "other", label: "Jiné" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  className={`${styles.genderBtn} ${gender === opt.value ? styles.genderBtnActive : ""}`}
                  onClick={() => setGender(opt.value)}
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Krok: Životní oblasti */}
        {step.type === "life-area" && (
          <div className={styles.step}>
            <p className={styles.sublabel}>Spokojenost v životních oblastech</p>
            <p className={styles.label}>
              {LIFE_AREAS[step.index]?.label}
            </p>
            <div className={styles.sliderWrapper}>
              <div className={styles.sliderTop}>
                <p className={styles.hint}>1 = vůbec ne &nbsp;·&nbsp; 10 = skvěle</p>
                <span className={`${styles.sliderScore} ${scorePop ? styles.sliderScorePop : ""}`}>
                  {lifeScores[step.index]}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={lifeScores[step.index] ?? 5}
                onChange={(e) => handleSliderChange(step.index, Number(e.target.value))}
                className={styles.slider}
                style={{
                  background: `linear-gradient(to right, var(--primary) ${((( lifeScores[step.index] ?? 5) - 1) / 9) * 100}%, var(--border) ${(((lifeScores[step.index] ?? 5) - 1) / 9) * 100}%)`,
                }}
              />
              <div className={styles.sliderLabels}>
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          </div>
        )}

        {/* Krok: Šťastný moment */}
        {step.type === "happiest-moment" && (
          <div className={styles.step}>
            <p className={styles.label}>
              Jaký byl tvůj nejšťastnější moment v poslední době?
            </p>
            <textarea
              autoFocus
              className={styles.textarea}
              placeholder="Popiš ho..."
              value={happiestMoment}
              onChange={(e) => setHappiestMoment(e.target.value)}
              rows={4}
            />
          </div>
        )}

        {/* Krok: Co říkají známí */}
        {step.type === "friends-say" && (
          <div className={styles.step}>
            <p className={styles.label}>
              Co by o tobě řekli tvoji přátelé a známí?
            </p>
            <textarea
              autoFocus
              className={styles.textarea}
              placeholder="Jak tě vidí ostatní..."
              value={friendsSay}
              onChange={(e) => setFriendsSay(e.target.value)}
              rows={4}
            />
          </div>
        )}

        {/* Krok: Co říkají rodiče */}
        {step.type === "parents-say" && (
          <div className={styles.step}>
            <p className={styles.label}>
              A co by o tobě řekli tvoji rodiče?
            </p>
            <textarea
              autoFocus
              className={styles.textarea}
              placeholder="Jak tě vidí rodiče..."
              value={parentsSay}
              onChange={(e) => setParentsSay(e.target.value)}
              rows={4}
            />
          </div>
        )}

        {/* Tlačítka */}
        <div className={styles.actions}>
          {stepIndex > 0 && (
            <button
              className={styles.backBtn}
              onClick={() => setStepIndex((s) => s - 1)}
              type="button"
            >
              ← Zpět
            </button>
          )}
          <button
            className={styles.nextBtn}
            onClick={advance}
            disabled={!canAdvance()}
            type="button"
          >
            {stepIndex === TOTAL_STEPS - 1 ? "Hotovo →" : "Pokračovat →"}
          </button>
        </div>
      </div>
    </div>
  );
}
