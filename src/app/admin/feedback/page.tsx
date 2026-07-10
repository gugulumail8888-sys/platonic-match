import { createClient } from '@/lib/supabase/server'

export default async function AdminFeedbackPage() {
  const supabase = await createClient()
  const { data: feedbacks, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">ご意見・ご要望一覧</h1>
        <p className="text-sm text-zinc-400 mt-0.5">amista 管理者パネル</p>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
          エラー: {error.message}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-zinc-300 border border-zinc-700 table-fixed">
          <thead className="bg-zinc-800">
            <tr>
              <th className="p-3 text-left whitespace-nowrap w-36">日時</th>
              <th className="p-3 text-left whitespace-nowrap w-24">ページ</th>
              <th className="p-3 text-left">内容</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks?.map((fb) => (
              <tr key={fb.id} className="border-t border-zinc-700 hover:bg-zinc-800">
                <td className="p-3 whitespace-nowrap text-zinc-400">
                  {new Date(fb.created_at).toLocaleString('ja-JP')}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className="text-xs font-mono text-teal-300 bg-teal-900/30 border border-teal-800 px-2 py-0.5 rounded-full">
                    {fb.page}
                  </span>
                </td>
                <td className="p-3 whitespace-pre-wrap">{fb.content}</td>
              </tr>
            ))}
            {(!feedbacks || feedbacks.length === 0) && (
              <tr><td colSpan={3} className="p-4 text-center text-zinc-500">まだ投稿はありません。</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
