"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (dogIds: string[]) => void; // повертаємо знайдених собак
};

export default function FilterListModal({ open, onClose, onApply }: Props) {
  const [colors, setColors] = useState<string[]>([]);
  const [filters, setFilters] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const [sovanyOnly, setSovanyOnly] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: dogs } = await supabase.from("dogs").select("color,filters");
      const cset = new Set<string>();
      const fset = new Set<string>();
      (dogs ?? []).forEach((r: any) => {
        if (r.color) cset.add(r.color);
        (r.filters ?? []).forEach((f: string) => f && fset.add(f));
      });
      setColors(Array.from(cset).sort());
      setFilters(Array.from(fset).sort());
    })();
  }, [open]);

  function toggleSet(s: Set<string>, v: string, setter: (x: Set<string>) => void) {
    const next = new Set(s);
    if (next.has(v)) next.delete(v); else next.add(v);
    setter(next);
  }

  async function apply() {
    // будуємо where: color in selectedColors OR filters overlap selectedFilters OR sovany
    let query = supabase.from("dogs").select("id,color,filters,sovany");
    // якщо нічого не вибрано — повертаємо пустий список, щоб не здивувати
    if (!sovanyOnly && selectedColors.size === 0 && selectedFilters.size === 0) {
      onApply([]); onClose(); return;
    }
    // фільтруємо на клієнті (простий шлях, щоб не городити or() у запитах)
    const { data } = await supabase.from("dogs").select("id,color,filters,sovany");
    const ids: string[] = [];
    (data ?? []).forEach((d: any) => {
      const byColor = selectedColors.size ? selectedColors.has(d.color) : false;
      const byFilter =
        selectedFilters.size
          ? (d.filters ?? []).some((f: string) => selectedFilters.has(f))
          : false;
      const bySovany = sovanyOnly ? !!d.sovany : false;
      if (byColor || byFilter || bySovany) ids.push(d.id);
    });
    onApply(ids);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header flex items-center justify-between">
          <h3>Szűrés és kijelölés</h3>
          <button className="board-btn-ghost" onClick={onClose}>Bezár</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <label>Színek</label>
            <div className="swatch-list">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  className={`swatch ${selectedColors.has(c) ? "swatch-selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => toggleSet(selectedColors, c, setSelectedColors)}
                />
              ))}
            </div>

            <label>Szűrők</label>
            <div className="filter-list">
              {filters.map((f) => (
                <button
                  key={f}
                  className={`tag ${selectedFilters.has(f) ? "tag-active" : ""}`}
                  onClick={() => toggleSet(selectedFilters, f, setSelectedFilters)}
                >
                  {f}
                </button>
              ))}
            </div>

            <label>Sovány</label>
            <div className="toggle">
              <input
                id="flt-sovany"
                type="checkbox"
                checked={sovanyOnly}
                onChange={(e) => setSovanyOnly(e.target.checked)}
              />
              <label htmlFor="flt-sovany" className={sovanyOnly ? "toggle-on" : "toggle-off"}>
                Csak sovány
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="board-btn-ghost" onClick={onClose}>Mégse</button>
          <button className="board-btn" onClick={apply}>Kijelölés</button>
        </div>
      </div>
    </div>
  );
}
