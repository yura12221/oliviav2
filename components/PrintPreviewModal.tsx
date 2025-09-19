// components/PrintPreviewModal.tsx
"use client";

import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type PrintDog = {
  id: string;
  name: string;
  cage: string | null;
  chip?: string | null;
  color?: string | null;
  filters?: string[] | null;
  info?: string | null;
};

type ColKey =
  | "name"
  | "cage"
  | "chip"
  | "color"
  | "filters"
  | "info"
  | "extra1"
  | "extra2"
  | "extra3";

const ALL_COLS: { key: ColKey; label: string; minW: number }[] = [
  { key: "name", label: "Név", minW: 90 },
  { key: "cage", label: "Kennel", minW: 30 },
  { key: "chip", label: "Chip", minW: 60 },
  { key: "color", label: "Szín", minW: 40 },
  { key: "filters", label: "Szűrők", minW: 80 },
  { key: "info", label: "Információ", minW: 100 },
  { key: "extra1", label: "Megj.1", minW: 60 },
  { key: "extra2", label: "Megj.2", minW: 60 },
  { key: "extra3", label: "Megj.3", minW: 60 },
];

type Props = {
  open: boolean;
  dogs: PrintDog[];
  onClose: () => void;
  onRemove: (id: string) => void;

  trainerName?: string | null;
  setTrainerName?: (name: string | null) => void;
  trainers?: string[];
  onAddTrainer?: (name: string) => void;
};

