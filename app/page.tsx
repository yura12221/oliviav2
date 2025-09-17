// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

import HeaderBar from '@/components/HeaderBar';
import AuthPanel from '@/components/AuthPanel';
import Board from '@/components/Board';

import {
  normalizeRole,
  roleLabel,
  canManageRoles,
  type Role,
} from '@/lib/roles';

export default function Page() {
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<Role>('newbie');

  // ---- auth/session ----
  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (mounted) setSession(data.session);

      // завантажити роль користувача
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      // 1) основне джерело — user_roles
      let rawRole: string | null = null;
      const { data: ur } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (ur?.role) rawRole = ur.role as string;

      // 2) запасне джерело — profiles.role
      if (!rawRole) {
        const { data: pr } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (pr?.role) rawRole = pr.role as string;
      }

      const norm = normalizeRole(rawRole ?? 'newbie');
      if (mounted) setRole(norm);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      if (mounted) setSession(sess);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const refreshPage = () => {
    // простий та надійний варіант оновлення всієї дошки
    window.location.reload();
  };

  const openUsers = () => {
    if (!canManageRoles(role)) {
      alert('Nincs jogosultság. (Csak Admin / Szuperadmin)');
      return;
    }
    router.push('/admin/users');
  };

  if (!session) {
    // НЕавторизований — показуємо форму входу
    return <AuthPanel />;
  }

  // Авторизований — шапка + дошка
  return (
    <>
      <HeaderBar
        title="Olívia Dog Center"
        role={roleLabel(role)}          // 'SZUPERADMIN', 'ADMIN', ...
        onRefresh={refreshPage}         // іконка обновлення
        onOpenUsers={openUsers}         // іконка "Felhasználók"
        onLogout={logout}               // іконка виходу
      />
      <Board />
    </>
  );
}
