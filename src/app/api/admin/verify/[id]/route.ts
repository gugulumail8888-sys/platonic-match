import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

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

function calcAge(birthDate: string | null): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error, admin } = await requireAdmin();
  if (error) return error;

  const { data: row, error: fetchError } = await admin
    .from('profiles')
    .select('id, nickname, birth_date, gender, prefecture, created_at, id_document_url, id_document_back_url, status')
    .eq('id', params.id)
    .maybeSingle();

  if (fetchError) {
    console.error('admin verify detail fetch error:', fetchError);
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: '対象が見つかりません' }, { status: 404 });
  }

  let frontUrl: string | null = null;
  let backUrl: string | null = null;

  if (row.id_document_url) {
    const { data: signed } = await admin.storage
      .from('documents')
      .createSignedUrl(row.id_document_url, SIGNED_URL_EXPIRY_SECONDS);
    frontUrl = signed?.signedUrl ?? null;
  }
  if (row.id_document_back_url) {
    const { data: signed } = await admin.storage
      .from('documents')
      .createSignedUrl(row.id_document_back_url, SIGNED_URL_EXPIRY_SECONDS);
    backUrl = signed?.signedUrl ?? null;
  }

  const { data: authUser } = await admin.auth.admin.getUserById(params.id);

  return NextResponse.json({
    id: row.id,
    nickname: row.nickname ?? '不明',
    age: calcAge(row.birth_date),
    gender: row.gender,
    prefecture: row.prefecture ?? '',
    createdAt: row.created_at,
    status: row.status,
    frontUrl,
    backUrl,
    email: authUser?.user?.email ?? '',
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, admin } = await requireAdmin();
  if (error) return error;

  const body = await req.json() as { status?: string };
  if (!['approved', 'rejected', 'verified', 'pending'].includes(body.status ?? '')) {
    return NextResponse.json({ error: 'statusはapproved/rejected/verified/pendingを指定してください' }, { status: 400 });
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update({ status: body.status })
    .eq('id', params.id);

  if (updateError) {
    console.error('admin verify status update error:', updateError);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
