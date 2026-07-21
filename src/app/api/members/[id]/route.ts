import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { data: member } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .in('status', ['approved', 'verified'])
    .maybeSingle();

  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ member });
}
