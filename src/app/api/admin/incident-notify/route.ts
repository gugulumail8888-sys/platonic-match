import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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

  const { message, sendEmail } = await req.json() as { message?: string; sendEmail?: boolean };
  if (!message) {
    return NextResponse.json({ error: 'messageが必要です' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, nickname, subscription_started_at')
    .neq('status', 'withdrawn')
    .neq('role', 'admin');

  if (error) {
    console.error('incident-notify fetch error:', error);
    return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
  }

  const { data: authUsers, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (authError) {
    console.error('incident-notify listUsers error:', authError);
    return NextResponse.json({ error: 'ユーザー取得に失敗しました' }, { status: 500 });
  }
  const emailMap = new Map(authUsers.users.map((u) => [u.id, u.email]));

  let sentCount = 0;
  const sentTo: { id: string; nickname: string; email: string; subscriptionStartedAt: string }[] = [];
  for (const p of profiles ?? []) {
    const email = emailMap.get(p.id);
    if (!email) continue;

    if (sendEmail) {
      await fetch(`${req.nextUrl.origin}/api/admin/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
        },
        body: JSON.stringify({
          type: 'incident_notice',
          user: { nickname: p.nickname ?? 'ユーザー', email },
          incidentMessage: message,
        }),
      });
    }

    sentTo.push({ id: p.id, nickname: p.nickname ?? 'ユーザー', email, subscriptionStartedAt: p.subscription_started_at ?? '' });
    sentCount++;
  }

  return NextResponse.json({ ok: true, sentCount, sentTo });
}
