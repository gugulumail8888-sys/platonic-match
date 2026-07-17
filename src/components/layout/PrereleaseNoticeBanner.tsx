import { createClient } from "@/lib/supabase/server";

async function getPrereleaseNotice(): Promise<{ show: boolean }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "omiai_open")
    .maybeSingle();

  return { show: data?.value !== "true" };
}

export async function PrereleaseNoticeBanner() {
  const { show } = await getPrereleaseNotice();
  if (!show) return null;

  return (
    <div className="h-10 flex items-center justify-center bg-blue-600 text-white text-sm font-medium px-4 text-center">
      現在プレリリース期間中です。今は新規登録・プロフィール閲覧のみご利用いただけます。お見合い申請などの機能は近日公開予定です。
    </div>
  );
}
