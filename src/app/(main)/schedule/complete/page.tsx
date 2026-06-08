'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CreditCard, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

function PaymentSection() {
  const [isPremium, setIsPremium] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => setIsPremium(data.profile?.is_premium ?? false))
      .catch(() => {})
      .finally(() => setLoadingProfile(false))
  }, [])

  const handleCheckout = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'お支払い処理を開始できませんでした')
        setSubmitting(false)
      }
    } catch {
      setError('お支払い処理を開始できませんでした')
      setSubmitting(false)
    }
  }

  if (loadingProfile) return null

  return (
    <div className="bg-teal-950/40 border border-teal-800/60 rounded-2xl p-4 mb-6 text-left">
      <div className="flex items-start gap-3 mb-3">
        <CreditCard className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-teal-300 font-medium text-sm mb-1">お支払いについて</p>
          <p className="text-teal-400/80 text-xs leading-relaxed">
            お見合い前日までにお支払いください。
          </p>
        </div>
      </div>

      {isPremium ? (
        <div className="flex items-center gap-2 text-sm text-teal-300 bg-teal-900/40 border border-teal-800/60 rounded-xl px-3 py-2.5">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          お支払い済み
        </div>
      ) : (
        <>
          <Button fullWidth onClick={handleCheckout} disabled={submitting} isLoading={submitting}>
            お支払いに進む
          </Button>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </>
      )}
    </div>
  )
}

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

          {!isRequest && <PaymentSection />}

          <p className="text-xs text-zinc-500 mb-4">
            キャンセル・変更をご希望の方は
            <button
              onClick={() => router.push('/cancel-policy')}
              className="text-teal-500 hover:underline mx-1"
            >
              キャンセルポリシー
            </button>
            をご確認ください
          </p>

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
