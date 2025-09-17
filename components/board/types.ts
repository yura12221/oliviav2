// components/board/types.ts
export type Kennel = { cage: string; x: number; y: number; w: number; h: number };

export type Dog = {
  id: string;
  name: string;
  color: string | null;
  cage: string | null;
  chip?: string | null;
  info?: string | null;
  parents?: string | null;
  filters?: string[] | null;
  sovany?: boolean;
  note?: string | null;
  second_color?: string | null;
  position?: number | null;
  created_at?: string;
  updated_at?: string;
};

export const PAD = 60;
export const CS_COLS = 10;
export const ROW_H_CS = 26;
export const baseNameSize = 18;

export const capacityFor = (cage?: string | null) => {
  const id = (cage || '').toLowerCase();
  if (id === 'cs') return 70;
  if (id === "átmeneti hely") return 150;     // ← твій новий вольєр
  return 2;
};
// Нормалізатор рядків: прибирає діакритику, пробіли, нижній регістр
const norm = (s?: string | null) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

// Вольєри, які мають бути «неактивними»
export const INACTIVE_KENNELS = new Set<string>([
  'atmeneti hely',  // ← це відповідає "átmeneti hely"
  // 'h/1', 'cs'    // додай ще, якщо треба
]);

export const isInactiveKennel = (cage?: string | null) =>
  INACTIVE_KENNELS.has(norm(cage));












