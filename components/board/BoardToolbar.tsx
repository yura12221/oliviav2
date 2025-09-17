// components/board/BoardToolbar.tsx
"use client";

import React from "react";
import { useRole } from "@/components/auth/RoleProvider";
import { canEdit } from "@/lib/roles";

/* ==================== Легкі SVG-іконки (без бібліотек) ==================== */
function Icon({
  name,
  className,
}: {
  name: "edit" | "plus" | "filter" | "print" | "clear";
  className?: string;
}) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    fill: "none",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (name) {
    case "edit":
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "filter":
      return (
        <svg {...common}>
          <path d="M3 5h18M6 12h12M10 19h4" />
        </svg>
      );
    case "print":
      return (
        <svg {...common}>
          <path d="M6 9V4h12v5" />
          <rect x="6" y="14" width="12" height="7" rx="2" />
          <path d="M6 18h12" />
          <path d="M18 13h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
        </svg>
      );
    case "clear":
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
  }
}

/* UA: кнопка-іконка з однаковими розмірами і станами */
function IconBtn({
  title,
  onClick,
  disabled,
  active,
  children,
}: {
  title: string;
  onClick(): void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center",
        "w-[52px] h-[44px] rounded-2xl",
        "border transition",
        // базова «плитка»
        "bg-slate-800/70 border-slate-700 text-slate-200",
        "hover:bg-slate-700 hover:border-slate-600",
        // активний (для Szerkesztés у ввімкненому стані)
        active ? "bg-red-600 text-white border-red-500 hover:bg-red-500" : "",
        // disabled
        disabled ? "opacity-40 cursor-not-allowed hover:bg-slate-800/70" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

type Props = {
  // лишаємо в сигнатурі, але не показуємо в UI (ти просив прибрати ці кнопки)
  zoomOut(): void;
  zoomIn(): void;
  fit(): void;
  reset100(): void;

  query: string;
  setQuery(q: string): void;

  editMode: boolean;
  toggleMode(): void;

  resetSelection(): void;

  openFilters(): void;
  openPrint(): void;
  openAdd(): void;

  pickedCount: number;
  saving: boolean;
};

export default function BoardToolbar({
  zoomOut,
  zoomIn,
  fit,
  reset100,
  query,
  setQuery,
  editMode,
  toggleMode,
  resetSelection,
  openFilters,
  openPrint,
  openAdd,
  pickedCount,
  saving,
}: Props) {
  const { role, loading } = useRole();
  const mayEdit = !loading && canEdit(role);

  return (
    <div className="board-toolbar-wrap">
      <div className="board-toolbar w-full items-center">
        {/* Пошук */}
        <div className="flex items-center gap-2 min-w-[220px]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Keresés név / chip…"
            className="border rounded-xl px-3 py-2 bg-[#0b1220] border-slate-700 text-slate-100 w-[260px] max-w-[60vw]"
          />
          {query && (
            <IconBtn title="Törlés" onClick={() => setQuery("")}>
              <Icon name="clear" />
            </IconBtn>
          )}
        </div>

        {/* Правий блок кнопок */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Перемикач режиму: редактор (іконка олівця) */}
          <IconBtn
            title={
              mayEdit
                ? editMode
                  ? "Szerkesztés: BE (drag&drop)"
                  : "Szerkesztés: KI"
                : "Nincs jogosultság szerkeszteni"
            }
            onClick={() => mayEdit && toggleMode()}
            disabled={!mayEdit}
            active={editMode}
          >
            <Icon name="edit" />
          </IconBtn>

          {/* Кнопка «+ Új kutya» — теж тільки для editor/admin/szuperadmin */}
          <IconBtn
            title={mayEdit ? "Új kutya" : "Nincs jogosultság új kutyát hozzáadni"}
            onClick={() => mayEdit && openAdd()}
            disabled={!mayEdit}
          >
            <Icon name="plus" />
          </IconBtn>

          {/* Фільтри (доступні завжди, але логічні лише коли не редагуємо) */}
          <IconBtn
            title="Szűrők"
            onClick={() => !editMode && openFilters()}
            disabled={editMode}
          >
            <Icon name="filter" />
          </IconBtn>

          {/* Друк: активний, якщо є вибрані */}
          <div className="relative">
            <IconBtn
              title={pickedCount > 0 ? "Nyomtatás" : "Nincs kijelölt elem"}
              onClick={() => pickedCount > 0 && openPrint()}
              disabled={pickedCount === 0}
            >
              <Icon name="print" />
            </IconBtn>
            {pickedCount > 0 && (
              <span
                className="absolute -top-1 -right-1 text-[10px] leading-none
                           bg-emerald-600 text-white rounded-full px-[6px] py-[2px]"
              >
                {pickedCount}
              </span>
            )}
          </div>

          {/* Очистити вибір (працює в обох режимах) */}
          <IconBtn title="Kijelölés törlése" onClick={resetSelection}>
            <Icon name="clear" />
          </IconBtn>

          {/* Індикатор збереження */}
          {saving && (
            <span className="text-sm text-slate-300 select-none">Mentés…</span>
          )}
        </div>
      </div>
    </div>
  );
}
