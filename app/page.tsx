'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import HeaderBar from '@/components/HeaderBar';
import AuthPanel from '@/components/AuthPanel';
import Board from '@/components/Board';

export default function Page() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (mounted) setSession(data.session);
    }
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      if (mounted) setSession(sess);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (!session) {
    // НЕавторизований — показуємо гарну форму входу
    return <AuthPanel />;
  }

  // Авторизований — шапка + дошка
  return (
    <>
      <HeaderBar email={session.user?.email} onLogout={logout} />
      <Board />
    </>
  );
}
