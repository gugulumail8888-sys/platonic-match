'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function ScheduleCompleteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams.get('type')
  const applicationId = searchParams.get('id') || 'APP-001'

  const isRequest = type === 'request'

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-3xl p-8 text-center">

          <div className="text-6xl mb-4">{isRequest ? '📨' : '🎉'}</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {isRequest ? '日程候補を送りました！' : '日程が確定しました！'}
          </h1>
          <p className="text-zinc-400 mb-6">
            {isRequest
              ? 'お相手が日程を選んだら通知が届きます。しばらくお待ちください。'
              : 'ZOOMリンクを事務局からお送りします。当日よろしくお願いします！'}
          </p>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 mb-6 text-left">
            <div className="text-xs text-zinc-500 mb-3">申請番号：{applicationId}</div>
            {isRequest ? (
              <div className="space-y-2 text-sm text-zinc-300">
                <div className="flex items-center gap-2"><span className="text-green-400">✅</span>日程候補を送信</div>
                <div className="flex items-center gap-2"><span className="text-zinc-600">⏳</span><span className="text-zinc-500">お相手が日程を選ぶ</span></div>
                <div className="flex items-center gap-2"><span className="text-zinc-600">⏳</span><span className="text-zinc-500">ZOOMリンクが届く</span></div>
                <div className="flex items-center gap-2"><span className="text-zinc-600">⏳</span><span className="text-zinc-500">ZOOMでお見合い</span></div>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-zinc-300">
                <div className="flex items-center gap-2"><span className="text-green-400">✅</span>日程候補を受け取る</div>
                <div className="flex items-center gap-2"><span className="text-green-400">✅</span>日程を確定</div>
                <div className="flex items-center gap-2"><span className="text-zinc-600">⏳</span><span className="text-zinc-500">ZOOMリンクが届く</span></div>
                <div className="flex items-center gap-2"><span className="text-zinc-600">⏳</span><span className="text-zinc-500">ZOOMでお見合い</span></div>
              </div>
            )}
          </div>

          <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-3 mb-6 text-sm text-blue-300">
            📧 確認メールをご登録のアドレスにお送りしました
          </div>

          <button
            onClick={() => router.push('/matching')}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            申請一覧に戻る
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ScheduleCompletePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-950"><p className="text-zinc-400">読み込み中...</p></div>}>
      <ScheduleCompleteContent />
    </Suspense>
  )
}
