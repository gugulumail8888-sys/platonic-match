import { createClient } from '@/lib/supabase/server'

export default async function AdminFeedbackPage() {
  const supabase = await createClient()
  const { data: feedbacks, error } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">ご意見・ご要望一覧</h1>
      {error && (
        <p className="text-red-500 text-sm mb-4">エラー: {error.message}</p>
      )}
      {!feedbacks || feedbacks.length === 0 ? (
        <p className="text-gray-500">まだ投稿はありません。</p>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="bg-zinc-400 rounded-lg border border-gray-300 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-700 bg-gray-300 px-2 py-1 rounded">{fb.page}</span>
                <span className="text-xs text-gray-700">
                  {new Date(fb.created_at).toLocaleString('ja-JP')}
                </span>
              </div>
              <p className="text-black text-sm whitespace-pre-wrap">{fb.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
