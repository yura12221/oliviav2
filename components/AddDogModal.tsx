"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type DogRecord = {
  id: string;
  name: string;
  chip: string | null;
  info: string | null;
  parents: string | null;
  color: string | null;   // HEX або css-ім’я
  filters: string[];      // завжди масив
  sovany: boolean;
  cage: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (dog: DogRecord) => void;
  /** якщо переданий initialDog → форма працює в режимі РЕДАГУВАННЯ */
  initialDog?: DogRecord;
  /** колбек після успішного UPDATE */
  onSaved?: () => void;
};

function normalizeColor(c: string): string {
  const v = c.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return v;
  return v;
}

export default function AddDogModal({ open, onClose, onCreated, initialDog, onSaved }: Props) {
  const isEdit = !!initialDog;

  // поля
  const [name, setName] = useState(initialDog?.name ?? "");
  const [chip, setChip] = useState(initialDog?.chip ?? "");
  const [info, setInfo] = useState(initialDog?.info ?? "");
  const [parents, setParents] = useState(initialDog?.parents ?? "");
  const [color, setColor] = useState<string | null>(initialDog?.color ?? null);
  const [filters, setFilters] = useState<string[]>(initialDog?.filters ?? []);
  const [sovany, setSovany] = useState<boolean>(initialDog?.sovany ?? false);
  const [cage] = useState<string | null>(initialDog?.cage ?? null); // клітку тут не редагуємо

  // довідники
  const [allColors, setAllColors] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerValue, setPickerValue] = useState("#ff0000");
  const [allFilters, setAllFilters] = useState<string[]>([]);
  const [showFilterInput, setShowFilterInput] = useState(false);
  const [newFilter, setNewFilter] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: colorRows } = await supabase.from("dogs").select("color").not("color", "is", null);
      const colors = Array.from(new Set((colorRows ?? []).map((r: any) => String(r.color)))).sort();
      setAllColors(colors);

      const { data: filterRows } = await supabase.from("dogs").select("filters");
      const fset = new Set<string>();
      (filterRows ?? []).forEach((r: any) => (r.filters ?? []).forEach((f: string) => f && fset.add(f)));
      setAllFilters(Array.from(fset).sort());
    })();
  }, [open]);

  const finalColor = useMemo(() => (color ? normalizeColor(color) : null), [color]);
  const canSave = name.trim().length > 0 && !saving;

  // helpers
  function toggleFilter(f: string) {
    setFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  }
  function addNewFilter() {
    const v = newFilter.trim();
    if (!v) return;
    if (!filters.includes(v)) setFilters((p) => [...p, v]);
    if (!allFilters.includes(v)) setAllFilters((p) => [...p, v].sort());
    setNewFilter("");
    setShowFilterInput(false);
  }
  function addPickedColor() {
    const hex = normalizeColor(pickerValue);
    setColor(hex);
    if (!allColors.includes(hex)) setAllColors((p) => [...p, hex].sort());
    setShowPicker(false);
  }

  async function findFirstFreeCageCS(): Promise<string | null> {
    const { count } = await supabase.from("dogs").select("id", { count: "exact", head: true }).eq("cage", "cs");
    return (count ?? 0) < 70 ? "cs" : null;
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);

    if (isEdit && initialDog) {
      // UPDATE
      const payload = {
        name: name.trim(),
        chip: chip.trim() || null,
        info: info.trim() || null,
        parents: parents.trim() || null,
        color: finalColor,
        filters,
        sovany,
      };
      const { error } = await supabase.from("dogs").update(payload).eq("id", initialDog.id);
      setSaving(false);
      if (error) {
        console.error("Update dog error:", error);
        alert("Nem sikerült menteni.");
        return;
      }
      onSaved?.();
      onClose();
      return;
    }

    // INSERT
    const toCage = await findFirstFreeCageCS();
    const newDog: DogRecord = {
      id: crypto.randomUUID(),
      name: name.trim(),
      chip: chip.trim() || null,
      info: info.trim() || null,
      parents: parents.trim() || null,
      color: finalColor,
      filters,
      sovany,
      cage: toCage ?? cage ?? null,
    };
    onCreated?.(newDog);
    const { error } = await supabase.from("dogs").insert(newDog);
    setSaving(false);
    if (error) {
      console.error("Insert dog error:", error);
      alert("Hiba történt a mentés közben.");
      return;
    }
    onClose();
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h3>{isEdit ? "Kutya szerkesztése" : "Új kutya"}</h3></div>

        <div className="modal-body">
          <div className="form-grid">
            <label>Név</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="pl. Rex" />

            <label>Chip</label>
            <input value={chip ?? ""} onChange={(e) => setChip(e.target.value)} placeholder="123456789" />

            <label>Információ</label>
            <textarea value={info ?? ""} onChange={(e) => setInfo(e.target.value)} placeholder="Megjegyzés..." />

            <label>Szülők</label>
            <input value={parents ?? ""} onChange={(e) => setParents(e.target.value)} placeholder="anya / apa" />

            <label>Szín</label>
            <div className="swatch-list">
              {allColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`swatch ${finalColor === c ? "swatch-selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
              <button type="button" className="swatch swatch-plus" onClick={() => setShowPicker((v) => !v)}>+</button>
              {showPicker && (
                <div className="color-popover" onClick={(e) => e.stopPropagation()}>
                  <input type="color" value={pickerValue} onChange={(e) => setPickerValue(e.target.value)} />
                  <button className="board-btn" onClick={addPickedColor}>Hozzáadás</button>
                  <button className="board-btn-ghost" onClick={() => setShowPicker(false)}>Mégse</button>
                </div>
              )}
            </div>

            <label>Szűrők</label>
            <div className="filter-list">
              {allFilters.map((f) => (
                <label key={f} className={`tag ${filters.includes(f) ? "tag-active" : ""}`}>
                  <input type="checkbox" checked={filters.includes(f)} onChange={() => toggleFilter(f)} />
                  <span>{f}</span>
                </label>
              ))}
              {!showFilterInput ? (
                <button type="button" className="swatch swatch-plus" onClick={() => setShowFilterInput(true)}>+</button>
              ) : (
                <div className="filter-add" onClick={(e) => e.stopPropagation()}>
                  <input
                    autoFocus
                    value={newFilter}
                    onChange={(e) => setNewFilter(e.target.value)}
                    placeholder="új szűrő..."
                    onKeyDown={(e) => e.key === "Enter" && addNewFilter()}
                  />
                  <button type="button" className="board-btn" onClick={addNewFilter}>✔</button>
                  <button type="button" className="board-btn-ghost" onClick={() => { setShowFilterInput(false); setNewFilter(""); }}>✕</button>
                </div>
              )}
            </div>

            <label>Sovány</label>
            <div className="toggle">
              <input id="sovany-toggle" type="checkbox" checked={sovany} onChange={(e) => setSovany(e.target.checked)} />
              <label htmlFor="sovany-toggle" className={sovany ? "toggle-on" : "toggle-off"}>{sovany ? "BE" : "KI"}</label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="board-btn-ghost" onClick={onClose}>Mégse</button>
          <button className="board-btn" disabled={!canSave} onClick={handleSave}>
            {saving ? "Mentés..." : (isEdit ? "Mentés" : "Hozzáadás")}
          </button>
        </div>
      </div>
    </div>
  );
}
