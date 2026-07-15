import { NextResponse } from 'next/server';
import {
  requireAdminUser, csvFilename, csvBom, toCsvRow, formatDateTime,
} from '@/lib/admin-export';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  pending: '処理中',
  succeeded: '完了',
  failed: '失敗',
  canceled: 'キャンセル',
};

const CSV_HEADERS = [
  '返金ID', '返金先ユーザーID', '返金先ニックネーム', 'キャンセル実行者ユーザーID', 'キャンセル実行者ニックネーム',
  'Stripe決済ID', 'Stripe返金ID', '金額', 'ステータス', '理由', '返金日時',
];

export async function GET() {
  const result = await requireAdminUser();
  if ('error' in result) return result.error;
  const { admin } = result;

  const { data, error } = await admin
    .from('refunds')
    .select('id, refund_to_user_id, cancelled_by_user_id, stripe_payment_intent_id, stripe_refund_id, amount, status, reason, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const refunds = data ?? [];
  const userIds = [...new Set(refunds.flatMap((r) => [r.refund_to_user_id, r.cancelled_by_user_id]))];
  const { data: profiles } = userIds.length > 0
    ? await admin.from('profiles').select('id, nickname').in('id', userIds)
    : { data: [] as { id: string; nickname: string }[] };
  const nicknameMap = new Map((profiles ?? []).map((p) => [p.id, p.nickname ?? '']));

  let csv = csvBom() + toCsvRow(CSV_HEADERS);
  for (const r of refunds) {
    csv += toCsvRow([
      r.id,
      r.refund_to_user_id,
      nicknameMap.get(r.refund_to_user_id) ?? '',
      r.cancelled_by_user_id,
      nicknameMap.get(r.cancelled_by_user_id) ?? '',
      r.stripe_payment_intent_id,
      r.stripe_refund_id ?? '',
      r.amount,
      STATUS_LABELS[r.status] ?? r.status,
      r.reason ?? '',
      formatDateTime(r.created_at),
    ]);
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${csvFilename('refunds')}"`,
    },
  });
}
