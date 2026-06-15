import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type AdminClient = ReturnType<typeof createAdminClient>;

type AdminCheckResult =
  | { error: NextResponse; admin?: undefined }
  | { error?: undefined; admin: AdminClient };

async function requireAdmin(): Promise<AdminCheckResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: '未認証' }, { status: 401 }) };
  }

  const admin = createAdminClient();

  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(user.id);
  if (authError || !authUser?.user) {
    return { error: NextResponse.json({ error: '未認証' }, { status: 401 }) };
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: '権限がありません' }, { status: 403 }) };
  }

  return { admin };
}

export async function GET() {
  const { error, admin } = await requireAdmin();
  if (error) return error;

  const { data, error: fetchError } = await admin
    .from('settings')
    .select('key, value');

  if (fetchError) {
    console.error('settings fetch error:', fetchError);
    return NextResponse.json({ error: '設定の取得に失敗しました' }, { status: 500 });
  }

  const settings = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));

  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const { error, admin } = await requireAdmin();
  if (error) return error;

  const body = await req.json() as Record<string, unknown>;
  const entries = Object.entries(body);

  if (entries.length === 0) {
    return NextResponse.json({ error: '設定が指定されていません' }, { status: 400 });
  }

  const rows = entries.map(([key, value]) => ({ key, value: String(value) }));

  const { error: upsertError } = await admin
    .from('settings')
    .upsert(rows, { onConflict: 'key' });

  if (upsertError) {
    console.error('settings upsert error:', upsertError);
    return NextResponse.json({ error: '設定の更新に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
