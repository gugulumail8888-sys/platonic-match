import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type RetentionType = 'delete_documents' | 'delete_withdrawn_accounts';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.AUTHORIZATION_SECRET;
  if (!secret) return false;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: '未認証' }, { status: 401 });
    }

    const { type } = await req.json() as { type?: RetentionType };
    const admin = createAdminClient();

    if (type === 'delete_documents') {
      const threshold = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

      const { data: profiles, error } = await admin
        .from('profiles')
        .select('id, id_document_url, id_document_back_url')
        .eq('status', 'withdrawn')
        .lte('withdrawn_at', threshold)
        .or('id_document_url.not.is.null,id_document_back_url.not.is.null');

      if (error) {
        console.error('delete_documents fetch error:', error);
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
      }

      let deletedCount = 0;
      for (const profile of profiles ?? []) {
        const paths = [profile.id_document_url, profile.id_document_back_url].filter(
          (p): p is string => !!p
        );
        if (paths.length > 0) {
          const { error: removeError } = await admin.storage.from('documents').remove(paths);
          if (removeError) {
            console.error('storage remove error:', removeError);
            continue;
          }
        }

        await admin
          .from('profiles')
          .update({ id_document_url: null, id_document_back_url: null })
          .eq('id', profile.id);

        deletedCount++;
      }

      return NextResponse.json({ ok: true, deletedCount });
    }

    if (type === 'delete_withdrawn_accounts') {
      const threshold = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString();

      const { data: profiles, error } = await admin
        .from('profiles')
        .select('id')
        .eq('status', 'withdrawn')
        .lte('withdrawn_at', threshold);

      if (error) {
        console.error('delete_withdrawn_accounts fetch error:', error);
        return NextResponse.json({ error: 'データ取得に失敗しました' }, { status: 500 });
      }

      let deletedCount = 0;
      for (const profile of profiles ?? []) {
        const { error: authDeleteError } = await admin.auth.admin.deleteUser(profile.id);
        if (authDeleteError) {
          console.error('auth deleteUser error:', authDeleteError);
          continue;
        }

        await admin.from('profiles').delete().eq('id', profile.id);
        deletedCount++;
      }

      return NextResponse.json({ ok: true, deletedCount });
    }

    return NextResponse.json({ error: '不明なtypeです' }, { status: 400 });
  } catch (error) {
    console.error('Data retention cron error:', error);
    return NextResponse.json({ error: 'データ削除処理に失敗しました' }, { status: 500 });
  }
}