export default function PrintPreviewModal({
  open,
  dogs,
  onClose,
  onRemove,
  trainerName,
  setTrainerName,
  trainers,
  onAddTrainer,
}: Props) {
  const [visible, setVisible] = useState<Set<ColKey>>(
    new Set(["name", "cage", "info", "extra1", "extra2", "extra3"])
  );
  const cols = useMemo(() => ALL_COLS.filter((c) => visible.has(c.key)), [visible]);

  const today = new Date().toLocaleDateString("hu-HU");

  function toggleCol(k: ColKey) {
    const s = new Set(visible);
    s.has(k) ? s.delete(k) : s.add(k);
    setVisible(s);
  }

  // ===== Константи вимірювання (у pt — пункти, як у jsPDF) =====
  const INDEX_W_PT = 28;     // колонка "#"
  const DELETE_COL_W_PT = 46; // ширина колонки з ✕
  const FONT_SIZE_PT = 10;   // кегль таблиці
  const PADDING_PT = 6;      // горизонтальний паддінг клітини
  const MIN_CELL_W_PT = 26;  // технічний мінімум ширини
  const MARGIN_L_PT = 40;
  const MARGIN_R_PT = 40;
  const HEAD_FUDGE_PT = 2;   // невеликий запас для жирної шапки

  const isExtra = (k: ColKey) => k === "extra1" || k === "extra2" || k === "extra3";

  const cellText = (d: PrintDog, k: ColKey) => {
    switch (k) {
      case "name": return d.name || "";
      case "cage": return d.cage || "";
      case "chip": return d.chip || "";
      case "color": return d.color || "";
      case "filters": return (d.filters ?? []).join(", ");
      case "info": return d.info || "";
      default: return ""; // extra1/2/3 — поля для нотаток
    }
  };

  // ===== ЄДИНИЙ розрахунок ширин для PDF і для браузерного друку =====
  const widthsPt: Record<ColKey, number> = useMemo(() => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidthPt = doc.internal.pageSize.getWidth();
    const availForColsPt = (pageWidthPt - MARGIN_L_PT - MARGIN_R_PT) - INDEX_W_PT;

    const measure = (s: any) => {
      const text = String(s ?? "");
      let max = 0;
      for (const part of text.split("\n")) {
        const w = doc.getTextWidth(part);
        if (w > max) max = w;
      }
      return max;
    };

    const bases = cols.map((c) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FONT_SIZE_PT);
      const headW = measure(c.label ?? "") + HEAD_FUDGE_PT;

      doc.setFont("helvetica", "normal");
      let maxW = headW;
      for (const d of dogs) {
        maxW = Math.max(maxW, measure(cellText(d, c.key)));
      }
      const base = Math.max(MIN_CELL_W_PT, maxW + PADDING_PT * 2);
      return { key: c.key, base };
    });

    const result: Record<ColKey, number> = Object.create(null);
    bases.forEach((b) => (result[b.key] = b.base));

    const visibleExtraKeys = cols.map(c => c.key).filter(isExtra);
    let sumPt = bases.reduce((s, b) => s + b.base, 0);

    if (sumPt < availForColsPt && visibleExtraKeys.length > 0) {
      const leftover = availForColsPt - sumPt;
      const add = leftover / visibleExtraKeys.length;
      visibleExtraKeys.forEach((k) => (result[k] += add));
      sumPt = availForColsPt;
    }

    if (sumPt > availForColsPt) {
      let need = sumPt - availForColsPt;

      if (visibleExtraKeys.length > 0 && need > 0) {
        const extraNow = visibleExtraKeys.reduce((s, k) => s + result[k], 0);
        const extraMin = visibleExtraKeys.length * MIN_CELL_W_PT;
        const extraShrinkable = Math.max(0, extraNow - extraMin);
        const take = Math.min(need, extraShrinkable);
        if (take > 0) {
          const coef = (extraNow - take) / extraNow;
          visibleExtraKeys.forEach((k) => (result[k] = Math.max(MIN_CELL_W_PT, result[k] * coef)));
          need -= take;
        }
      }

      if (need > 0) {
        const keys = cols.map((c) => c.key);
        const current = keys.reduce((s, k) => s + result[k], 0);
        const coef = (current - need) / current;
        keys.forEach((k) => (result[k] = Math.max(MIN_CELL_W_PT, result[k] * coef)));
      }
    }

    return result;
  }, [cols, dogs]);

  // ====== PDF: використовуємо ті самі ширини ======
  function downloadPDF() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Дата + тренер у PDF
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(today, MARGIN_L_PT, 40);
    if (trainerName) {
      doc.setFont("helvetica", "bold");
      doc.text(`Tréner: ${trainerName}`, pageWidth / 2, 40, { align: "center" });
      doc.setFont("helvetica", "normal");
    }

    const head = ["№", ...cols.map((c) => c.label)];
    const body = dogs.map((d, i) => [
      i + 1,
      ...cols.map((c) => cellText(d, c.key)),
    ]);

    const columnStyles: Record<number, any> = {
      0: { cellWidth: INDEX_W_PT, halign: "center" },
    };
    cols.forEach((c, i) => {
      columnStyles[i + 1] = { cellWidth: widthsPt[c.key] };
      if (c.key === "cage") columnStyles[i + 1].halign = "center";
    });

    autoTable(doc, {
      head: [head],
      body,
      startY: 60,
      margin: { left: MARGIN_L_PT, right: MARGIN_R_PT },
      tableWidth: "wrap",
      styles: {
        fontSize: FONT_SIZE_PT,
        cellPadding: PADDING_PT,
        overflow: "linebreak",
        lineWidth: 1,
        lineColor: [0, 0, 0],
      },
      headStyles: {
        fontStyle: "bold",
        cellPadding: PADDING_PT,
        overflow: "linebreak",
        fillColor: [241, 245, 249],
        textColor: 20,
        lineWidth: 1.2,
        lineColor: [0, 0, 0],
      },
      columnStyles,
    });

    doc.save(`lista_${today}.pdf`);
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal print-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header flex items-center justify-between">
          <h3>Nyomtatási előnézet (A4)</h3>
        <div className="flex gap-2">
            <button className="board-btn" onClick={downloadPDF}>📄 PDF letöltése</button>
            <button className="board-btn" onClick={() => window.print()}>🖨️ Nyomtatás</button>
            <button className="board-btn-ghost" onClick={onClose}>Bezár</button>
          </div>
        </div>

        <div className="modal-body">
          {trainers && setTrainerName && (
            <div className="pill-list" style={{ margin: "10px 0 16px" }}>
              {trainers.map((t) => (
                <button
                  key={t}
                  className={`pill ${trainerName === t ? "pill-active" : ""}`}
                  onClick={() => setTrainerName(t)}
                >
                  {t}
                </button>
              ))}
              {onAddTrainer && (
                <button className="pill pill-plus" onClick={() => {
                  const name = prompt("Új tréner neve:");
                  if (name) onAddTrainer(name);
                }}>
                  + Tréner
                </button>
              )}
              {!!trainerName && (
                <button className="pill" onClick={() => setTrainerName(null)}>× törlés</button>
              )}
            </div>
          )}

          <div className="print-area">
            {/* Дата + тренер у браузерному друку */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
              color: "#000"
            }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{today}</div>
              {trainerName && (
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  Tréner: {trainerName}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-3 no-print">
              {ALL_COLS.map((c) => (
                <button
                  key={c.key}
                  className={`tag ${visible.has(c.key) ? "tag-active" : ""}`}
                  onClick={() => toggleCol(c.key)}
                >
                  {visible.has(c.key) ? `× ${c.label}` : `+ ${c.label}`}
                </button>
              ))}
            </div>

            <div className="print-a4">
              {/* ✕ колонка ПЕРЕД № */}
              <table className="print-table" style={{ tableLayout: "fixed" }}>
                <colgroup>
                  <col className="no-print" style={{ width: `${DELETE_COL_W_PT}pt` }} /> {/* ✕ */}
                  <col style={{ width: `${INDEX_W_PT}pt` }} />                              {/* № */}
                  {cols.map((c) => (
                    <col key={c.key} style={{ width: `${(widthsPt[c.key] ?? 80)}pt` }} />
                  ))}
                </colgroup>

                <thead>
                  <tr>
                    <th className="no-print">×</th>
                    <th>№</th>
                    {cols.map((c) => <th key={c.key}>{c.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {dogs.map((d, i) => (
                    <tr key={d.id}>
                      <td className="no-print">
                        <button className="board-btn-ghost" onClick={() => onRemove(d.id)}>✕</button>
                      </td>
                      <td>{i + 1}</td>
                      {cols.map((c) => {
                        let v: React.ReactNode = "";
                        if (c.key === "name") v = d.name;
                        else if (c.key === "cage") v = d.cage || "—";
                        else if (c.key === "chip") v = d.chip || "—";
                        else if (c.key === "color") v = d.color || "—";
                        else if (c.key === "filters") v = (d.filters ?? []).join(", ");
                        else if (c.key === "info") v = d.info || "—";
                        return <td key={c.key}>{v}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              .print-area, .print-area * { visibility: visible !important; }
              .print-area { position: absolute; inset: 0; margin: 0; padding: 0; background: #fff; }
              .no-print { display: none !important; }

              .print-table { border-collapse: collapse; width: auto; table-layout: fixed; }
              .print-table th, .print-table td {
                border: 2px solid #000 !important;
                font-family: Helvetica, Arial, sans-serif;
                font-size: ${FONT_SIZE_PT}pt;
                padding: ${PADDING_PT}pt;
              }
              .print-table thead th { font-weight: 700; white-space: nowrap; }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
