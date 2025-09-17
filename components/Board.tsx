// components/Board.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import { Dog, Kennel, isInactiveKennel } from "./board/types";
import { useBoardData } from "./board/useBoardData";
import { useViewport, useBounds, useComputeFit } from "./board/useViewport";
import { useSearch } from "./board/useSearch";

import BoardToolbar from "./board/BoardToolbar";
import KennelCard from "./board/KennelCard";

import AddDogModal, { DogRecord } from "./AddDogModal";
import DogDetailsModal, { DogDetails } from "./DogDetailsModal";
import FilterListModal from "./FilterListModal";
import PrintPreviewModal, { PrintDog } from "./PrintPreviewModal";

/* ===================== helpers for reliable centering ===================== */

function waitFor<T>(
  cond: () => T | null | undefined,
  tries = 80,
  delay = 25
): Promise<T | null> {
  return new Promise((resolve) => {
    let left = tries;
    const tick = () => {
      const v = cond();
      if (v) return resolve(v);
      if (--left <= 0) return resolve(null);
      setTimeout(tick, delay);
    };
    tick();
  });
}

async function waitReady(
  twRef: React.MutableRefObject<any>,
  root: HTMLElement
) {
  const ok = await waitFor(() => (twRef.current ? twRef.current : null));
  const content = await waitFor(
    () => root.querySelector("[data-board-content]") as HTMLElement | null
  );
  return ok && content ? true : false;
}

function centerChip(
  root: HTMLElement,
  chip: HTMLElement,
  twRef: React.MutableRefObject<any>
) {
  const content = root.querySelector("[data-board-content]") as HTMLElement | null;
  if (!content || !twRef.current) return;

  // позиція чіпа відносно контенту
  let x = 0,
    y = 0;
  let cur: HTMLElement | null = chip;
  while (cur && cur !== content) {
    x += cur.offsetLeft;
    y += cur.offsetTop;
    cur = cur.offsetParent as HTMLElement | null;
  }
  const centerX = x + chip.offsetWidth / 2;
  const centerY = y + chip.offsetHeight / 2;

  const state = twRef.current.getTransformState?.() || { scale: 1 };
  let scale = state.scale ?? 1;

  // тримаємо ~100%: міняємо лише якщо дуже збито
  if (scale < 0.9 || scale > 1.1) scale = 1;

  // зсув ВГОРУ на 30% висоти екрана
  const verticalBias = -root.clientHeight * 0.3;

  const nextX = root.clientWidth / 2 - centerX * scale;
  const nextY = root.clientHeight / 2 - centerY * scale + verticalBias;

  twRef.current.setTransform(nextX, nextY, scale, 0);
}

/* ======================================================================== */

