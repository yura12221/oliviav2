// lib/roles.ts

/** Єдине джерело прав/ролей у застосунку */
export type Role = 'newbie' | 'reader' | 'editor' | 'admin' | 'superadmin';

/** Упорядкований список — зручно для сортування/порівнянь */
export const ROLE_ORDER: Role[] = ['newbie', 'reader', 'editor', 'admin', 'superadmin'];

/* UA: допоміжне — прибрати діакритики (ő, ó, ú, ű, …), щоб "szerkesztő" → "szerkeszto" */
function deaccent(s: string): string {
  try {
    // Працює у сучасних рушіях
    return s.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  } catch {
    // Фолбек (грубий), якщо Unicode RegExp недоступний
    return s
      .replace(/[á]/g, 'a')
      .replace(/[é]/g, 'e')
      .replace(/[í]/g, 'i')
      .replace(/[óöő]/g, 'o')
      .replace(/[úüű]/g, 'u')
      .replace(/[ÁÉÍÓÖŐÚÜŰ]/g, (m) => m.toLowerCase());
  }
}

/** Мапа синонімів/аліасів з БД → наш канонічний union
 *  UA: ДОДАНО угорські варіанти, щоб не ламати логіку інтерфейсу.
 */
const ALIASES: Record<string, Role> = {
  // англ/технічні
  'super_admin': 'superadmin',
  'super-admin': 'superadmin',
  'owner': 'superadmin',
  'viewer': 'reader',
  'read': 'reader',
  'reader': 'reader',
  'edit': 'editor',
  'editor': 'editor',
  'admin': 'admin',
  'newbie': 'newbie',
  'staff': 'editor',

  // угорські (без/з діакритиками; після deaccent обидва збігаються)
  'szuperadmin': 'superadmin',
  'szerkeszto': 'editor',   // szerkesztő
  'olvaso': 'reader',       // olvasó
  'uj': 'newbie',           // új
};

/** Нормалізація значення ролі з БД -> до нашого union-типу */
export function normalizeRole(raw?: string | null): Role {
  const r0 = deaccent((raw ?? 'newbie').trim().toLowerCase());

  // спочатку аліаси
  if (ALIASES[r0]) return ALIASES[r0];

  // якщо значення вже збігається з нашим union
  if (ROLE_ORDER.includes(r0 as Role)) return r0 as Role;

  // спробуємо прибрати підкреслення/дефіси/пробіли (наприклад 'super_admin')
  const compact = r0.replace(/[-_ ]+/g, '');
  if (ALIASES[compact]) return ALIASES[compact];

  return 'newbie';
}

/** Хто може редагувати/додавати собак, drag&drop тощо */
export function canEdit(role: Role): boolean {
  return role === 'editor' || role === 'admin' || role === 'superadmin';
}

/** Хто може керувати ролями користувачів */
export function canManageRoles(role: Role): boolean {
  return role === 'admin' || role === 'superadmin';
}

/** Лейбл для показу в інтерфейсі (угорською) */
export function roleLabel(role: Role): string {
  switch (role) {
    case 'newbie': return 'ÚJ';
    case 'reader': return 'OLVASÓ';
    case 'editor': return 'SZERKESZTŐ';
    case 'admin': return 'ADMIN';
    case 'superadmin': return 'SZUPERADMIN';
  }
}
