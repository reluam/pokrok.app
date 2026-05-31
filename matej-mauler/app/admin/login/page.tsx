"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const display: React.CSSProperties = { fontFamily: "var(--font-display)" };

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Špatné heslo. Zkus znovu.");
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100dvh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        background: "#fff", border: "2.5px solid var(--border)",
        borderRadius: "20px", boxShadow: "6px 6px 0 var(--border)",
        padding: "40px 36px", maxWidth: "360px", width: "100%",
        textAlign: "center",
      }}>
        <span style={{ fontSize: "36px", display: "block", marginBottom: "16px" }}>🔐</span>
        <h1 style={{ ...display, fontSize: "26px", fontWeight: 900, marginBottom: "6px" }}>
          Spaghetti HQ
        </h1>
        <p style={{
          fontFamily: "var(--font-sans)", fontSize: "13px",
          color: "var(--text-muted)", marginBottom: "28px",
        }}>
          Admin rozhraní. Pouze pro zasvěcené.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Heslo"
            autoFocus
            style={{
              width: "100%", background: "var(--bg)",
              border: "2px solid var(--border)", borderRadius: "10px",
              padding: "12px 16px", fontFamily: "var(--font-sans)",
              fontSize: "15px", color: "var(--text-primary)",
              outline: "none", marginBottom: "12px", display: "block",
              textAlign: "center", letterSpacing: "0.1em",
            }}
          />
          {error && (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "#b91c1c", marginBottom: "12px" }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={loading || !password}
            style={{
              width: "100%", background: "var(--text-primary)", color: "var(--bg)",
              border: "2.5px solid var(--text-primary)", borderRadius: "12px",
              boxShadow: "4px 4px 0 var(--text-primary)",
              padding: "12px", fontFamily: "var(--font-sans)",
              fontSize: "14px", fontWeight: 700, cursor: "pointer",
              opacity: (loading || !password) ? 0.4 : 1,
            }}>
            {loading ? "..." : "Vstoupit →"}
          </button>
        </form>
      </div>
    </div>
  );
}
