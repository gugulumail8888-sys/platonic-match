import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { matchingId } = await req.json() as { matchingId: string };

    if (!matchingId) {
      return NextResponse.json({ error: '入力内容を確認してください' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '未認証です' }, { status: 401 });
    }

    const { error: insertError } = await supabase
      .from('zoom_check_consents')
      .insert({ matching_id: matchingId, user_id: user.id });

    // 既に同意済み（UNIQUE制約違反）の場合はエラーにせず成功として扱う
    if (insertError && insertError.code !== '23505') {
      console.error('Consent insert error:', insertError);
      return NextResponse.json({ error: '同意記録の保存に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Consent error:', error);
    return NextResponse.json({ error: '同意記録処理に失敗しました' }, { status: 500 });
  }
}
