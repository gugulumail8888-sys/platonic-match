import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
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

  // profilesテーブルから会員情報を取得
  const { data: profiles, error } = await adminSupabase
    .from('profiles')
    .select('id, nickname, gender, birth_date, prefecture, occupation, status, role, created_at, avatar_color')
    .neq('role', 'admin')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // auth.usersからlast_sign_in_atを取得
  const { data: authUsers, error: authError } = await adminSupabase.auth.admin.listUsers({
    perPage: 1000,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // プロフィールとauth情報をマージ
  const authMap = new Map(authUsers.users.map(u => [u.id, u]));
  const members = (profiles ?? []).map(p => {
    const authUser = authMap.get(p.id);
    return {
      ...p,
      email: authUser?.email ?? '',
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
    };
  });

  return NextResponse.json({ members });
}
