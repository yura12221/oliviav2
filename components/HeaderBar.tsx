// components/layout/HeaderBar.tsx
"use client";

import React from "react";

type Props = {
  title?: string;                     // заголовок зліва
  role?: string;                      // текст ролі (HU)
  email?: string;                     // залишили опційно для сумісності
  onRefresh?: () => void;             // клік по "Frissítés" (іконка показується, якщо є)
  onOpenUsers?: () => void;           // клік по "Felhasználók" (іконка показується, якщо є)
  onLogout: () => void | Promise<void>;
};

/** маленький SVG-набір без зовн. бібліотек */
function Icon({
  name,
  className,
}: {
  name: "refresh" | "users" | "logout" | "shield";
  className?: string;
}) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    fill: "none",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
  switch (name) {
    case "refresh":
      return (
        <svg {...common}>
          <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
  }
}

/** кнопка-іконка */
function IconBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  if (!onClick) return null; // не показуємо, якщо хендлера немає
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex items-center justify-center min-w-[40px] min-h-[36px] rounded-xl
                 bg-slate-800/70 hover:bg-slate-700 text-slate-100 border border-slate-700
                 transition"
    >
      {children}
    </button>
  );
}

export default function HeaderBar({
  title = "Olívia Dog Center",
  role,
  // email залишили спеціально для сумісності, але не показуємо
  onRefresh,
  onOpenUsers,
  onLogout,
}: Props) {
  return (
    <header className="w-full sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-slate-800">
      <div className="mx-auto max-w-[1600px] px-3 py-2 flex items-center justify-between gap-2">
        {/* Ліво: назва + роль (email прибрали) */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="font-semibold text-slate-100 truncate
                       [text-shadow:0_1px_0_rgba(0,0,0,.35),0_0_12px_rgba(234,179,8,.25)]"
          >
            {title}
          </div>

          {role && (
            <div className="flex items-center text-yellow-400 text-sm">
              <Icon name="shield" className="w-4 h-4 mr-1" />
              <span className="hidden xs:inline">Szerep:&nbsp;</span>
              <b className="tracking-wide">{role}</b>
            </div>
          )}
        </div>

        {/* Право: лише іконки, що мають хендлери */}
        <div className="flex items-center gap-2">
          <IconBtn title="Frissítés" onClick={onRefresh}>
            <Icon name="refresh" />
          </IconBtn>
          <IconBtn title="Felhasználók" onClick={onOpenUsers}>
            <Icon name="users" />
          </IconBtn>
          <IconBtn title="Kijelentkezés" onClick={onLogout}>
            <Icon name="logout" />
          </IconBtn>
        </div>
      </div>
    </header>
  );
}
