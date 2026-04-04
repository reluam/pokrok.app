"use client";

import { useState } from "react";
import { DashboardCard, useDashboardDone } from "./DashboardCard";
import { useAutoSave } from "./useAutoSave";
import { SaveIndicator } from "./SaveIndicator";
import { printExercise } from "@/lib/print-exercise";
import type { VisionData, IdealDayData } from "@/lib/exercise-registry";

export function DenZa5LetCard({
  data,
  saveContext,
}: {
  data: VisionData | IdealDayData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const idealDay = data?.idealDay ?? "";
  const isEmpty = !idealDay;

  const handlePrint = () => {
    printExercise({
      title: "Den za 5 let",
      emoji: "🔭",
      sections: [{ text: idealDay }],
    });
  };

  return (
    <DashboardCard
      emoji="🔭"
      title="Den za 5 let"
      isEmpty={isEmpty}
      emptyDescription="Představ si svůj ideální den za 5 let. Tenhle obraz ti pomůže pochopit, kam vlastně chceš směřovat."
      editContent={<EditMode data={data} saveContext={saveContext} />}
      onPrint={isEmpty ? undefined : handlePrint}
    >
      <ViewMode text={idealDay} />
    </DashboardCard>
  );
}

function ViewMode({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      <p className="text-base text-foreground/60 leading-relaxed whitespace-pre-wrap">{text}</p>
      <p className="text-base text-foreground/25">
        {text.split(/\s+/).filter(Boolean).length} slov
      </p>
    </div>
  );
}

function EditMode({
  data,
  saveContext,
}: {
  data: VisionData | IdealDayData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const done = useDashboardDone();
  const [text, setText] = useState(data?.idealDay ?? "");

  const { saving, saved, flush } = useAutoSave(
    async () => {
      if (!text.trim()) return;
      await saveContext("vision", { idealDay: text, savedAt: new Date().toISOString() } as IdealDayData);
    },
    [text],
  );

  const handleDone = async () => { await flush(); done?.(); };
  const words = text.split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-lg font-bold text-foreground/70">Popiš svůj ideální den za 5 let</p>
        <p className="text-lg text-foreground/40 mt-0.5 leading-relaxed">
          Zavři oči a představ si běžný den za 5 let. Kde se probouzíš? S kým? Co děláš ráno, přes den, večer? Čím víc detailů, tím lépe — mozek nerozlišuje živou představu od plánu.
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Je rok 2031. Probouzím se..."
        rows={8}
        className="w-full text-base rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 resize-y focus:outline-none focus:border-black/20 transition-all"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-lg ${words >= 300 ? "text-green-600" : "text-foreground/30"}`}>
            {words} slov {words < 300 && "(doporučeno 300+)"}
          </span>
          <SaveIndicator saving={saving} saved={saved} />
        </div>
        <button
          onClick={handleDone}
          disabled={!text.trim()}
          className="px-4 py-2 bg-accent text-white rounded-full text-base font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          Hotovo ✓
        </button>
      </div>
    </div>
  );
}
