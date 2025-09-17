// components/board/useSearch.ts
"use client";
import { useMemo, useState } from "react";
import { Dog } from "./types";

export function useSearch(dogs: Dog[]) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const matchDogIds = useMemo(() => {
    if (!q) return new Set<string>();
    const set = new Set<string>();
    for (const d of dogs) {
      const chip = (d.chip || "").toLowerCase();
      const name = (d.name || "").toLowerCase();
      if (name.includes(q) || chip.includes(q)) set.add(d.id);
    }
    return set;
  }, [q, dogs]);

  const cagesWithMatches = useMemo(() => {
    if (!q) return new Set<string>();
    const cs = new Set<string>();
    for (const d of dogs) if (d.cage && matchDogIds.has(d.id)) cs.add(d.cage);
    return cs;
  }, [q, dogs, matchDogIds]);

  return { query, setQuery, q, matchDogIds, cagesWithMatches };
}
