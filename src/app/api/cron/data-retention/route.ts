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
        // profiles.id は auth.users.id を外部キー参照しており(ON DELETE CASCADE設定なし)、
        // かつ matchings・reports・marriage_reports が profiles.id をNO ACTIONで参照しているため、
        // 「関連テーブル削除 → profiles削除 → auth.users削除」の順で実行する必要がある
        // (逆順だとauth.users削除時に外部キー制約違反で失敗する。2026/7/22発見・修正)。
        // blocks・verification_deficiency_noticesはprofiles.idにON DELETE CASCADE設定済みのため、
        // profiles削除時に自動的に削除される。
        const { error: matchingsError } = await admin
          .from('matchings')
          .delete()
          .or(`applicant_id.eq.${profile.id},partner_id.eq.${profile.id}`);
        if (matchingsError) {
          console.error('matchings delete error:', matchingsError);
          continue;
        }

        const { error: reportsError } = await admin
          .from('reports')
          .delete()
          .or(`reporter_id.eq.${profile.id},reported_id.eq.${profile.id}`);
        if (reportsError) {
          console.error('reports delete error:', reportsError);
          continue;
        }

        const { error: marriageReportsError } = await admin
          .from('marriage_reports')
          .delete()
          .eq('user_id', profile.id);
        if (marriageReportsError) {
          console.error('marriage_reports delete error:', marriageReportsError);
          continue;
        }

        // delete()はマッチ0件でも error: null を返すため、実際に削除できたかは
        // .select()で返ってきた行の有無で確認する(2026/7/22、削除確認漏れによる
        // 見かけ上の成功を防ぐため追加)。
        const { data: deletedProfileRows, error: profileDeleteError } = await admin
          .from('profiles')
          .delete()
          .eq('id', profile.id)
          .select('id');
        if (profileDeleteError) {
          console.error('profiles delete error:', profileDeleteError);
          continue;
        }
        if (!deletedProfileRows || deletedProfileRows.length === 0) {
          console.error('profiles delete matched 0 rows (unexpected):', profile.id);
          continue;
        }

        const { error: authDeleteError } = await admin.auth.admin.deleteUser(profile.id);
        if (authDeleteError) {
          // profilesは既に削除済みのため、ここで失敗するとauth.usersだけが孤児として残る。
          // 頻発するようなら手動での孤児アカウント検出・削除フローの整備を検討する。
          console.error('auth deleteUser error (profiles already deleted, orphaned auth user may remain):', profile.id, authDeleteError);
          continue;
        }

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
