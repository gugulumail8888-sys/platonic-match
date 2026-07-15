import { NextResponse } from 'next/server';
import {
  requireAdminUser, csvFilename, csvBom, toCsvRow, formatDateTime,
} from '@/lib/admin-export';

export const dynamic = 'force-dynamic';

const MET_TIMING_LABELS: Record<string, string> = {
  '1month': '1ヶ月以内',
  '3months': '3ヶ月以内',
  '6months': '6ヶ月以内',
  '1year': '1年以内',
  'over1year': '1年以上',
};

const TRIGGER_LABELS: Record<string, string> = {
  ai: 'AIおすすめ',
  search: '会員検索',
  omiai: 'お見合い申請',
  received: 'お見合い受信',
  other: 'その他',
};

const CSV_HEADERS = [
  'ユーザーID', 'ニックネーム', '実施日時', '出会い時期', 'きっかけ', '満足度', 'メッセージ', '確認済み',
];

export async function GET() {
  const result = await requireAdminUser();
  if ('error' in result) return result.error;
  const { admin } = result;

  const { data, error } = await admin
    .from('marriage_reports')
    .select('user_id, created_at, met_timing, trigger, satisfaction, message, is_confirmed, profiles!marriage_reports_user_id_fkey(nickname)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let csv = csvBom() + toCsvRow(CSV_HEADERS);
  for (const r of data ?? []) {
    csv += toCsvRow([
      r.user_id,
      (r.profiles as unknown as { nickname: string } | null)?.nickname ?? '',
      formatDateTime(r.created_at),
      MET_TIMING_LABELS[r.met_timing as string] ?? r.met_timing ?? '',
      TRIGGER_LABELS[r.trigger as string] ?? r.trigger ?? '',
      r.satisfaction ?? '',
      r.message ?? '',
      r.is_confirmed ? '確認済' : '未確認',
    ]);
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${csvFilename('marriage_reports')}"`,
    },
  });
}