export default function Board() {
  // data
  const { kennels, dogs, setDogs, loading, error, setError, load, dogsByCage, tryMoveDog } =
    useBoardData();

  // ui state
  const [editMode, setEditMode] = useState(false);
  const [dragDogId, setDragDogId] = useState<string | null>(null);
  const [hoverCage, setHoverCage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsDog, setDetailsDog] = useState<DogDetails | null>(null);

  const [pickOpen, setPickOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  // тренери (локальна пам'ять)
  const [trainers, setTrainers] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("trainers") || "[]");
    } catch {
      return [];
    }
  });
  const [trainerName, setTrainerName] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("trainers", JSON.stringify(trainers));
    } catch {}
  }, [trainers]);

  const addTrainer = (name: string) => {
    const t = name.trim();
    if (!t) return;
    setTrainers((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setTrainerName(t);
  };

  const [picked, setPicked] = useState<Set<string>>(new Set());

  // viewport + transforms
  const { containerRef, vp } = useViewport();
  const bounds = useBounds(kennels);
  const twRef = useRef<any>(null);
  const computeFit = useComputeFit(vp, bounds);

  // search
  const { query, setQuery, q, matchDogIds, cagesWithMatches } = useSearch(dogs);

  /* ======= автофокус/автопозиціювання на першому результаті пошуку ======= */
  useEffect(() => {
    if (!q || matchDogIds.size === 0) return;

    let cancelled = false;
    (async () => {
      const firstId = Array.from(matchDogIds)[0];
      const root = containerRef.current!;
      if (!root) return;

      // 1) чекаємо готовність TransformWrapper та контенту
      const ready = await waitReady(twRef, root);
      if (!ready || cancelled) return;

      // 2) чекаємо появу DOM-ноди чіпа
      const chip = await waitFor(() =>
        root.querySelector<HTMLElement>(`.dog-chip[data-id="${firstId}"]`) ||
        root.querySelector<HTMLElement>(`[data-chip-id="${firstId}"]`)
      );
      if (!chip || cancelled) return;

      try {
        const currentScale = twRef.current.getTransformState?.().scale ?? 1;
        const minScale = currentScale < 0.9 || currentScale > 1.1 ? 1 : currentScale;

        if (typeof twRef.current.zoomToElement === "function") {
          twRef.current.zoomToElement(chip, minScale, 250);
          // після анімації — точне позиціювання із зсувом угору
          setTimeout(() => !cancelled && centerChip(root, chip, twRef), 270);
        } else {
          // fallback: одразу центр
          centerChip(root, chip, twRef);
        }
      } catch {
        // no-op
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [q, matchDogIds]);
  /* ====================================================================== */

  // список для друку — виключаємо собак із «неактивних» вольєрів
  const pickedDogs: PrintDog[] = useMemo(() => {
    const byId = new Map(dogs.map((d) => [d.id, d] as const));
    return Array.from(picked)
      .map((id) => byId.get(id))
      .filter((d): d is Dog => !!d && !isInactiveKennel(d.cage))
      .map((d) => ({
        id: d.id,
        name: d.name,
        cage: d.cage,
        chip: d.chip ?? undefined,
        color: d.color ?? undefined,
        filters: d.filters ?? undefined,
        info: d.info ?? undefined,
      }));
  }, [picked, dogs]);

  const openDogDetails = (d: Dog) => {
    setDetailsDog({
      id: d.id,
      name: d.name,
      chip: d.chip ?? null,
      info: d.info ?? null,
      parents: d.parents ?? null,
      note: (d as any).note ?? null,
      color: d.color ?? null,
      second_color: (d as any).second_color ?? null,
      filters: Array.isArray(d.filters) ? (d.filters as string[]) : [],
      sovany: (d as any).sovany ?? false,
      cage: d.cage ?? null,
      position: (d as any).position ?? null,
      created_at: d.created_at,
      updated_at: d.updated_at,
    });
    setDetailsOpen(true);
  };

  const handleDogClick = (d: Dog, e: React.MouseEvent) => {
    e.stopPropagation();

    // подвійний клік завжди відкриває картку (навіть у «неактивних»)
    if (e.detail === 2) {
      openDogDetails(d);
      return;
    }

    // у режимі редагування дозволяємо вибір для переміщення
    if (editMode) {
      setSelectedDogId((p) => (p === d.id ? null : d.id));
      return;
    }

    // у звичайному режимі — НЕ додаємо у вибрані, якщо вольєр «неактивний»
    if (isInactiveKennel(d.cage)) return;

    const s = new Set(picked);
    s.has(d.id) ? s.delete(d.id) : s.add(d.id);
    setPicked(s);
  };

  // дозволяємо drag&drop у будь-який вольєр (щоб повернути на ферму)
  const onKennelDragOver = (ev: React.DragEvent, k: Kennel) => {
    if (!editMode) return;
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "move";
    setHoverCage(k.cage);
  };

  const onKennelDrop = async (ev: React.DragEvent, target: Kennel) => {
    if (!editMode) return;
    ev.preventDefault();
    setHoverCage(null);
    const payload = ev.dataTransfer.getData("application/json");
    if (!payload) return;
    const { dogId, fromCage } = JSON.parse(payload) as {
      dogId: string;
      fromCage: string | null;
    };
    setSaving(true);
    await tryMoveDog(dogId, target.cage, fromCage, setDogs, load, setError);
    setSaving(false);
    setDragDogId(null);
  };

  const onDogDragStart = (e: React.DragEvent, d: Dog) => {
    if (!editMode || !d.id) return;
    setDragDogId(d.id);
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({ dogId: d.id, fromCage: d.cage || null })
    );
    e.dataTransfer.effectAllowed = "move";
    const g = document.createElement("div");
    g.style.position = "absolute";
    g.style.opacity = "0";
    document.body.appendChild(g);
    e.dataTransfer.setDragImage(g, 0, 0);
  };

  const resetSelection = () => {
    setPicked(new Set());
    setQuery("");
    setSelectedDogId(null);
    setHoverCage(null);
  };
  const toggleMode = () => {
    setEditMode((v) => !v);
    setSelectedDogId(null);
    setHoverCage(null);
  };

  return (
    <div className="board-page">
      <BoardToolbar
        zoomOut={() => twRef.current?.zoomOut(0.2, 200)}
        zoomIn={() => twRef.current?.zoomIn(0.2, 200)}
        fit={() => twRef.current?.setTransform(0, 0, computeFit(), 200)}
        reset100={() => twRef.current?.setTransform(0, 0, 1, 200)}
        query={query}
        setQuery={setQuery}
        editMode={editMode}
        toggleMode={toggleMode}
        resetSelection={resetSelection}
        openFilters={() => setPickOpen(true)}
        openPrint={() => setPrintOpen(true)}
        openAdd={() => setAddOpen(true)}
        pickedCount={picked.size}
        saving={saving}
      />

      <div className="board-content">
        <div
          ref={containerRef}
          className="board-viewport overflow-hidden border border-slate-800 rounded-lg"
          onDragOver={(e) => editMode && e.preventDefault()}
          onDrop={() => {
            setHoverCage(null);
            setDragDogId(null);
          }}
          onContextMenuCapture={(e) => {
            const t = e.target as HTMLElement | null;
            const chip = t?.closest<HTMLElement>(".dog-chip[data-id]");
            if (!chip) return;
            const d = dogs.find((x) => x.id === chip.dataset.id);
            if (!d) return;
            e.preventDefault();
            e.stopPropagation();
            openDogDetails(d);
          }}
        >
          <TransformWrapper
  ref={twRef}
  minScale={0.3}
  maxScale={3}
  initialScale={computeFit()}
  centerOnInit
  limitToBounds={false}
  // можна лишити, навіть якщо версія без excluded — нічого не зламає
  wheel={{ step: 0.1, disabled: false, wheelDisabled: false, touchPadDisabled: false, excluded: ["kennel-scroll"] }}
  pinch={{ disabled: false, excluded: ["kennel-scroll"] }}
  panning={{ disabled: !!dragDogId, velocityDisabled: true, excluded: ["kennel-scroll"] }}
  doubleClick={{ disabled: true }}
  
>
  <TransformComponent
       // 👇 це ВАЖЛИВО для пану/зуму на мобільних
    wrapperStyle={{ touchAction: "none" as any }}
    contentStyle={{ touchAction: "none" as any }}
   
    
    
            >
              <div
                data-board-content
                style={{
                  width: bounds.width,
                  height: bounds.height,
                  position: "relative",
                  background: "#0b1220",
                }}
              >
                {kennels.map((k) => {
                  const dogsHere = dogsByCage.get(k.cage) ?? [];
                  const kennelHasMatch = q ? cagesWithMatches.has(k.cage) : false;
                  const dimOthers = q.length > 0 && !kennelHasMatch;
                  const inactive = isInactiveKennel(k.cage);

                  return (
                    <KennelCard
                      key={k.cage}
                      k={k}
                      bounds={{ minX: bounds.minX, minY: bounds.minY }}
                      dogsHere={dogsHere}
                      dim={dimOthers || inactive} // лише візуально приглушаємо
                      editMode={editMode}
                      hoverCage={hoverCage}
                      selectedDogId={selectedDogId}
                      picked={picked}
                      matchDogIds={matchDogIds}
                      onMoveSelectedTo={async (cage) => {
                        if (!selectedDogId) return;
                        const moving = dogs.find((d) => d.id === selectedDogId);
                        if (!moving) return;
                        setSaving(true);
                        await tryMoveDog(
                          moving.id,
                          cage,
                          moving.cage || null,
                          setDogs,
                          load,
                          setError
                        );
                        setSaving(false);
                        setSelectedDogId(null);
                      }}
                      onKennelDragOver={onKennelDragOver}
                      onKennelDrop={onKennelDrop}
                      onDogClick={handleDogClick}
                      onDogContext={(d, e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openDogDetails(d);
                      }}
                      onDogDragStart={onDogDragStart}
                      onDogDragEnd={() => {
                        setDragDogId(null);
                        setHoverCage(null);
                      }}
                      draggingId={dragDogId}
                    />
                  );
                })}
              </div>
            </TransformComponent>
          </TransformWrapper>
        </div>
      </div>

      {/* Modals */}
      <AddDogModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(d: DogRecord) => setDogs((prev) => [d as any as Dog, ...prev])}
      />
      <DogDetailsModal
        open={detailsOpen}
        dog={detailsDog}
        onClose={() => setDetailsOpen(false)}
        onDeleted={(id) => {
          const s = new Set(picked);
          s.delete(id);
          setPicked(s);
          setSelectedDogId((p) => (p === id ? null : p));
          setDetailsDog(null);
          load();
        }}
        onUpdated={() => load()}
      />
      <FilterListModal
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        onApply={(ids) => {
          // не додаємо собак з «неактивних» вольєрів у вибір
          const allowed = ids.filter((id) => {
            const d = dogs.find((x) => x.id === id);
            return d && !isInactiveKennel(d.cage);
          });
          const s = new Set(picked);
          allowed.forEach((id) => s.add(id));
          setPicked(s);
        }}
      />
      <PrintPreviewModal
        open={printOpen}
        dogs={pickedDogs}
        trainerName={trainerName}
        setTrainerName={setTrainerName}
        trainers={trainers}
        onAddTrainer={addTrainer}
        onClose={() => setPrintOpen(false)}
        onRemove={(id) => {
          const s = new Set(picked);
          s.delete(id);
          setPicked(s);
        }}
      />
    </div>
  );
}
