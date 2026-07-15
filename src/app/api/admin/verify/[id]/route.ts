import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

type AdminClient = ReturnType<typeof createAdminClient>;

type AdminCheckResult =
  | { error: NextResponse; admin?: undefined; userId?: undefined }
  | { error?: undefined; admin: AdminClient; userId: string };

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

  return { admin, userId: user.id };
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

  const { data: deficiencyLogs } = await admin
    .from('verification_deficiency_notices')
    .select('reason, sent_at')
    .eq('profile_id', params.id)
    .order('sent_at', { ascending: false });

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
    deficiencyHistory: (deficiencyLogs ?? []).map((log) => ({ reason: log.reason, sentAt: log.sent_at })),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, admin } = await requireAdmin();
  if (error) return error;

  const body = await req.json() as { status?: string };
  if (!['approved', 'rejected', 'verified', 'pending'].includes(body.status ?? '')) {
    return NextResponse.json({ error: 'statusはapproved/rejected/verified/pendingを指定してください' }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = { status: body.status };
  if (body.status === 'verified') {
    updatePayload.resubmitted_at = null;
  }

  const { error: updateError } = await admin
    .from('profiles')
    .update(updatePayload)
    .eq('id', params.id);

  if (updateError) {
    console.error('admin verify status update error:', updateError);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, admin, userId } = await requireAdmin();
  if (error) return error;

  const body = await req.json() as { reason?: string };

  const { data: row } = await admin
    .from('profiles')
    .select('nickname')
    .eq('id', params.id)
    .maybeSingle();

  const { data: authUser } = await admin.auth.admin.getUserById(params.id);
  const email = authUser?.user?.email;

  if (!email) {
    return NextResponse.json({ error: 'メールアドレスが見つかりません' }, { status: 404 });
  }

  const notifyRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/notify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`,
    },
    body: JSON.stringify({
      type: 'deficiency_document',
      user: { nickname: row?.nickname ?? '会員', email },
      reason: body.reason ?? '',
    }),
  });

  if (!notifyRes.ok) {
    return NextResponse.json({ error: 'メール送信に失敗しました' }, { status: 500 });
  }

  const { error: logError } = await admin
    .from('verification_deficiency_notices')
    .insert({
      profile_id: params.id,
      reason: body.reason ?? null,
      sent_by: userId,
    });

  if (logError) {
    console.error('deficiency notice log insert error:', logError);
    // 履歴記録に失敗してもメール送信自体は成功しているため、エラーにはしない
  }

  return NextResponse.json({ ok: true });
}
