export const dynamic = 'force-dynamic';

import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import AdminMemberDetailClient from '../_components/AdminMemberDetailClient';
import type { MemberDetail, ApplicationRow } from '../_components/AdminMemberDetailClient';
import type { MemberStatus } from '../_components/AdminMembersClient';
import type { AppStatus } from '../../matching/_components/AdminMatchingClient';

// ============================================================
// Server Actions
// ============================================================

async function updateMemberStatus(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  const supabase = createAdminClient();
  await supabase.from('profiles').update({ status }).eq('id', id);
  revalidatePath('/admin/members');
  revalidatePath(`/admin/members/${id}`);
}

async function suspendMember(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const supabase = createAdminClient();
  await supabase
    .from('profiles')
    .update({ is_suspended: true, suspended_at: new Date().toISOString() })
    .eq('id', id);
  revalidatePath('/admin/members');
  revalidatePath(`/admin/members/${id}`);
}

async function unsuspendMember(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const supabase = createAdminClient();
  await supabase
    .from('profiles')
    .update({ is_suspended: false })
    .eq('id', id);
  revalidatePath('/admin/members');
  revalidatePath(`/admin/members/${id}`);
}

// ============================================================
// Page
// ============================================================

const PROFILE_COLUMNS =
  'id, nickname, gender, birth_date, prefecture, occupation, height, body_type, blood_type, marital_history, number_of_children, education, siblings, income, marriage_timing, children_desire, sexuality, sexuality_other, living_arrangement, hobbies, pr, desired_conditions, avatar_url, avatar_color, status, is_suspended, suspended_at, suspended_reason, created_at';

export default async function AdminMemberDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-400">会員が見つかりませんでした</p>
        <Link href="/admin/members" className="text-teal-400 text-sm mt-2 inline-block hover:text-teal-300">
          ← 会員一覧に戻る
        </Link>
      </div>
    );
  }

  // メールアドレス取得
  const { data: authData } = await supabase.auth.admin.getUserById(id);
  const email = authData?.user?.email ?? '';

  // 申請履歴（申請者側・相手側の両方から取得）
  const [{ data: asApplicant }, { data: asPartner }] = await Promise.all([
    supabase
      .from('matchings')
      .select('id, status, created_at, applicant_id, partner_id')
      .eq('applicant_id', id),
    supabase
      .from('matchings')
      .select('id, status, created_at, applicant_id, partner_id')
      .eq('partner_id', id),
  ]);

  const matchingRows = [...(asApplicant ?? []), ...(asPartner ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const partnerIds = [
    ...new Set(matchingRows.map((r) => (r.applicant_id === id ? r.partner_id : r.applicant_id))),
  ];

  const { data: partnerProfiles } = partnerIds.length
    ? await supabase.from('profiles').select('id, nickname, avatar_url, avatar_color').in('id', partnerIds)
    : { data: [] as { id: string; nickname: string; avatar_url: string | null; avatar_color: string | null }[] };

  const partnerMap = new Map((partnerProfiles ?? []).map((p) => [p.id, p]));

  const applications: ApplicationRow[] = matchingRows.map((r) => ({
    id: r.id,
    status: r.status as AppStatus,
    created_at: r.created_at,
    partner: partnerMap.get(r.applicant_id === id ? r.partner_id : r.applicant_id) ?? null,
  }));

  const member: MemberDetail = {
    ...profile,
    status: profile.status as MemberStatus,
    email,
  };

  return (
    <AdminMemberDetailClient
      member={member}
      applications={applications}
      updateStatus={updateMemberStatus}
      suspendMember={suspendMember}
      unsuspendMember={unsuspendMember}
    />
  );
}
