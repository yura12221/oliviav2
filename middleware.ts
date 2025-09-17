// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Головне — передати реальні get/set/remove, а типи заглушити
      cookies: {
        get(name: string) {
          const c = req.cookies.get(name);
          return c ? c.value : undefined;
        },
        getAll() {
          return req.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
        },
        set(name: string, value: string, options?: {
          path?: string; domain?: string; maxAge?: number; expires?: Date;
          sameSite?: "lax" | "strict" | "none"; httpOnly?: boolean; secure?: boolean;
        }) {
          res.cookies.set({ name, value, ...(options || {}) });
        },
        remove(name: string, options?: {
          path?: string; domain?: string; expires?: Date; sameSite?: "lax" | "strict" | "none";
          httpOnly?: boolean; secure?: boolean;
        }) {
          res.cookies.set({ name, value: "", ...(options || {}) });
        },
      } as any, // <-- ключ: глушимо розбіжності типів між версіями
    }
  );

  // приклад: за потреби можна робити охорону маршрутів
  // const { data: { user } } = await supabase.auth.getUser();
  // if (!user) return NextResponse.redirect(new URL("/login", req.url));

  return res;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"], // всі сторінки, крім статичних
};
