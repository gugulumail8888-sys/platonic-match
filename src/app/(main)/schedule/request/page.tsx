'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ScheduleRequestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const applicationId = searchParams.get('id') || 'APP-001'
  const partnerName = searchParams.get('name') || 'お相手'

  const [slots, setSlots] = useState([
    { date: '', time: '' },
    { date: '', time: '' },
    { date: '', time: '' },
  ])
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const updateSlot = (index: number, field: 'date' | 'time', value: string) => {
    const updated = [...slots]
    updated[index][field] = value
    setSlots(updated)
  }

  const isValid = slots.filter(s => s.date && s.time).length >= 1

  const handleSubmit = () => {
    if (!isValid) return
    setSubmitted(true)
    setTimeout(() => {
      router.push(`/schedule/complete?id=${applicationId}&type=request`)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-10 px-4">
      <div className="max-w-lg mx-auto">

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📅</div>
          <h1 className="text-2xl font-bold text-gray-800">ZOOMお見合いの日程調整</h1>
          <p className="text-gray-500 mt-2">
            <span className="font-semibold text-pink-600">{partnerName}</span>さんとのお見合い日程を提案しましょう
          </p>
          <div className="mt-2 text-xs text-gray-400">申請番号：{applicationId}</div>
        </div>

        {/* 説明カード */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-blue-500 text-lg">ℹ️</span>
            <div className="text-sm text-blue-700">
              <p className="font-semibold mb-1">日程調整の流れ</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-600">
                <li>希望日時を最大3つ入力してください</li>
                <li>お相手が都合の良い日時を選びます</li>
                <li>確定後、ZOOMリンクをお送りします</li>
              </ol>
            </div>
          </div>
        </div>

        {/* 日時入力 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">希望日時（最大3つ）</h2>
          <div className="space-y-4">
            {slots.map((slot, index) => (
              <div key={index} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold
                    ${index === 0 ? 'bg-pink-500' : index === 1 ? 'bg-purple-500' : 'bg-indigo-400'}`}>
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-600">
                    第{index + 1}希望{index === 0 ? '（必須）' : '（任意）'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">日付</label>
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(e) => updateSlot(index, 'date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">時間</label>
                    <select
                      value={slot.time}
                      onChange={(e) => updateSlot(index, 'time', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    >
                      <option value="">選択してください</option>
                      {['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* メッセージ */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-700 mb-3">ひとことメッセージ（任意）</h2>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="例：よろしくお願いします！週末が都合が良いです。"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
          />
        </div>

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitted}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all
            ${isValid && !submitted
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          {submitted ? '送信中...' : '日程候補を送る ✉️'}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          送信後、お相手に通知が届きます
        </p>
      </div>
    </div>
  )
}

export default function ScheduleRequestPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-400">読み込み中...</p></div>}>
      <ScheduleRequestContent />
    </Suspense>
  )
}
