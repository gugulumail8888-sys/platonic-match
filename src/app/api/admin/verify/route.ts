import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

function calcAge(birthDate: string | null): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export async function GET() {
  const supabase = await createClient();

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  // 管理者チェック
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: rows, error } = await admin
    .from('profiles')
    .select('id, nickname, birth_date, gender, prefecture, created_at, id_document_url, id_document_back_url, status, resubmitted_at')
    .in('status', ['pending', 'approved', 'verified', 'rejected'])
    .order('created_at', { ascending: false });

  if (error) {
    console.error('admin verify fetch error:', error);
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 });
  }

  const profileIds = (rows ?? []).map((r) => r.id as string);
  const { data: deficiencyRows } = await admin
    .from('verification_deficiency_notices')
    .select('profile_id, sent_at')
    .in('profile_id', profileIds)
    .order('sent_at', { ascending: false });

  const lastDeficiencyMap = new Map<string, string>();
  for (const d of deficiencyRows ?? []) {
    if (!lastDeficiencyMap.has(d.profile_id as string)) {
      lastDeficiencyMap.set(d.profile_id as string, d.sent_at as string);
    }
  }

  const items = await Promise.all((rows ?? []).map(async (row) => {
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

    return {
      id: row.id as string,
      nickname: (row.nickname as string | null) ?? '不明',
      age: calcAge(row.birth_date as string | null),
      gender: row.gender as string | null,
      prefecture: (row.prefecture as string | null) ?? '',
      createdAt: row.created_at as string,
      status: row.status as 'pending' | 'approved' | 'rejected',
      frontUrl,
      backUrl,
      resubmitted_at: row.resubmitted_at,
      lastDeficiencySentAt: lastDeficiencyMap.get(row.id as string) ?? null,
    };
  }));

  return NextResponse.json({ items });
}
