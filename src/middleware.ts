import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { parseJstDateTime } from "@/lib/datetime";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── メンテナンスモードチェック（既存の認証チェックより前に実行） ──
  if (
    pathname !== '/maintenance' &&
    pathname !== '/login' &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next')
  ) {
    let isAdmin = false;
    const authCookie = request.cookies.get('auth')?.value;
    if (authCookie) {
      try {
        const auth = JSON.parse(decodeURIComponent(authCookie)) as { role?: string };
        isAdmin = auth.role === 'admin';
      } catch {
        // 不正な cookie は無視
      }
    }

    if (!isAdmin) {
      const admin = createAdminClient();
      const { data: settingsRows } = await admin
        .from('settings')
        .select('key, value')
        .in('key', ['maintenance_mode', 'maintenance_scheduled_start', 'maintenance_scheduled_end']);

      const settingsMap = Object.fromEntries((settingsRows ?? []).map((r) => [r.key, r.value]));

      const manualOn = settingsMap.maintenance_mode === 'true';

      let scheduledOn = false;
      const start = settingsMap.maintenance_scheduled_start;
      const end = settingsMap.maintenance_scheduled_end;
      if (start && end) {
        const now = Date.now();
        const startTime = parseJstDateTime(start).getTime();
        const endTime = parseJstDateTime(end).getTime();
        if (!isNaN(startTime) && !isNaN(endTime) && now >= startTime && now <= endTime) {
          scheduledOn = true;
        }
      }

      if (manualOn || scheduledOn) {
        return NextResponse.redirect(new URL('/maintenance', request.url));
      }
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  const authCookie = request.cookies.get('auth')?.value;

  // トップページ・API・静的アセットは常に通過
  if (
    pathname === '/' ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register')
  ) {
    return supabaseResponse;
  }

  if (authCookie) {
    try {
      const auth = JSON.parse(decodeURIComponent(authCookie)) as { role?: string };
      const isAdmin = auth.role === 'admin';

      // admin が /dashboard 配下にアクセス → /admin へ
      if (isAdmin && pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      // 一般会員が /admin 配下にアクセス → /dashboard へ
      if (!isAdmin && pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      // 不正な cookie は無視
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
