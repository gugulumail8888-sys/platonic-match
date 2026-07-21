import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

// Supabase メール認証 / OAuth コールバック
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // プロバイダ側（Google/GoTrue）がトークン交換前にエラーを返したケース
  const providerError = searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    console.error("[auth/callback] provider error:", providerError);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          const email = encodeURIComponent(user.email ?? '');
          return NextResponse.redirect(`${origin}/register?google=1&email=${email}`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[auth/callback] exchangeCodeForSession error:", error.message);
  }

  // エラー時はログイン画面へ
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
