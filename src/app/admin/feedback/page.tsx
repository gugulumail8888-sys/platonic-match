import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'

async function confirmFeedback(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const supabase = createAdminClient()
  const { data } = await supabase.from('feedback').select('is_confirmed').eq('id', id).single()
  await supabase.from('feedback').update({ is_confirmed: !data?.is_confirmed }).eq('id', id)
  revalidatePath('/admin/feedback')
}

export default async function AdminFeedbackPage() {
  const supabase = createAdminClient()
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
              <th className="p-3 text-left whitespace-nowrap w-24">状態</th>
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
                <td className="p-3 whitespace-nowrap">
                  <form action={confirmFeedback}>
                    <input type="hidden" name="id" value={fb.id} />
                    <button
                      type="submit"
                      className={
                        fb.is_confirmed
                          ? 'text-xs font-medium text-zinc-300 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 px-3 py-1 rounded-full transition-colors'
                          : 'text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded-full transition-colors'
                      }
                    >
                      {fb.is_confirmed ? '確認済' : '未確認'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!feedbacks || feedbacks.length === 0) && (
              <tr><td colSpan={4} className="p-4 text-center text-zinc-500">まだ投稿はありません。</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
