'use client';

import React from 'react';
import Link from 'next/link';
import { useRole } from '@/components/auth/RoleProvider';
import { canManageRoles, roleLabel } from '@/lib/roles';
import { AdminBell } from '@/components/AdminBell';
function Icon({ name, className }: { name: 'refresh'|'users'|'logout'; className?: string }) {
  switch (name) {
    case 'refresh':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M12 6V3l-4 4 4 4V8c2.76 0 5 2.24 5 5 0 .65-.13 1.27-.36 1.84l1.53 1.53A6.97 6.97 0 0 0 19 13c0-3.87-3.13-7-7-7zm-5 3c-.65 0-1.27.13-1.84.36L3.63 7.83A6.97 6.97 0 0 1 5 7c3.87 0 7 3.13 7 7v3l4-4-4-4v3c-2.76 0-5-2.24-5-5z"/></svg>
      );
    case 'users':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.95 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
      );
    case 'logout':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={className}><path fill="currentColor" d="M16 13v-2H7V8l-5 4 5 4v-3h9zm3-10H11c-1.1 0-2 .9-2 2v3h2V5h8v14h-8v-3H9v3c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
      );
  }
}

export default function HeaderBar({
  email,
  onLogout,
}: {
  email: string | null;
  onLogout: () => void;
}) {
  const { role, loading, reload } = useRole();

  const mayManageUsers = !loading && canManageRoles(role);

  return (
    <header className="hdr">
      <div className="hdr__left">
        <Link href="/" className="brand-title" aria-label="Home">
          Olívia&nbsp;Dog&nbsp;Center
        </Link>
        {/* Роль маленьким бейджем (можна прибрати, якщо не потрібно) */}
        <span className="role-badge" title="Szerep">
          {roleLabel(role)}
        </span>
      </div>

      <div className="hdr__spacer" />

      <div className="hdr__right">
        {/* Без e‑mail: прибрано показ адреси */}

        {/* Кнопки як іконки, без написів */}
        <button className="icon-btn" onClick={reload} aria-label="Frissítés" title="Frissítés">
          <Icon name="refresh" className="icon" />
        </button>

        {mayManageUsers && (
          <Link href="/admin/users" className="icon-btn" aria-label="Felhasználók" title="Felhasználók">
            <Icon name="users" className="icon" />
          </Link>
        )}

        <AdminBell />

        <button className="icon-btn" onClick={onLogout} aria-label="Kijelentkezés" title="Kijelentkezés">
          <Icon name="logout" className="icon" />
        </button>
      </div>
    </header>
  );
}
