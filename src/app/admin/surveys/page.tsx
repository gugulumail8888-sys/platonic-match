import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';

const PAGE_SIZE = 10;

async function confirmOmiaiSurvey(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const supabase = createAdminClient();
  const { data } = await supabase.from('omiai_surveys').select('is_confirmed').eq('id', id).single();
  await supabase.from('omiai_surveys').update({ is_confirmed: !data?.is_confirmed }).eq('id', id);
  revalidatePath('/admin/surveys');
}

async function confirmMarriageReport(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const supabase = createAdminClient();
  const { data } = await supabase.from('marriage_reports').select('is_confirmed').eq('id', id).single();
  await supabase.from('marriage_reports').update({ is_confirmed: !data?.is_confirmed }).eq('id', id);
  revalidatePath('/admin/surveys');
}

function PaginationBar({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  return (
    <div className="flex items-center justify-end gap-2 mt-3">
      {currentPage > 1 ? (
        <Link
          href={buildHref(currentPage - 1)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
        >
          前へ
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-800 text-zinc-600">前へ</span>
      )}
      <span className="text-xs text-zinc-400">{currentPage} / {totalPages}</span>
      {currentPage < totalPages ? (
        <Link
          href={buildHref(currentPage + 1)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all"
        >
          次へ
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-800 text-zinc-600">次へ</span>
      )}
    </div>
  );
}

export default async function AdminSurveysPage({
  searchParams,
}: {
  searchParams: { surveyPage?: string; reportPage?: string };
}) {
  const supabase = createAdminClient();

  const surveyPage = Math.max(1, parseInt(searchParams.surveyPage ?? '1', 10) || 1);
  const reportPage = Math.max(1, parseInt(searchParams.reportPage ?? '1', 10) || 1);

  const { data: omiaiSurveys, count: omiaiCount } = await supabase
    .from('omiai_surveys')
    .select('*, profiles!omiai_surveys_user_id_fkey(nickname)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((surveyPage - 1) * PAGE_SIZE, surveyPage * PAGE_SIZE - 1);

  const { data: marriageReports, count: reportCount } = await supabase
    .from('marriage_reports')
    .select('*, profiles!marriage_reports_user_id_fkey(nickname)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((reportPage - 1) * PAGE_SIZE, reportPage * PAGE_SIZE - 1);

  const omiaiTotalPages  = Math.max(1, Math.ceil((omiaiCount ?? 0) / PAGE_SIZE));
  const reportTotalPages = Math.max(1, Math.ceil((reportCount ?? 0) / PAGE_SIZE));

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold text-white">アンケート管理</h1>

      {/* お見合い後アンケート */}
      <section>
        <h2 className="text-xl font-semibold text-teal-400 mb-4">お見合い後アンケート（全{omiaiCount ?? 0}件）</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-zinc-300 border border-zinc-700">
            <thead className="bg-zinc-800">
              <tr>
                <th className="p-3 text-left">日時</th>
                <th className="p-3 text-left">ユーザー</th>
                <th className="p-3 text-left">満足度</th>
                <th className="p-3 text-left">お相手印象</th>
                <th className="p-3 text-left">再会希望</th>
                <th className="p-3 text-left">サービス満足度</th>
                <th className="p-3 text-left">コメント</th>
                <th className="p-3 text-left whitespace-nowrap w-24">状態</th>
              </tr>
            </thead>
            <tbody>
              {omiaiSurveys?.map((s) => (
                <tr key={s.id} className="border-t border-zinc-700 hover:bg-zinc-800">
                  <td className="p-3">{new Date(s.created_at).toLocaleDateString('ja-JP')}</td>
                  <td className="p-3">{(s.profiles as any)?.nickname ?? '-'}</td>
                  <td className="p-3">{'★'.repeat(s.omiai_satisfaction)}</td>
                  <td className="p-3">{{ good: '良い', normal: '普通', bad: '合わなかった' }[s.partner_impression as string] ?? s.partner_impression}</td>
                  <td className="p-3">{{ yes: 'はい', no: 'いいえ', considering: '検討中' }[s.want_to_meet_again as string] ?? s.want_to_meet_again}</td>
                  <td className="p-3">{'★'.repeat(s.service_satisfaction)}</td>
                  <td className="p-3 max-w-xs truncate">{s.comment ?? '-'}</td>
                  <td className="p-3 whitespace-nowrap">
                    <form action={confirmOmiaiSurvey}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        className={
                          s.is_confirmed
                            ? 'text-xs font-medium text-zinc-300 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 px-3 py-1 rounded-full transition-colors'
                            : 'text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded-full transition-colors'
                        }
                      >
                        {s.is_confirmed ? '確認済' : '未確認'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!omiaiSurveys || omiaiSurveys.length === 0) && (
                <tr><td colSpan={8} className="p-4 text-center text-zinc-500">データなし</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {(omiaiCount ?? 0) > 0 && (
          <PaginationBar
            currentPage={surveyPage}
            totalPages={omiaiTotalPages}
            buildHref={(p) => `/admin/surveys?surveyPage=${p}&reportPage=${reportPage}`}
          />
        )}
      </section>

      {/* 成婚報告アンケート */}
      <section>
        <h2 className="text-xl font-semibold text-teal-400 mb-4">成婚報告アンケート（全{reportCount ?? 0}件）</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-zinc-300 border border-zinc-700">
            <thead className="bg-zinc-800">
              <tr>
                <th className="p-3 text-left">日時</th>
                <th className="p-3 text-left">ユーザー</th>
                <th className="p-3 text-left">出会い時期</th>
                <th className="p-3 text-left">きっかけ</th>
                <th className="p-3 text-left">満足度</th>
                <th className="p-3 text-left">メッセージ</th>
                <th className="p-3 text-left whitespace-nowrap w-24">状態</th>
              </tr>
            </thead>
            <tbody>
              {marriageReports?.map((r) => (
                <tr key={r.id} className="border-t border-zinc-700 hover:bg-zinc-800">
                  <td className="p-3">{new Date(r.created_at).toLocaleDateString('ja-JP')}</td>
                  <td className="p-3">{(r.profiles as any)?.nickname ?? '-'}</td>
                  <td className="p-3">{{ '1month': '1ヶ月以内', '3months': '3ヶ月以内', '6months': '6ヶ月以内', '1year': '1年以内', 'over1year': '1年以上' }[r.met_timing as string] ?? r.met_timing}</td>
                  <td className="p-3">{{ ai: 'AIおすすめ', search: '会員検索', omiai: 'お見合い申請', received: 'お見合い受信', other: 'その他' }[r.trigger as string] ?? r.trigger}</td>
                  <td className="p-3">{'★'.repeat(r.satisfaction)}</td>
                  <td className="p-3 max-w-xs truncate">{r.message ?? '-'}</td>
                  <td className="p-3 whitespace-nowrap">
                    <form action={confirmMarriageReport}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className={
                          r.is_confirmed
                            ? 'text-xs font-medium text-zinc-300 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 px-3 py-1 rounded-full transition-colors'
                            : 'text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded-full transition-colors'
                        }
                      >
                        {r.is_confirmed ? '確認済' : '未確認'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!marriageReports || marriageReports.length === 0) && (
                <tr><td colSpan={7} className="p-4 text-center text-zinc-500">データなし</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {(reportCount ?? 0) > 0 && (
          <PaginationBar
            currentPage={reportPage}
            totalPages={reportTotalPages}
            buildHref={(p) => `/admin/surveys?surveyPage=${surveyPage}&reportPage=${p}`}
          />
        )}
      </section>
    </div>
  );
}
