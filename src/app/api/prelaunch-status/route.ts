import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { parseJstDateTime } from '@/lib/datetime';

export const dynamic = 'force-dynamic';

// /lpページ用: メンテナンス予約(src/proxy.tsと同じロジック)が現在有効かどうかと、
// 終了予定日時を返す。lpは唯一メンテナンスリダイレクトの対象外ページのため、
// このAPIの結果をもとに「◯月◯日オープン予定」の案内バナーを出し分ける
// (2026/7/23、ユーザー依頼「lpにメンテナンス中等のメッセージがない」への対応)
export async function GET() {
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

  const active = manualOn || scheduledOn;

  let endLabel = '';
  if (active && end) {
    const endDate = parseJstDateTime(end);
    if (!isNaN(endDate.getTime())) {
      endLabel = new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      }).format(endDate);
    }
  }

  return NextResponse.json({ active, endLabel });
}
