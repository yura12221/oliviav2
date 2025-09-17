// components/board/useBoardData.ts
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Dog, Kennel, capacityFor } from "./types";

export function useBoardData() {
  const [kennels, setKennels] = useState<Kennel[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const [kres, dres] = await Promise.all([
      supabase.from("kennels").select("cage,x,y,w,h"),
      supabase.from("dogs").select("*"),
    ]);
    if (kres.error) setError(kres.error.message);
    if (dres.error) setError(dres.error.message);
    setKennels((kres.data || []) as Kennel[]);
    setDogs((dres.data || []) as Dog[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const dogsByCage = useMemo(() => {
    const map = new Map<string, Dog[]>();
    for (const d of dogs) {
      if (!d.cage) continue;
      if (!map.has(d.cage)) map.set(d.cage, []);
      map.get(d.cage)!.push(d);
    }
    for (const [k, arr] of map) {
      arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.name.localeCompare(b.name));
      map.set(k, arr);
    }
    return map;
  }, [dogs]);

  const updateDogCage = async (dogId: string, newCage: string | null) => {
    const { error: upErr } = await supabase.from("dogs").update({ cage: newCage }).eq("id", dogId);
    if (upErr) throw upErr;
  };

  const tryMoveDog = async (
    dogId: string,
    toCage: string,
    fromCage: string | null,
    setDogsLocal: React.Dispatch<React.SetStateAction<Dog[]>>,
    onFailReload: () => Promise<void>,
    setErrorMsg: (s: string | null) => void
  ) => {
    const capacity = capacityFor(toCage);
    const current = dogsByCage.get(toCage) ?? [];
    if (current.length >= capacity) {
      setErrorMsg(`Вольєр ${toCage} заповнено (${capacity}).`);
      setTimeout(() => setErrorMsg(null), 1600);
      return false;
    }
    setDogsLocal((prev) => prev.map((d) => (d.id === dogId ? { ...d, cage: toCage } : d)));
    try { await updateDogCage(dogId, toCage); return true; }
    catch { await onFailReload(); return false; }
  };

  return { kennels, dogs, setDogs, loading, error, setError, load, dogsByCage, tryMoveDog };
}
