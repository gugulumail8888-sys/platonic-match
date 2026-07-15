import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const { userId } = await req.json() as { userId?: string };
  if (!userId) {
    return NextResponse.json({ error: 'userIdが必要です' }, { status: 400 });
  }

  const { data: targetProfile } = await adminSupabase
    .from('profiles')
    .select('nickname')
    .eq('id', userId)
    .single();

  const { data: authUser } = await adminSupabase.auth.admin.getUserById(userId);
  const email = authUser?.user?.email;

  if (!targetProfile || !email) {
    return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
  }

  await fetch(`${req.nextUrl.origin}/api/admin/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
    },
    body: JSON.stringify({
      type: 'dormant_notice',
      user: { nickname: targetProfile.nickname ?? 'ユーザー', email },
    }),
  });

  // 自動バッチ(dormant_notice_batch)による重複送信を防ぐため、手動送信時も送信日時を記録する
  await adminSupabase
    .from('profiles')
    .update({ dormant_notice_sent_at: new Date().toISOString() })
    .eq('id', userId);

  return NextResponse.json({ success: true });
}
