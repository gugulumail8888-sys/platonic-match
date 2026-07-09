import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'メールアドレスの形式が正しくありません' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('email_exists', { check_email: email });

  if (error) {
    console.error('email_exists RPC error:', error);
    return NextResponse.json({ error: '確認処理に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ exists: data === true });
}
