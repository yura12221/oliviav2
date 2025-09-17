"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const PawMark = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" className="paw-top" aria-hidden="true">
    <defs>
      <linearGradient id="pawTopGrad" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="#60a5fa" />
        <stop offset="1" stopColor="#22d3ee" />
      </linearGradient>
    </defs>
    <path
      fill="url(#pawTopGrad)"
      d="M7.5 5.5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2Zm9 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2ZM4.5 11c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2Zm15 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2ZM12 11c-2.8 0-5 1.9-5 4.2 0 1.4.9 2.5 2.7 3.1 1 .3 1.9.6 2.3 1 .4-.4 1.3-.7 2.3-1 1.8-.6 2.7-1.7 2.7-3.1 0-2.3-2.2-4.2-5-4.2Z"
    />
  </svg>
);

export default function AuthPanel() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password: pass });
        if (error) throw error;
      }
    } catch (e: any) {
      setErr(e.message ?? "Hiba történt.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-brand">
        <PawMark />
        <span>Olívia Dog Center</span>
      </div>

      <form className="auth-card" onSubmit={submit}>
        <h1 className="auth-title">{mode === "login" ? "Bejelentkezés" : "Regisztráció"}</h1>

        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pelda@domain.hu"
            required
          />
        </label>

        <label className="field">
          <span>Jelszó</span>
          <input
            type="password"
            className="input"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        {err && <div className="auth-error">{err}</div>}

        <div className="auth-actions">
          <button className="btn primary w100" disabled={busy}>
            {busy ? "Folyamatban…" : mode === "login" ? "Belépés" : "Regisztráció"}
          </button>
          <button
            type="button"
            className="btn link"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Nincs fiókod? Regisztrálj!" : "Van fiókod? Jelentkezz be!"}
          </button>
        </div>
      </form>
    </div>
  );
}
