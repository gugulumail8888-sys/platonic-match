import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const MAX_FAIL = 5;
const LOCK_SECONDS = 300; // 5分

export async function POST(req: NextRequest) {
  const { email, password } = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json({ error: 'メールアドレスとパスワードを入力してください' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: attempt } = await admin
    .from('login_attempts')
    .select('fail_count, locked_until')
    .eq('email', email)
    .maybeSingle();

  if (attempt?.locked_until && new Date(attempt.locked_until).getTime() > Date.now()) {
    const remainingMinutes = Math.ceil(
      (new Date(attempt.locked_until).getTime() - Date.now()) / 1000 / 60
    );
    return NextResponse.json(
      {
        error: `ログイン試行回数が上限に達しました。${remainingMinutes}分後に再試行してください。`,
        lockedUntil: attempt.locked_until,
      },
      { status: 429 }
    );
  }

  const supabase = await createClient();
  const { error, data: signInData } = await supabase.auth.signInWithPassword({ email, password });

  if (!error && signInData.user) {
    const { data: profile } = await admin
      .from('profiles')
      .select('is_suspended, suspended_reason')
      .eq('id', signInData.user.id)
      .maybeSingle();

    if (profile?.is_suspended) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error:
            'このアカウントは現在停止されています。詳しくは事務局までお問い合わせください。',
        },
        { status: 403 }
      );
    }
  }

  if (error) {
    const nextFailCount = (attempt?.fail_count ?? 0) + 1;

    if (nextFailCount >= MAX_FAIL) {
      const lockedUntil = new Date(Date.now() + LOCK_SECONDS * 1000).toISOString();
      await admin.from('login_attempts').upsert({
        email,
        fail_count: 0,
        locked_until: lockedUntil,
        updated_at: new Date().toISOString(),
      });

      return NextResponse.json(
        {
          error: 'ログイン試行回数が上限に達しました。5分後に再試行してください。',
          lockedUntil,
        },
        { status: 429 }
      );
    }

    await admin.from('login_attempts').upsert({
      email,
      fail_count: nextFailCount,
      locked_until: null,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'メールアドレスまたはパスワードが正しくありません' },
      { status: 401 }
    );
  }

  await admin.from('login_attempts').delete().eq('email', email);

  return NextResponse.json({ ok: true });
}
