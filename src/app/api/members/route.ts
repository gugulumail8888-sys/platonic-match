import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('gender')
    .eq('id', user.id)
    .maybeSingle();

  const oppositeGender = me?.gender === 'male' ? 'female' : 'male';

  const { data: members } = await supabase
    .from('profiles')
    .select('id, nickname, gender, birth_date, prefecture, occupation, body_type, marital_history, number_of_children, avatar_url')
    .eq('gender', oppositeGender)
    .eq('status', 'active')
    .neq('id', user.id);

  return NextResponse.json({ members: members ?? [] });
}
