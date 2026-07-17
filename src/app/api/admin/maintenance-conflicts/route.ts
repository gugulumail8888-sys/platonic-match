import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { parseJstDateTime } from '@/lib/datetime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const start = req.nextUrl.searchParams.get('start');
  const end = req.nextUrl.searchParams.get('end');
  if (!start || !end) {
    return NextResponse.json({ error: 'start・endが必要です' }, { status: 400 });
  }

  const startTime = parseJstDateTime(start);
  const endTime = parseJstDateTime(end);
  // 面談時間(40分)を考慮し、開始1時間前〜終了までを重複チェック範囲とする
  const checkFrom = new Date(startTime.getTime() - 60 * 60 * 1000).toISOString();

  const admin = createAdminClient();
  const { data: matchings } = await admin
    .from('matchings')
    .select('id, applicant_id, partner_id, scheduled_at')
    .in('status', ['scheduling', 'zoom_completed'])
    .not('scheduled_at', 'is', null)
    .gte('scheduled_at', checkFrom)
    .lte('scheduled_at', endTime.toISOString());

  const rows = matchings ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ conflicts: [] });
  }

  const userIds = [...new Set(rows.flatMap((m) => [m.applicant_id, m.partner_id]))];
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, nickname')
    .in('id', userIds);
  const nameMap = new Map((profiles ?? []).map((p) => [p.id as string, p.nickname as string]));

  const emailMap = new Map<string, string>();
  await Promise.all(
    userIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      emailMap.set(id, data?.user?.email ?? '');
    })
  );

  const conflicts = rows.map((m) => ({
    id: m.id,
    scheduledAt: m.scheduled_at,
    applicantNickname: nameMap.get(m.applicant_id) ?? '不明',
    applicantEmail: emailMap.get(m.applicant_id) ?? '',
    partnerNickname: nameMap.get(m.partner_id) ?? '不明',
    partnerEmail: emailMap.get(m.partner_id) ?? '',
  }));

  return NextResponse.json({ conflicts });
}
