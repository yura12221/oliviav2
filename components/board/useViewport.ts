// components/board/useViewport.ts
"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PAD } from "./types";

/**
 * Стежить за розмірами контейнера (в’юпорту)
 * — НІЧОГО не знає про режими/редагування і не блокує зум/скрол.
 */
export function useViewport() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [vp, setVp] = useState({ w: 1200, h: 800 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      setVp({
        w: Math.max(200, r.width),
        h: Math.max(200, r.height),
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { containerRef, vp, setVp };
}

/**
 * Рахує межі «площини» дошки на основі вольєрів.
 */
export function useBounds(
  kennels: { x: number; y: number; w: number; h: number }[]
) {
  return useMemo(() => {
    if (!kennels.length) {
      return { minX: 0, minY: 0, width: 1200, height: 800 };
    }
    const minX = Math.min(...kennels.map((k) => k.x));
    const minY = Math.min(...kennels.map((k) => k.y));
    const maxX = Math.max(...kennels.map((k) => k.x + k.w));
    const maxY = Math.max(...kennels.map((k) => k.y + k.h));
    return {
      minX,
      minY,
      width: maxX - minX + PAD * 2,
      height: maxY - minY + PAD * 2,
    };
  }, [kennels]);
}

/**
 * Обчислює «кращий» масштаб для fit-to-screen.
 */
export function useComputeFit(
  vp: { w: number; h: number },
  bounds: { width: number; height: number }
) {
  return useCallback(() => {
    const zx = (vp.w - 24) / bounds.width;
    const zy = (vp.h - 24) / bounds.height;
    return Math.max(0.3, Math.min(3, Math.min(zx, zy)));
  }, [vp, bounds]);
}
