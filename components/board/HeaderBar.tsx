'use client';

import React from 'react';
import Link from 'next/link';
import { useRole } from '@/components/auth/RoleProvider';
import { canManageRoles, roleLabel } from '@/lib/roles';

export default function HeaderBar({
  email,
  onLogout,
}: {
  email: string | null;
  onLogout: () => void;
}) {
  const { role, loading, reload } = useRole();

  return (
    <header className="w-full flex items-center justify-between gap-3 px-4 py-2 bg-slate-900/70 rounded-xl">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold">Olívia Dog Center</span>
        {email && <span className="opacity-80">Bejelentkezve: <b>{email}</b></span>}
        <span className="text-yellow-400">Szerep: <b>{loading ? '…' : roleLabel(role)}</b></span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => reload()}
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700"
          title="Szerep frissítése"
        >
          Frissítés
        </button>

        {!loading && canManageRoles(role) && (
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
            title="Felhasználók / jogosultságok"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"/>
            </svg>
            <span className="hidden sm:inline">Felhasználók</span>
          </Link>
        )}

        <button
          onClick={onLogout}
          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700"
        >
          Kijelentkezés
        </button>
      </div>
    </header>
  );
}
