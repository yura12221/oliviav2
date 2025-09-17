"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();            // <-- критично: блокуємо дефолтний сабміт
    setErr(null);
    setBusy(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setBusy(false);

    if (error) {
      setErr(error.message || "Sikertelen bejelentkezés.");
      return;
    }

    // Оновити дані та перейти на головну (або куди потрібно)
    router.refresh();
    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-md">
      <label className="flex flex-col gap-1">
        <span>E-mail</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span>Jelszó</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
      </label>

      {err && <div className="text-red-500 text-sm">{err}</div>}

      <button type="submit" disabled={busy} className="board-btn">
        {busy ? "Bejelentkezés..." : "Belépés"}
      </button>
    </form>
  );
}
