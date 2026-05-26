import { createBrowserClient } from "@supabase/ssr";

// ==========================================
// クライアントサイド用 Supabase クライアント
// React Native でも同じパターンで使用可能
// ==========================================
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
