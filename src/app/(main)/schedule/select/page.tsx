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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-10 px-4">
      <div className="max-w-lg mx-auto">

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🗓️</div>
          <h1 className="text-2xl font-bold text-gray-800">日程を選んでください</h1>
          <p className="text-gray-500 mt-2">
            <span className="font-semibold text-pink-600">{partnerName}</span>さんからの候補日程です
          </p>
          <div className="mt-2 text-xs text-gray-400">申請番号：{applicationId}</div>
        </div>

        {/* 候補日程 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">候補日程</h2>
          <div className="space-y-3">
            {DUMMY_SLOTS.map((slot) => (
              <button
                key={slot.id}
                onClick={() => setSelected(slot.id)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all
                  ${selected === slot.id
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">{slot.label}</div>
                    <div className="font-semibold text-gray-800">{slot.date}</div>
                    <div className="text-pink-600 font-bold text-lg">{slot.time}〜</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${selected === slot.id ? 'border-pink-500 bg-pink-500' : 'border-gray-300'}`}>
                    {selected === slot.id && <span className="text-white text-xs">✓</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 選択内容確認 */}
        {selected && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <div>
                <div className="text-sm font-semibold text-green-700">選択中</div>
                <div className="text-sm text-green-600">
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
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          {submitted ? '確定中...' : 'この日程で確定する 🎉'}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          確定後、ZOOMリンクをお送りします
        </p>
      </div>
    </div>
  )
}

export default function ScheduleSelectPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-400">読み込み中...</p></div>}>
      <ScheduleSelectContent />
    </Suspense>
  )
}
