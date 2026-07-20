import { createClient } from "@/lib/supabase/server";
import { parseJstDateTime } from "@/lib/datetime";

function formatDateTime(iso: string): string {
  const d = parseJstDateTime(iso);
  if (isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('month')}月${get('day')}日 ${get('hour')}:${get('minute')}`;
}

async function getMaintenanceNotice(): Promise<{ show: boolean; start: string; end: string }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["maintenance_notice_enabled", "maintenance_scheduled_start", "maintenance_scheduled_end"]);

  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));

  const enabled = map.maintenance_notice_enabled === "true";
  const start = map.maintenance_scheduled_start ?? '';
  const end = map.maintenance_scheduled_end ?? '';

  if (!enabled || !start || !end) return { show: false, start: '', end: '' };

  const now = Date.now();
  const startTime = parseJstDateTime(start).getTime();
  if (isNaN(startTime) || now >= startTime) return { show: false, start: '', end: '' };

  return { show: true, start, end };
}

export async function MaintenanceNoticeBanner() {
  const { show, start, end } = await getMaintenanceNotice();
  if (!show) return null;

  return (
    <div className="min-h-10 py-2 flex items-center justify-center bg-yellow-500 text-zinc-900 text-sm font-medium px-4 text-center">
      {formatDateTime(start)} 〜 {formatDateTime(end)} メンテナンスを予定しています
    </div>
  );
}
