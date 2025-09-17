// components/board/DogChip.tsx
"use client";
import React from "react";
import AutoFitName from "./AutoFitName";
import { baseNameSize } from "./types";

type Props = {
  dog: any;
  isListPicked: boolean;
  isSearchHit: boolean;
  selected: boolean;
  isCS: boolean;
  dragging: boolean;
  editMode: boolean;
  onClick(e: React.MouseEvent): void;
  onContextMenu(e: React.MouseEvent): void;
  onDragStart?(e: React.DragEvent): void;
  onDragEnd?(): void;
};

export default function DogChip({
  dog, isListPicked, isSearchHit, selected, isCS, dragging, editMode,
  onClick, onContextMenu, onDragStart, onDragEnd
}: Props) {
  return (
    <div
      className={`dog-chip ${isSearchHit ? "spot-dog" : ""} ${isListPicked ? "picked-dog" : ""}`}
      data-id={dog.id}
      role="button"
      draggable={editMode}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        opacity: dragging ? 0.35 : 1,
        pointerEvents: "auto",
        cursor: editMode ? "grab" : "default",
        outline: (dog as any).sovany ? "2px solid #ef4444" : selected ? "2px solid #f59e0b" : "none",
        borderRadius: 10, padding: "2px 6px",
        background: selected ? "rgba(245,158,11,.15)" : "rgba(255,255,255,.04)",
        maxWidth: "100%",
        height: isCS ? 26 - 2 : undefined,
        display: "flex", alignItems: "center",
      }}
    >
      <AutoFitName name={dog.name} color={dog.color} baseSize={baseNameSize} />
    </div>
  );
}
