// components/CanvasWindow.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = { children: React.ReactNode };

export default function CanvasWindow({ children }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className="canvas-window"
      style={{
        position: "fixed",
        inset: "var(--toolbar-h) 0 0 0", // під шапкою
        zIndex: 40,                      // тулбар вище (z:50), модалки ще вище (z:60)
        overflow: "hidden",
        touchAction: "none",
        background: "var(--bg)",
        // Додатковий страховий шар проти перехоплення жестів
        overscrollBehavior: "contain" as any,
        WebkitOverflowScrolling: "auto" as any,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
