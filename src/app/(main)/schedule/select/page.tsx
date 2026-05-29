'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const DUMMY_SLOTS = [
  { id: 1, date: '2025年6月15日（日）', time: '14:00', label: '第1希望' },
  { id: 2, date: '2025年6月16日（月）', time: '19:00', label: '第2希望' },
  { id: 3, date: '2025年6月18日（水）', time: '20:00', label: '第3希望' },
]

function ScheduleSelectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const applicationId = searchParams.get('id') || 'APP-001'
  const partnerName = searchParams.get('name') || 'お相手'

  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const handleConfirm = () => {
    if (selected === null) return
    setSubmitted(true)
    setTimeout(() => {
      router.push(`/schedule/complete?id=${applicationId}&type=select`)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-10 px-4">
      <div className="max-w-lg mx-auto">

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🗓️</div>
          <h1 className="text-2xl font-bold text-white">日程を選んでください</h1>
          <p className="text-zinc-400 mt-2">
            <span className="font-semibold text-pink-400">{partnerName}</span>さんからの候補日程です
          </p>
          <div className="mt-2 text-xs text-zinc-500">申請番号：{applicationId}</div>
        </div>

        {/* 候補日程 */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-zinc-200 mb-4">候補日程</h2>
          <div className="space-y-3">
            {DUMMY_SLOTS.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelected(slot.id)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all
                  ${selected === slot.id
                    ? 'border-pink-500 bg-pink-500/10'
                    : 'border-zinc-600 hover:border-pink-500/50 hover:bg-zinc-700/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">{slot.label}</div>
                    <div className="font-semibold text-zinc-100">{slot.date}</div>
                    <div className="text-pink-400 font-bold text-lg">{slot.time}〜</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${selected === slot.id ? 'border-pink-500 bg-pink-500' : 'border-zinc-500'}`}>
                    {selected === slot.id && <span className="text-white text-xs">✓</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 選択内容確認 */}
        {selected && (
          <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✅</span>
              <div>
                <div className="text-sm font-semibold text-green-300">選択中</div>
                <div className="text-sm text-green-400">
                  {DUMMY_SLOTS.find(s => s.id === selected)?.date} {DUMMY_SLOTS.find(s => s.id === selected)?.time}〜
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 確定ボタン */}
        <button
          onClick={handleConfirm}
          disabled={selected === null || submitted}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all
            ${selected !== null && !submitted
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}
        >
          {submitted ? '確定中...' : 'この日程で確定する 🎉'}
        </button>
        <p className="text-center text-xs text-zinc-500 mt-3">
          確定後、ZOOMリンクをお送りします
        </p>
        <p className="text-center text-xs text-zinc-600 mt-2">
          <button
            onClick={() => router.push('/zoom-guide')}
            className="text-blue-400 hover:underline"
          >
            📱 ZOOMお見合い準備ガイドを見る
          </button>
        </p>
      </div>
    </div>
  )
}

export default function ScheduleSelectPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-950"><p className="text-zinc-400">読み込み中...</p></div>}>
      <ScheduleSelectContent />
    </Suspense>
  )
}
