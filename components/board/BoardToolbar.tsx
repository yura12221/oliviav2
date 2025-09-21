// components/board/BoardToolbar.tsx
"use client";

import React from "react";
import { useRole } from "@/components/auth/RoleProvider";
import { canEdit } from "@/lib/roles";

/* ---------- lightweight SVG icons ---------- */
function Icon({
  name,
  className,
}: {
  name:
    | "edit"
    | "plus"
    | "filter"
    | "print"
    | "clear"
    | "chevLeft"
    | "chevRight"
    | "search";
  className?: string;
}) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    fill: "none",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: ["pointer-events-none", className].filter(Boolean).join(" "),
    "aria-hidden": true as any,
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
    case "chevLeft":
      return (
        <svg {...common}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      );
    case "chevRight":
      return (
        <svg {...common}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      );
  }
}

/* ---------- square icon button (right group) ---------- */
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
        "inline-flex items-center justify-center w-[52px] h-[44px] rounded-2xl",
        "border transition",
        "bg-slate-800/70 border-slate-700 text-slate-200",
        "hover:bg-slate-700 hover:border-slate-600",
        active
          ? "bg-red-600 text-white border-red-500 hover:bg-red-500 shadow-[0_8px_18px_rgba(239,68,68,.28)] ring-1 ring-red-400/50"
          : "",
        disabled ? "opacity-40 cursor-not-allowed hover:bg-slate-800/70" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

type Props = {
  zoomOut(): void;
  zoomIn(): void;
  fit(): void;
  reset100(): void;

  // пошук
  query: string;
  setQuery(q: string): void;
  matchCount: number;
  onSearchPrev(): void;
  onSearchNext(): void;
  onSearchClear(): void;

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
  matchCount,
  onSearchPrev,
  onSearchNext,
  onSearchClear,
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

  const hasQuery = query.trim().length > 0;
  const hasMatches = hasQuery && matchCount > 0;

  return (
    <div className="board-toolbar-wrap">
      <div className="board-toolbar w-full items-center">
        {/* SEARCH */}
        <div className="flex items-center gap-2 min-w-[260px]">
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3 text-slate-400">
              <Icon name="search" />
            </span>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Keresés név / chip…"
              className="pl-10 pr-[132px] py-2
                         w-[340px] sm:w-[400px] max-w-[78vw]
                         rounded-xl border bg-[#0b1220] border-slate-700 text-slate-100
                         focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />

            {/* right-side controls (match count + prev/next + clear) */}
            <div
              className="absolute right-2 inset-y-0 flex items-center gap-1"
              style={{ pointerEvents: "auto" }}
            >
              {hasMatches && (
                <span
                  className="px-2 py-[2px] text-[11px] rounded-full border
                             bg-emerald-600/25 border-emerald-500/60 text-emerald-100 select-none"
                  title="Találatok száma"
                >
                  {matchCount}
                </span>
              )}

              {hasMatches && (
                <>
                  <button
                    type="button"
                    onClick={onSearchPrev}
                    title="Előző találat"
                    className="search-ctrl w-8 h-8 inline-flex items-center justify-center rounded-xl border
                               !bg-slate-700/40 !border-slate-600 !text-slate-200
                               hover:!bg-slate-600/70 transition"
                  >
                    <Icon name="chevLeft" />
                  </button>
                  <button
                    type="button"
                    onClick={onSearchNext}
                    title="Következő találat"
                    className="search-ctrl w-8 h-8 inline-flex items-center justify-center rounded-xl border
                               !bg-slate-700/40 !border-slate-600 !text-slate-200
                               hover:!bg-slate-600/70 transition"
                  >
                    <Icon name="chevRight" />
                  </button>
                </>
              )}

              {hasQuery && (
                <button
                  type="button"
                  onClick={onSearchClear}
                  title="Törlés"
                  className="search-ctrl w-8 h-8 inline-flex items-center justify-center rounded-xl border
                             !bg-slate-700/40 !border-slate-600 !text-slate-200
                             hover:!bg-slate-600/70 transition"
                >
                  <Icon name="clear" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT GROUP */}
        <div className="flex items-center gap-3 ml-auto">
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

          <IconBtn
            title={mayEdit ? "Új kutya" : "Nincs jogosultság új kutyát hozzáadni"}
            onClick={() => mayEdit && openAdd()}
            disabled={!mayEdit}
          >
            <Icon name="plus" />
          </IconBtn>

          <IconBtn
            title="Szűrők"
            onClick={() => !editMode && openFilters()}
            disabled={editMode}
          >
            <Icon name="filter" />
          </IconBtn>

          <div className="relative">
            <IconBtn
              title={pickedCount > 0 ? "Nyomtatás" : "Nincs kijelölt elem"}
              onClick={() => pickedCount > 0 && openPrint()}
              disabled={pickedCount === 0}
            >
              <Icon name="print" />
            </IconBtn>
            {pickedCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] leading-none bg-emerald-600 text-white rounded-full px-[6px] py-[2px]">
                {pickedCount}
              </span>
            )}
          </div>

          <IconBtn title="Kijelölés törlése" onClick={resetSelection}>
            <Icon name="clear" />
          </IconBtn>

          {saving && (
            <span className="text-sm text-slate-300 select-none">Mentés…</span>
          )}
        </div>
      </div>
    </div>
  );
}
