import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未認証' }, { status: 401 });

  const { period, trigger, satisfaction, message } = await req.json();

  if (!period || !trigger || !satisfaction) {
    return NextResponse.json({ error: '必須項目が未入力です' }, { status: 400 });
  }

  const { error } = await supabase
    .from('marriage_reports')
    .insert({
      user_id: user.id,
      met_timing: period,
      trigger: trigger,
      satisfaction: satisfaction,
      message: message || null,
    });

  if (error) {
    console.error('marriage_report保存エラー:', error);
    return NextResponse.json({ error: '保存に失敗しました' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
