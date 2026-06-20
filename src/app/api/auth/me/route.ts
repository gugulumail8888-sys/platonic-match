import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'admin@amista.jp')
  .split(',')
  .map((e) => e.trim());

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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: '未認証' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname, birth_date, prefecture, occupation, hobbies, pr, is_premium, role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = ADMIN_EMAILS.includes(user.email) || profile?.role === 'admin';

  const hasAiOption = !isAdmin && (profile?.is_premium ?? false);

  return NextResponse.json({
    role: isAdmin ? 'admin' : 'user',
    email: user.email,
    hasAiOption,
    profile: {
      nickname: profile?.nickname ?? '',
      age: calcAge(profile?.birth_date ?? null),
      prefecture: profile?.prefecture ?? null,
      occupation: profile?.occupation ?? null,
      hobbies: profile?.hobbies ?? null,
      pr: profile?.pr ?? null,
    },
  });
}
