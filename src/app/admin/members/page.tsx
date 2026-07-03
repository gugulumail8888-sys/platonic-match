export const dynamic = 'force-dynamic';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import AdminMembersClient from './_components/AdminMembersClient';
import type { MemberStatus, MemberRow } from './_components/AdminMembersClient';

// ============================================================
// Server Actions
// ============================================================

async function approveMember(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const supabase = createAdminClient();
  await supabase.from('profiles').update({ status: 'approved' }).eq('id', id);
  revalidatePath('/admin/members');
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
}

// ============================================================
// メールアドレス取得（buildPersonCache的な仕組み）
// ============================================================

type AdminClient = ReturnType<typeof createAdminClient>;

async function buildEmailMap(admin: AdminClient, ids: string[]): Promise<Map<string, string>> {
  const cache = new Map<string, string>();
  for (const id of ids) {
    const { data } = await admin.auth.admin.getUserById(id);
    cache.set(id, data?.user?.email ?? '');
  }
  return cache;
}

// ============================================================
// Page
// ============================================================

const PROFILE_COLUMNS =
  'id, nickname, gender, birth_date, prefecture, occupation, avatar_url, avatar_color, status, is_suspended, suspended_at, suspended_reason, created_at';

export default async function AdminMembersPage() {
  const supabase = createAdminClient();

  const { data: profiles } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .order('created_at', { ascending: false });

  const rows = profiles ?? [];

  const emailMap = await buildEmailMap(supabase, rows.map((p) => p.id));

  const members: MemberRow[] = rows.map((p) => ({
    ...p,
    status: p.status as MemberStatus,
    email: emailMap.get(p.id) ?? '',
  }));

  return (
    <AdminMembersClient
      members={members}
      approveMember={approveMember}
      suspendMember={suspendMember}
      unsuspendMember={unsuspendMember}
    />
  );
}
