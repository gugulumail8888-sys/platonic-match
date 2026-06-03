import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { data: member } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ member });
}
