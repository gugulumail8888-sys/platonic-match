export const dynamic = 'force-dynamic';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import AdminMatchingClient from './_components/AdminMatchingClient';
import type { AppStatus, MatchingRow } from './_components/AdminMatchingClient';

async function updateMatchingStatus(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  const supabase = createAdminClient();
  await supabase.from('matchings').update({ status }).eq('id', id);
  revalidatePath('/admin/matching');
}

export default async function AdminMatchingPage() {
  const supabase = createAdminClient();

  const { data: rows } = await supabase
    .from('matchings')
    .select('id, status, created_at, applicant_id, partner_id, applicant_dating_wish, partner_dating_wish, scheduled_at, meeting_ended_at, user1_joined_at, user2_joined_at')
    .order('created_at', { ascending: false });

  if (!rows || rows.length === 0) {
    return <AdminMatchingClient matchings={[]} updateStatus={updateMatchingStatus} />;
  }

  const profileIds = [
    ...new Set([
      ...rows.map((r) => r.applicant_id),
      ...rows.map((r) => r.partner_id),
    ]),
  ];

  const matchingIds = rows.map((r) => r.id);

  const { data: consents } = await supabase
    .from('zoom_check_consents')
    .select('matching_id, user_id')
    .in('matching_id', matchingIds);

  const consentMap = new Map<string, Set<string>>();
  for (const c of consents ?? []) {
    if (!consentMap.has(c.matching_id)) {
      consentMap.set(c.matching_id, new Set());
    }
    consentMap.get(c.matching_id)!.add(c.user_id);
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nickname, birth_date, prefecture, occupation, avatar_url')
    .in('id', profileIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const matchings: MatchingRow[] = rows.map((r) => ({
    ...r,
    status: r.status as AppStatus,
    applicant: profileMap.get(r.applicant_id) ?? null,
    partner: profileMap.get(r.partner_id) ?? null,
    applicant_consented: consentMap.get(r.id)?.has(r.applicant_id) ?? false,
    partner_consented: consentMap.get(r.id)?.has(r.partner_id) ?? false,
  }));

  return <AdminMatchingClient matchings={matchings} updateStatus={updateMatchingStatus} />;
}
