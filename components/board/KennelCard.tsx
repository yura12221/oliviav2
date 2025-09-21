// components/board/KennelCard.tsx
"use client";
import React from "react";
import DogChip from "./DogChip";
import { CS_COLS, ROW_H_CS, PAD } from "./types";
import type { Dog, Kennel } from "./types";

type Props = {
  k: Kennel;
  bounds: { minX: number; minY: number };
  dogsHere: Dog[];
  dim: boolean;
  editMode: boolean;
  hoverCage: string | null;
  selectedDogId: string | null;
  picked: Set<string>;
  matchDogIds: Set<string>;
  onMoveSelectedTo(cage: string): void;
  onKennelDragOver(e: React.DragEvent, k: Kennel): void;
  onKennelDrop(e: React.DragEvent, k: Kennel): void;
  onDogClick(d: Dog, e: React.MouseEvent): void;
  onDogContext(d: Dog, e: React.MouseEvent): void;
  onDogDragStart?(e: React.DragEvent, d: Dog): void;
  onDogDragEnd?(): void;
  draggingId: string | null;
};

export default function KennelCard({
  k, bounds, dogsHere, dim, editMode, hoverCage, selectedDogId, picked, matchDogIds,
  onMoveSelectedTo, onKennelDragOver, onKennelDrop, onDogClick, onDogContext, onDogDragStart, onDogDragEnd, draggingId
}: Props) {
  const left = k.x - bounds.minX + PAD;
  const top  = k.y - bounds.minY + PAD;

  const isCS = (k.cage || "").toLowerCase() === "cs";

  // Для cs робимо фіксовану висоту; скрол робимо В СТОРОНУ (горизонтальний)
  const rowsForCS = Math.ceil(dogsHere.length / CS_COLS);
  const dynH = isCS ? k.h : k.h; // залишаємо як у тебе (скрол всередині)

  const KennelInner: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div
      // ⮕ цей клас використовуємо у TransformWrapper.excluded (в Board.tsx)
      className={isCS ? "kennel-scroll px-2 py-1" : "px-2"}
      style={
        isCS
          ? ({
              position: "absolute",
              inset: 0,
              padding: "6px 10px",
              display: "grid",

              // 🟦 головне: кладемо елементи ВНИЗ, потім у наступну колонку
              gridAutoFlow: "column",
              gridTemplateRows: `repeat(10, ${ROW_H_CS}px)`, // 11 рядків у колонці
              gridAutoColumns: "max-content",                 // ширина колонок по вмісту

              justifyContent: "start",
              alignContent: "start",
              justifyItems: "start",
              alignItems: "center",
              gap: 6,

              // 🟦 лише горизонтальний скрол (праворуч), вертикальний відключаємо
              overflowX: "auto",
              overflowY: "hidden",

              // 🟦 на мобільних дозволяємо лише пан по осі X
              touchAction: "pan-x",
              WebkitOverflowScrolling: "touch",
            } as React.CSSProperties)
          : ({
              position: "absolute",
              inset: 0,
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
              alignContent: "center",
              justifyContent: "center",
            } as React.CSSProperties)
      }
      onDragOver={(e) => onKennelDragOver(e, k)}
      onDrop={(e) => onKennelDrop(e, k)}
      // Запобігаємо передачі жестів пан/зум угору (дошці) під час скролу всередині CS
      onWheel={(e) => { if (isCS) e.stopPropagation(); }}
      onTouchMove={(e) => { if (isCS) e.stopPropagation(); }}
    >
      {children}
    </div>
  );

  return (
    <div
      className={`kennel-card ${isCS ? "kennel-cs" : ""}`}
      style={{
        position: "absolute",
        left, top, width: k.w, height: dynH,
        background: "linear-gradient(145deg, #1e293b, #0f172a)",
        border: "1px solid #334155", borderRadius: 16,
        boxShadow: "0 3px 6px rgba(0,0,0,.45)",
        overflow: "hidden", // обгортка ховає, скрол робить внутрішній контейнер
        outline: editMode && hoverCage === k.cage ? "2px solid #38bdf8" : undefined,
        outlineOffset: editMode && hoverCage === k.cage ? "-2px" : undefined,
        opacity: dim ? 0.25 : 1,
        transition: "opacity .15s ease",
      }}
      onClick={() => {
        if (!editMode || !selectedDogId) return;
        onMoveSelectedTo(k.cage);
      }}
      onDragOver={(e) => onKennelDragOver(e, k)}
      onDrop={(e) => onKennelDrop(e, k)}
    >
      <div
        className="kennel-code"
        style={{
          position: "absolute",
          top: 4,
          left: 6,
          fontSize: 10,
          color: "#94a3b8",
          opacity: 0.9,
          pointerEvents: "none"
        }}
      >
        {k.cage}
      </div>

      <KennelInner>
        {dogsHere.length ? (
          dogsHere.map((d) => (
            <DogChip
              key={d.id}
              dog={d}
              isListPicked={picked.has(d.id)}
              isSearchHit={matchDogIds.has(d.id)}
              selected={selectedDogId === d.id}
              isCS={isCS}
              dragging={draggingId === d.id}
              editMode={editMode}
              onClick={(e) => onDogClick(d, e)}
              onContextMenu={(e) => onDogContext(d, e)}
              onDragStart={(e) => onDogDragStart?.(e, d)}
              onDragEnd={() => onDogDragEnd?.()}
            />
          ))
        ) : (
          <div className="text-slate-600 text-xs pointer-events-none">—</div>
        )}
      </KennelInner>
    </div>
  );
}
