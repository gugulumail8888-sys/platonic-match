import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';

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

export default async function AdminSurveysPage() {
  const supabase = createAdminClient();

  const { data: omiaiSurveys } = await supabase
    .from('omiai_surveys')
    .select('*, profiles!omiai_surveys_user_id_fkey(nickname)')
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: marriageReports } = await supabase
    .from('marriage_reports')
    .select('*, profiles!marriage_reports_user_id_fkey(nickname)')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold text-white">アンケート管理</h1>

      {/* お見合い後アンケート */}
      <section>
        <h2 className="text-xl font-semibold text-teal-400 mb-4">お見合い後アンケート</h2>
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
                  <td className="p-3">{s.partner_impression}</td>
                  <td className="p-3">{s.want_to_meet_again}</td>
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
      </section>

      {/* 成婚報告アンケート */}
      <section>
        <h2 className="text-xl font-semibold text-teal-400 mb-4">成婚報告アンケート</h2>
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
      </section>
    </div>
  );
}
