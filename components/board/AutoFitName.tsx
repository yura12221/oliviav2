// components/board/AutoFitName.tsx
"use client";
import { useEffect, useRef, useState } from "react";

export default function AutoFitName({
  name,
  color,
  baseSize,
}: { name: string; color: string | null; baseSize: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(baseSize);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fit = () => {
      const parent = el.parentElement;
      if (!parent) return;
      const maxW = Math.max(0, parent.clientWidth - 6);
      let f = Math.max(6, Math.round(baseSize));
      el.style.fontSize = f + "px";
      while (el.scrollWidth > maxW && f > 8) { f -= 2; el.style.fontSize = f + "px"; }
      while (el.scrollWidth > maxW && f > 6) { f -= 1; el.style.fontSize = f + "px"; }
      setSize(f);
    };

    fit();
    const parent = el.parentElement;
    const ro = parent ? new ResizeObserver(fit) : null;
    if (parent && ro) ro.observe(parent);
    return () => ro?.disconnect();
  }, [name, baseSize]);

  return (
    <div
      ref={ref}
      className="dog-name leading-tight"
      style={{ color: color || "#cbd5e1", fontSize: size }}
    >
      {name}
    </div>
  );
}
