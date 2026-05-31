"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
  onChange: (params: { a: number; b: number; answer: string }) => void;
};

export function MathCaptcha({ onChange }: Props) {
  const nums = useRef({ a: Math.floor(Math.random() * 9) + 1, b: Math.floor(Math.random() * 9) + 1 });
  const { a, b } = nums.current;
  const [val, setVal] = useState("");

  useEffect(() => {
    onChange({ a, b, answer: val });
  }, [val, a, b, onChange]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
      <label style={{
        fontFamily: "var(--font-sans)", fontSize: "13px",
        color: "var(--text-secondary)", whiteSpace: "nowrap",
      }}>
        Ověření: kolik je {a} + {b}?
      </label>
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="?"
        style={{
          width: "64px",
          background: "#fff",
          border: "2px solid var(--border)",
          borderRadius: "8px",
          padding: "8px 10px",
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--text-primary)",
          outline: "none",
          textAlign: "center",
          appearance: "textfield",
        }}
      />
      {val && (
        <span style={{ fontSize: "16px" }}>
          {Number(val) === a + b ? "✓" : "✗"}
        </span>
      )}
    </div>
  );
}
