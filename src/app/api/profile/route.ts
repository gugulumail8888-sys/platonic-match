import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 });

  let id_document_signed_url: string | null = null;
  let id_document_back_signed_url: string | null = null;

  if (profile.id_document_url) {
    const { data: signed } = await admin.storage
      .from('documents')
      .createSignedUrl(profile.id_document_url, 60 * 60);
    id_document_signed_url = signed?.signedUrl ?? null;
  }

  if (profile.id_document_back_url) {
    const { data: signed } = await admin.storage
      .from('documents')
      .createSignedUrl(profile.id_document_back_url, 60 * 60);
    id_document_back_signed_url = signed?.signedUrl ?? null;
  }

  return NextResponse.json({
    profile: {
      ...profile,
      id_document_signed_url,
      id_document_back_signed_url,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { alcohol, ...updates } = await req.json();
  const admin = createAdminClient();

  if (alcohol !== undefined) {
    const { error: alcoholError } = await supabase.rpc('update_profile_alcohol', { alcohol_value: alcohol });
    if (alcoholError) return NextResponse.json({ error: alcoholError.message }, { status: 400 });
  }

  const { data: profile, error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select('*')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile });
}
