import { NextResponse } from 'next/server';
import {
  requireAdminUser, csvFilename, csvBom, toCsvRow, formatDateTime,
} from '@/lib/admin-export';

export const dynamic = 'force-dynamic';

const CSV_HEADERS = [
  'ユーザーID', 'ニックネーム', '実施日時', '満足度', 'お相手印象', '再会希望', 'サービス満足度', 'コメント', '確認済み',
];

// 画面表示(src/app/admin/surveys/page.tsx)と表記を統一するための日本語訳マップ
const IMPRESSION_LABELS: Record<string, string> = { good: '良い', normal: '普通', bad: '合わなかった' };
const MEET_AGAIN_LABELS: Record<string, string> = { yes: 'はい', no: 'いいえ', considering: '検討中' };

export async function GET() {
  const result = await requireAdminUser();
  if ('error' in result) return result.error;
  const { admin } = result;

  const { data, error } = await admin
    .from('omiai_surveys')
    .select('user_id, created_at, omiai_satisfaction, partner_impression, want_to_meet_again, service_satisfaction, comment, is_confirmed')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const surveys = data ?? [];
  const userIds = [...new Set(surveys.map((s) => s.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await admin.from('profiles').select('id, nickname').in('id', userIds)
    : { data: [] as { id: string; nickname: string }[] };
  const nicknameMap = new Map((profiles ?? []).map((p) => [p.id, p.nickname ?? '']));

  let csv = csvBom() + toCsvRow(CSV_HEADERS);
  for (const s of surveys) {
    csv += toCsvRow([
      s.user_id,
      nicknameMap.get(s.user_id) ?? '',
      formatDateTime(s.created_at),
      s.omiai_satisfaction ?? '',
      IMPRESSION_LABELS[s.partner_impression ?? ''] ?? s.partner_impression ?? '',
      MEET_AGAIN_LABELS[s.want_to_meet_again ?? ''] ?? s.want_to_meet_again ?? '',
      s.service_satisfaction ?? '',
      s.comment ?? '',
      s.is_confirmed ? '確認済' : '未確認',
    ]);
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${csvFilename('omiai_surveys')}"`,
    },
  });
}
