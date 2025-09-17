'use client';
import { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';

export default function ReloadPrompt() {
  const [wb, setWb] = useState<Workbox | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;

    const _wb = new Workbox('/sw.js');

    // SW оновився і чекає активації
    _wb.addEventListener('waiting', () => setWb(_wb));

    // Нова версія встановлена під час роботи сторінки
    _wb.addEventListener('installed', (evt: any) => {
      if (evt.isUpdate) setWb(_wb);
    });

    _wb.register();
    return () => {
      try { (_wb as any).destroy?.(); } catch {}
    };
  }, []);

  if (!wb) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl shadow-lg border bg-white px-4 py-3 flex items-center gap-3">
      <span className="text-sm">Доступне оновлення застосунку.</span>
      <button
        onClick={async () => {
          await wb.messageSkipWaiting();
          wb.addEventListener('controlling', () => window.location.reload());
        }}
        className="text-sm rounded-xl border px-3 py-1 hover:bg-slate-50"
      >
        Оновити
      </button>
    </div>
  );
}
