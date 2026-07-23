import { createClient } from "@/lib/supabase/server";
import { parseJstDateTime } from "@/lib/datetime";

async function getPrereleaseNotice(): Promise<{ show: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["omiai_open", "maintenance_mode", "maintenance_scheduled_start", "maintenance_scheduled_end"]);

  if (error) {
    console.error("[PrereleaseNoticeBanner] settings取得に失敗:", error.message);
  }

  const settingsMap = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));

  // プレオープン待ち(メンテナンス予約が有効)の間は「新規登録・プロフィール閲覧のみ
  // ご利用いただけます」という案内自体が実態(登録もできない)と矛盾するため、
  // その間はこのバナーを表示しない(2026/7/23、ユーザー指摘「今は新規登録・
  // プロフィール閲覧のみご利用いただけますはおかしい」への対応)
  const manualOn = settingsMap.maintenance_mode === "true";
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
  if (manualOn || scheduledOn) return { show: false };

  return { show: settingsMap.omiai_open !== "true" };
}

export async function PrereleaseNoticeBanner() {
  const { show } = await getPrereleaseNotice();
  if (!show) return null;

  return (
    <div className="min-h-10 py-2 flex items-center justify-center bg-blue-600 text-white text-sm font-medium px-4 text-center">
      現在プレリリース期間中です。今は新規登録・プロフィール閲覧のみご利用いただけます。お見合い申請などの機能は近日公開予定です。
    </div>
  );
}
