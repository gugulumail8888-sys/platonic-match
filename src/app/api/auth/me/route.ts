import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'admin@amista.jp')
  .split(',')
  .map((e) => e.trim());

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email);

  let hasAiOption = false;
  if (!isAdmin) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .maybeSingle();
    hasAiOption = profile?.is_premium ?? false;
  }

  return NextResponse.json({
    role: isAdmin ? 'admin' : 'user',
    email: user.email,
    hasAiOption,
  });
}
