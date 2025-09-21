// components/HeaderBar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useRole } from '@/components/auth/RoleProvider';
import { canManageRoles, roleLabel } from '@/lib/roles';

type Props = {
  email: string | null;
  onLogout: () => void;
};

/** Набір простих SVG-іконок */
function Icon({
  name,
  className,
}: {
  name: 'refresh' | 'users' | 'logout' | 'shield';
  className?: string;
}) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    fill: 'none',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  };
  switch (name) {
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
        </svg>
      );
    case 'users':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
  }
}

/** Кнопка-іконка */
function IconBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex items-center justify-center min-w-[42px] min-h-[38px]
                 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-100
                 border border-slate-700 transition"
    >
      {children}
    </button>
  );
}

export default function HeaderBar({ email, onLogout }: Props) {
  const { role, loading, reload } = useRole();
  const showUsers = !loading && canManageRoles(role);

  const handleRefresh = () => {
    try {
      reload();
    } catch {
      if (typeof window !== 'undefined') window.location.reload();
    }
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800">
      <div className="mx-auto max-w-[1600px] px-3 py-2 flex items-center justify-between gap-3">
        {/* Ліворуч: золотий логотип + email + роль */}
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="truncate text-[22px] font-extrabold
                       bg-gradient-to-b from-amber-300 via-amber-200 to-amber-400
                       bg-clip-text text-transparent
                       [text-shadow:0_1px_0_rgba(0,0,0,.35),0_0_14px_rgba(234,179,8,.25)]"
          >
            Olívia Dog Center
          </div>

          {email && (
            <span className="hidden sm:inline text-slate-300/90">
              Bejelentkezve: <b className="text-slate-100">{email}</b>
            </span>
          )}

          <span className="flex items-center text-amber-300 text-sm font-semibold">
            <Icon name="shield" className="w-4 h-4 mr-1" />
            Szerep:&nbsp;<b className="tracking-wide">{loading ? '…' : roleLabel(role)}</b>
          </span>
        </div>

        {/* Праворуч: кнопки */}
        <div className="flex items-center gap-2">
          <IconBtn title="Frissítés" onClick={handleRefresh}>
            <Icon name="refresh" />
          </IconBtn>

          {showUsers && (
            <Link
              href="/admin/users"
              title="Felhasználók / jogosultságok"
              className="inline-flex items-center justify-center min-w-[42px] min-h-[38px]
                         rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-100
                         border border-slate-700 transition"
            >
              <Icon name="users" />
            </Link>
          )}

          <IconBtn title="Kijelentkezés" onClick={onLogout}>
            <Icon name="logout" />
          </IconBtn>
        </div>
      </div>
    </header>
  );
}
