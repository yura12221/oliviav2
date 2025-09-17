'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { ROLE_ORDER, normalizeRole, roleLabel, type Role, canManageRoles } from '@/lib/roles';
import { useRole } from '@/components/auth/RoleProvider';

type ProfileRow = { id: string; email: string | null; role: string | null };

export default function AdminUsersPage() {
  const { role: myRole } = useRole();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role')
        .order('email', { ascending: true });
      if (error) {
        console.error('[admin/users] load error', error);
      }
      setRows(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const updateRole = async (id: string, nextRole: Role) => {
    setSavingId(id);
    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('id', id);
    if (error) {
      console.error('[admin/users] update role error', error);
      alert('Hiba történt a szerep frissítésekor');
    } else {
      setRows(prev => prev.map(r => (r.id === id ? { ...r, role: nextRole } : r)));
    }
    setSavingId(null);
  };

  if (!canManageRoles(myRole)) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Felhasználók</h1>
        <div className="mb-4 text-sm opacity-80">
          Nincs jogosultság a felhasználók kezeléséhez.
        </div>
        <Link href="/" className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700">
          Vissza
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Felhasználók</h1>
        <Link href="/" className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700">
          Vissza a táblához
        </Link>
      </div>

      {loading ? (
        <div>Betöltés…</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800/70">
              <tr>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Szerep</th>
                <th className="px-4 py-2 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const current = normalizeRole(r.role || 'newbie');
                return (
                  <tr key={r.id} className="border-t border-slate-700">
                    <td className="px-4 py-2">{r.email ?? r.id}</td>
                    <td className="px-4 py-2">
                      <select
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1"
                        value={current}
                        onChange={(e) => updateRole(r.id, e.target.value as Role)}
                        disabled={savingId === r.id}
                      >
                        {ROLE_ORDER.map((opt) => (
                          <option key={opt} value={opt}>
                            {roleLabel(opt)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      {savingId === r.id && <span>Mentés…</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
