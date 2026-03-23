"use client";

import { useState } from "react";
import { generateHtml, type JourneyState } from "@/components/JourneyFlow";

export default function AuditPurchaseActions({
  purchaseId,
  isCompleted,
}: {
  purchaseId: string;
  isCompleted: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const openDocument = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/journey-data?purchaseId=${purchaseId}`);
      const { data } = await res.json();
      if (!data) {
        alert("Data dokumentu nebyla nalezena.");
        return;
      }
      const state = data as JourneyState;
      const html = generateHtml(
        state.wheelVals ?? {},
        state.wheelAnswers ?? {},
        state.finalValues ?? [],
        state.visionData ?? { q1: "", q2: "", q3: "", annotations: [] },
        state.oblastiData ?? { idealVals: {}, answers: {} },
        state.actionData ?? { week: [], month: [], year: [] }
      );
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
        win.onload = () => win.print();
      }
    } finally {
      setLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <button
        onClick={openDocument}
        disabled={loading}
        className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 border border-accent text-accent text-sm font-semibold rounded-full hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
      >
        {loading ? "Načítám…" : "↓ Stáhnout dokument"}
      </button>
    );
  }

  return (
    <a
      href="/laborator/tvuj-kompas"
      className="inline-block mt-3 px-4 py-1.5 bg-accent text-white text-sm font-semibold rounded-full hover:bg-accent-hover transition-colors"
    >
      Pokračovat →
    </a>
  );
}
