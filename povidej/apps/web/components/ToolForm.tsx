"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Tool, ToolId, DecisionToolData, CreativeToolData, MotivationToolData } from "@repo/types";
import { TOOL_KEYS } from "@repo/types";
import styles from "./ToolForm.module.css";

interface Props {
  tool: Tool;
}

export function ToolForm({ tool }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  // Decision fields
  const [decision, setDecision] = useState("");
  const [options, setOptions] = useState("");
  const [blockers, setBlockers] = useState("");
  const [deadline, setDeadline] = useState("");

  // Creative fields
  const [project, setProject] = useState("");
  const [blockDuration, setBlockDuration] = useState("");
  const [blockDescription, setBlockDescription] = useState("");
  const [whatHelped, setWhatHelped] = useState("");

  // Motivation fields
  const [area, setArea] = useState("");
  const [since, setSince] = useState("");
  const [previousMotivation, setPreviousMotivation] = useState("");
  const [currentFeeling, setCurrentFeeling] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(TOOL_KEYS[tool.id as ToolId]);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (tool.id === "decision-paralysis") {
        setDecision(data.decision ?? "");
        setOptions(data.options ?? "");
        setBlockers(data.blockers ?? "");
        setDeadline(data.deadline ?? "");
      } else if (tool.id === "creative-block") {
        setProject(data.project ?? "");
        setBlockDuration(data.blockDuration ?? "");
        setBlockDescription(data.blockDescription ?? "");
        setWhatHelped(data.whatHelped ?? "");
      } else if (tool.id === "motivation") {
        setArea(data.area ?? "");
        setSince(data.since ?? "");
        setPreviousMotivation(data.previousMotivation ?? "");
        setCurrentFeeling(data.currentFeeling ?? "");
      }
    } catch {}
  }, [tool.id]);

  function handleSave() {
    const key = TOOL_KEYS[tool.id as ToolId];
    let data: DecisionToolData | CreativeToolData | MotivationToolData;

    if (tool.id === "decision-paralysis") {
      data = { decision, options, blockers, deadline, savedAt: Date.now() } as DecisionToolData;
    } else if (tool.id === "creative-block") {
      data = { project, blockDuration, blockDescription, whatHelped, savedAt: Date.now() } as CreativeToolData;
    } else {
      data = { area, since, previousMotivation, currentFeeling, savedAt: Date.now() } as MotivationToolData;
    }

    localStorage.setItem(key, JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleOpenChat() {
    handleSave();
    router.push("/");
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>{tool.icon}</span>
        <div>
          <h1 className={styles.title}>{tool.title}</h1>
          <p className={styles.subtitle}>{tool.description}</p>
        </div>
      </div>

      <div className={styles.form}>
        {tool.id === "decision-paralysis" && (
          <>
            <Field label="Před jakým rozhodnutím stojíš?" value={decision} onChange={setDecision} placeholder="Popište situaci..." multiline />
            <Field label="Jaké jsou možnosti?" value={options} onChange={setOptions} placeholder="Možnost A, možnost B..." multiline />
            <Field label="Co ti brání se rozhodnout?" value={blockers} onChange={setBlockers} placeholder="Strach, nejistota, konflikt hodnot..." multiline />
            <Field label="Do kdy se musíš rozhodnout?" value={deadline} onChange={setDeadline} placeholder="Za týden, do konce měsíce... (volitelné)" />
          </>
        )}

        {tool.id === "creative-block" && (
          <>
            <Field label="Na čem pracuješ?" value={project} onChange={setProject} placeholder="Projekt, dílo, úkol..." />
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Jak dlouho trvá blok?</label>
              <div className={styles.chips}>
                {["Den", "Týden", "Měsíc", "Déle"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`${styles.chip} ${blockDuration === d ? styles.chipActive : ""}`}
                    onClick={() => setBlockDuration(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Jak bys popsal/a blok?" value={blockDescription} onChange={setBlockDescription} placeholder="Prázdnota, přehlcení, strach z hodnocení..." multiline />
            <Field label="Co ti dřív pomáhalo s tvořením?" value={whatHelped} onChange={setWhatHelped} placeholder="Procházka, hudba, jiné prostředí..." multiline />
          </>
        )}

        {tool.id === "motivation" && (
          <>
            <Field label="V čem cítíš ztrátu motivace?" value={area} onChange={setArea} placeholder="Práce, vztahy, osobní rozvoj..." multiline />
            <Field label="Kdy to přibližně začalo?" value={since} onChange={setSince} placeholder="Před měsícem, po určité události..." />
            <Field label="Co tě dřív v této oblasti motivovalo?" value={previousMotivation} onChange={setPreviousMotivation} placeholder="Cíle, lidé, pocit smyslu..." multiline />
            <Field label="Jak se teď cítíš?" value={currentFeeling} onChange={setCurrentFeeling} placeholder="Vyčerpaný/á, ztracený/á, apatický/á..." multiline />
          </>
        )}

        <div className={styles.actions}>
          <button className={styles.saveBtn} onClick={handleSave} type="button">
            {saved ? "✓ Uloženo" : "Uložit"}
          </button>
          <button className={styles.chatBtn} onClick={handleOpenChat} type="button">
            Prodiskutovat v chatu →
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>{label}</label>
      {multiline ? (
        <textarea
          className={styles.textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <input
          className={styles.input}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
