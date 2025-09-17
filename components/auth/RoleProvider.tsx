'use client';

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Role } from '@/lib/roles';
import { normalizeRole } from '@/lib/roles';

type Ctx = {
  role: Role;
  loading: boolean;
  email: string | null;
  reload: () => Promise<void>;
};

const RoleContext = createContext<Ctx | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('newbie');
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // захист від "гонок": беремо лише останній результат load()
  const loadSeq = useRef(0);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) console.warn('[RoleProvider] getUser error:', authErr);
      const user = authData?.user ?? null;

      if (!user) {
        if (seq === loadSeq.current) {
          setRole('newbie');
          setEmail(null);
        }
        return;
      }

      if (seq === loadSeq.current) setEmail(user.email ?? null);

      // 1) профіль за id
      const { data: byId, error: e1 } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .maybeSingle();
      if (e1) console.warn('[RoleProvider] profiles by id error:', e1);

      let resolved: Role | null = byId?.role
        ? normalizeRole(String(byId.role))
        : null;
      let source: 'byId' | 'byEmail' | 'fallback' = 'fallback';

      // 2) фолбек за email
      if (!resolved && user.email) {
        const { data: byEmail, error: e2 } = await supabase
          .from('profiles')
          .select('role, email, id')
          .eq('email', user.email)
          .maybeSingle();
        if (e2) console.warn('[RoleProvider] profiles by email error:', e2);
        if (byEmail?.role) {
          resolved = normalizeRole(String(byEmail.role));
          source = 'byEmail';
          if (seq === loadSeq.current) {
            setEmail(byEmail.email ?? user.email ?? null);
          }
        }
      } else if (resolved) {
        source = 'byId';
      }

      // 3) якщо не знайшли — просто показуємо NEWBIE (нічого не пишемо в БД)
      if (!resolved) resolved = 'newbie';

      // дебаг у консоль + на window
      if (typeof window !== 'undefined') {
        (window as any).__roleDebug = {
          userId: user.id,
          userEmail: user.email,
          result: resolved,
          source,
        };
        console.log('[RoleProvider] role:', { resolved, source });
      }

      if (seq === loadSeq.current) setRole(resolved);
    } catch (err) {
      console.error('[RoleProvider] load failed:', err);
      // не перезаписуємо на newbie, якщо вже є попередня роль
      if (seq === loadSeq.current) setRole((prev) => prev ?? 'newbie');
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => { load(); });
    return () => data?.subscription?.unsubscribe?.();
  }, [load]);

  const value = useMemo<Ctx>(() => ({ role, loading, email, reload: load }), [role, loading, email, load]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): Ctx {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside <RoleProvider>');
  return ctx;
}
