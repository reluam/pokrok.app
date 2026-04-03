"use client";

import { useState } from "react";

export function ToolTopBar({ onReset, printNode }: {
  onReset: () => void;
  printNode?: React.ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);

  const btnBase = "inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-base font-semibold transition-colors bg-white/70";

  return (
    <div className="flex items-center justify-end gap-2 mb-5">
      {printNode}
      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground/50">Opravdu smazat vše?</span>
          <button
            onClick={() => { setConfirming(false); onReset(); }}
            className="px-3 py-1.5 rounded-full bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
          >
            Ano, smazat
          </button>
          <button
            onClick={() => setConfirming(false)}
            className={`${btnBase} border-foreground/15 text-foreground/50 hover:border-foreground/25`}
          >
            Zrušit
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className={`${btnBase} border-foreground/15 text-foreground/50 hover:border-red-200 hover:text-red-500`}
        >
          Resetovat a začít znovu
        </button>
      )}
    </div>
  );
}
