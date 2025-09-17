// lib/supabaseClient.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
if (typeof window !== 'undefined') {
  (window as any).__supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return createBrowserClient(url, anon, {
    db: { schema: "public" },
  });
}

// Синглтон для більшості компонентів (зворотна сумісність)
export const supabase = createClient();

// Можна також імпортувати за замовчуванням
export default createClient;
