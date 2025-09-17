// components/DogDetailsModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AddDogModal from "./AddDogModal";
import { useRole } from "@/components/auth/RoleProvider";
import { canEdit } from "@/lib/roles";

export type DogDetails = {
  id: string;
  name: string;
  chip: string | null;
  info: string | null;
  parents: string | null;
  note?: string | null;
  color: string | null;
  second_color?: string | null;
  filters: string[];
  sovany?: boolean | null;
  cage: string | null;
  position?: number | null;
  created_at?: string;
  updated_at?: string;
};

type Props = {
  open: boolean;
  dog: DogDetails | null;
  onClose: () => void;
  onDeleted?: (id: string) => void;
  onUpdated?: () => void;
};

/* ====== ті ж іконки/кнопки, що й у тулбарі, щоб вигляд був однаковий ====== */
function Icon({
  name,
  className,
}: {
  name: "edit" | "trash";
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
    case "trash":
      return (
        <svg {...common}>
          <path d="M3 6h18" />
          <path d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
          <path d="M10 6V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      );
  }
}

function IconBtn({
  title,
  onClick,
  disabled,
  tone = "default",
  children,
}: {
  title: string;
  onClick(): void;
  disabled?: boolean;
  /** default | danger */
  tone?: "default" | "danger";
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
        "w-[52px] h-[44px] rounded-2xl border transition",
        disabled
          ? "bg-slate-800/50 border-slate-700 text-slate-400 cursor-not-allowed"
          : tone === "danger"
          ? "bg-red-600 text-white border-red-500 hover:bg-red-500"
          : "bg-slate-800/70 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
/* ======================================================================= */

export default function DogDetailsModal({
  open,
  dog,
  onClose,
  onDeleted,
  onUpdated,
}: Props) {
  const [row, setRow] = useState<DogDetails | null>(dog);
  const [editOpen, setEditOpen] = useState(false);

  // роль користувача
  const { role, loading: roleLoading } = useRole();
  const mayEdit = !roleLoading && canEdit(role);

  useEffect(() => {
    if (!open || !dog?.id) return;
    (async () => {
      const { data, error } = await supabase
        .from("dogs")
        .select("*")
        .eq("id", dog.id)
        .single();
      if (!error && data) {
        setRow({
          ...data,
          filters: Array.isArray(data.filters) ? data.filters : [],
        });
      } else {
        setRow(dog);
      }
    })();
  }, [open, dog?.id]);

  if (!open || !row) return null;

  async function handleDelete() {
    // UA: захист — новачки/читачі не можуть видаляти
    if (!mayEdit) return;
    const current = row;
    if (!current) return;

    if (!confirm(`Biztosan törlöd: ${current.name}?`)) return;

    const { error } = await supabase.from("dogs").delete().eq("id", current.id);
    if (error) {
      console.error(error);
      alert("Nem sikerült törölni.");
      return;
    }
    onDeleted?.(current.id);
    onClose();
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header flex items-center justify-between">
            <h3>Kutya adatai</h3>
            <button className="board-btn-ghost" onClick={onClose}>
              Bezár
            </button>
          </div>

          <div className="modal-body">
            <div className="details-grid">
              <div className="dt">Név</div>
              <div className="dd text-lg font-semibold">{row.name}</div>

              <div className="dt">Chip</div>
              <div className="dd">{row.chip || "—"}</div>

              <div className="dt">Információ</div>
              <div className="dd whitespace-pre-wrap">{row.info || "—"}</div>

              <div className="dt">Szülők</div>
              <div className="dd">{row.parents || "—"}</div>

              <div className="dt">Kennel</div>
              <div className="dd">{row.cage || "—"}</div>

              <div className="dt">Sovány</div>
              <div className="dd">{row.sovany ? "Igen" : "Nem"}</div>

              <div className="dt">Szín</div>
              <div className="dd">{row.color || "—"}</div>

              <div className="dt">Szűrők</div>
              <div className="dd">
                {row.filters?.length ? row.filters.join(", ") : "—"}
              </div>

              <div className="dt">Létrehozva</div>
              <div className="dd">
                {row.created_at
                  ? new Date(row.created_at).toLocaleString()
                  : "—"}
              </div>

              <div className="dt">Módosítva</div>
              <div className="dd">
                {row.updated_at
                  ? new Date(row.updated_at).toLocaleString()
                  : "—"}
              </div>
            </div>
          </div>

          <div className="modal-footer flex gap-2 items-center justify-between">
            {/* Ліва частина — просто OK */}
            <div className="flex gap-2">
              <button className="board-btn-ghost" onClick={onClose}>
                Ok
              </button>
            </div>

            {/* Права частина — дії як іконки з таким самим UX, як у тулбарі */}
            <div className="flex gap-2">
              <IconBtn
                title={
                  mayEdit ? "Szerkesztés" : "Nincs jogosultság szerkeszteni"
                }
                onClick={() => mayEdit && setEditOpen(true)}
                disabled={!mayEdit}
              >
                <Icon name="edit" />
              </IconBtn>

              <IconBtn
                title={mayEdit ? "Törlés" : "Nincs jogosultság törölni"}
                onClick={handleDelete}
                disabled={!mayEdit}
                tone="danger"
              >
                <Icon name="trash" />
              </IconBtn>
            </div>
          </div>
        </div>
      </div>

      {editOpen && row && (
        <AddDogModal
          open={editOpen}
          initialDog={{
            id: row.id,
            name: row.name,
            chip: row.chip,
            info: row.info,
            parents: row.parents,
            color: row.color,
            filters: row.filters ?? [],
            sovany: !!row.sovany,
            cage: row.cage,
          }}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            onUpdated?.();
            onClose();
          }}
        />
      )}
    </>
  );
}
