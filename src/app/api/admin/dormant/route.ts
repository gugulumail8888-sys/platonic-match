import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const months = parseInt(searchParams.get('months') ?? '6');

  const { data: authUsers, error: authError } = await adminSupabase.auth.admin.listUsers({
    perPage: 1000,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const threshold = new Date();
  threshold.setMonth(threshold.getMonth() - months);

  const dormantIds = authUsers.users
    .filter(u => {
      const lastSignIn = u.last_sign_in_at ? new Date(u.last_sign_in_at) : new Date(u.created_at);
      return lastSignIn < threshold;
    })
    .map(u => u.id);

  if (dormantIds.length === 0) {
    return NextResponse.json({ members: [] });
  }

  const { data: profiles, error } = await adminSupabase
    .from('profiles')
    .select('id, nickname, gender, birth_date, prefecture, occupation, status, created_at, avatar_color, dormant_notice_sent_at')
    .in('id', dormantIds)
    .neq('role', 'admin');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const authMap = new Map(authUsers.users.map(u => [u.id, u]));
  const members = (profiles ?? []).map(p => {
    const authUser = authMap.get(p.id);
    return {
      ...p,
      email: authUser?.email ?? '',
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
    };
  });

  members.sort((a, b) => {
    const aDate = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
    const bDate = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
    return aDate - bDate;
  });

  return NextResponse.json({ members });
}
