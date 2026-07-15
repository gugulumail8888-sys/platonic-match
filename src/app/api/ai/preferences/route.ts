import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from('ai_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({ preferences: data ?? null });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const body = await req.json();
  const {
    preferred_age_min,
    preferred_age_max,
    preferred_prefecture,
    must_conditions,
    priority_points,
    free_message,
    preferred_income_min,
  } = body;

  const admin = createAdminClient();
  const { error } = await admin
    .from('ai_preferences')
    .upsert({
      user_id: user.id,
      preferred_age_min: preferred_age_min ?? null,
      preferred_age_max: preferred_age_max ?? null,
      preferred_prefecture: preferred_prefecture ?? null,
      must_conditions: must_conditions ?? null,
      priority_points: priority_points ?? null,
      free_message: free_message ?? null,
      preferred_income_min: preferred_income_min ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
