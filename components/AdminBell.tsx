"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export function AdminBell() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    let sub: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // роль беремо з public.user_roles
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) console.warn("[AdminBell] user_roles error:", error);

      const role = data?.role as string | undefined;
      const admin = role === "admin" || role === "superadmin";
      if (alive) setIsAdmin(admin);
      if (!admin) return;

      // підрахунок непідтверджених
      const loadPending = async () => {
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("approved", false);
        if (alive) setCount(count ?? 0);
      };

      await loadPending();

      // realtime: слухаємо зміни у profiles.approved
      sub = supabase
        .channel("profiles_approved")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => loadPending()
        )
        .subscribe();
    })();

    return () => {
      alive = false;
      try { sub?.unsubscribe(); } catch {}
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      href="/admin/users"
      className="relative inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-black/5"
      title={count > 0 ? `${count} pending` : "Admin"}
      aria-label="Admin notifications"
    >
      <span aria-hidden>🔔</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 text-[10px] leading-none bg-red-600 text-white rounded-full px-[6px] py-[2px]">
          {count}
        </span>
      )}
    </Link>
  );
}
