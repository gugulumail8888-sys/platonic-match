'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const MIN_SLOTS = 3
const MAX_SLOTS = 5
const TIME_OPTIONS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00']

type Slot = { date: string; time: string }

function ScheduleRequestContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const matchingId = searchParams.get('id') || ''
  const partnerName = searchParams.get('name') || 'お相手'

  const [slots, setSlots] = useState<Slot[]>([
    { date: '', time: '' },
    { date: '', time: '' },
    { date: '', time: '' },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const updateSlot = (index: number, field: 'date' | 'time', value: string) => {
    const updated = [...slots]
    updated[index] = { ...updated[index], [field]: value }
    setSlots(updated)
  }

  const addSlot = () => {
    if (slots.length >= MAX_SLOTS) return
    setSlots([...slots, { date: '', time: '' }])
  }

  const removeSlot = (index: number) => {
    if (slots.length <= MIN_SLOTS) return
    setSlots(slots.filter((_, i) => i !== index))
  }

  const filledSlots = slots.filter(s => s.date && s.time)
  const isValid = filledSlots.length >= MIN_SLOTS && !!matchingId

  const handleSubmit = async () => {
    if (!isValid || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const proposedAtList = filledSlots.map(
        (s) => new Date(`${s.date}T${s.time}:00+09:00`).toISOString()
      )

      const res = await fetch('/api/schedule/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchingId, proposedAtList }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? '送信に失敗しました')
        setSubmitting(false)
        return
      }

      router.push('/matching')
    } catch {
      setError('送信に失敗しました')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-10 px-4">
      <div className="max-w-lg mx-auto">

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📅</div>
          <h1 className="text-2xl font-bold text-white">Google Meetお見合いの日程調整</h1>
          <p className="text-zinc-400 mt-2">
            <span className="font-semibold text-pink-400">{partnerName}</span>さんとのお見合い日程を提案しましょう
          </p>
        </div>

        {/* 説明カード */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-blue-400 text-lg">ℹ️</span>
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-1">日程調整の流れ</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-400">
                <li>希望日時を{MIN_SLOTS}〜{MAX_SLOTS}個入力してください</li>
                <li>お相手が都合の良い日時を選びます</li>
                <li>確定後、Google Meetリンクをお送りします</li>
              </ol>
            </div>
          </div>
        </div>

        {/* 日時入力 */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-zinc-200 mb-4">希望日時（{MIN_SLOTS}〜{MAX_SLOTS}個）</h2>
          <div className="space-y-4">
            {slots.map((slot, index) => (
              <div key={index} className="border border-zinc-700 rounded-xl p-4 bg-zinc-800/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold
                      ${index === 0 ? 'bg-pink-500' : index === 1 ? 'bg-purple-500' : 'bg-indigo-400'}`}>
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-zinc-300">
                      第{index + 1}希望{index < MIN_SLOTS ? '（必須）' : '（任意）'}
                    </span>
                  </div>
                  {slots.length > MIN_SLOTS && (
                    <button
                      onClick={() => removeSlot(index)}
                      className="text-zinc-500 hover:text-red-400 text-xs"
                    >
                      削除
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">日付</label>
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(e) => updateSlot(index, 'date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">時間</label>
                    <select
                      value={slot.time}
                      onChange={(e) => updateSlot(index, 'time', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                    >
                      <option value="" className="bg-zinc-800">選択してください</option>
                      {TIME_OPTIONS.map(t => (
                        <option key={t} value={t} className="bg-zinc-800">{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {slots.length < MAX_SLOTS && (
            <button
              onClick={addSlot}
              className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-zinc-600 text-zinc-400 text-sm hover:border-pink-400 hover:text-pink-400 transition-colors"
            >
              ＋ 候補を追加する
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 mb-6 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all
            ${isValid && !submitting
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}
        >
          {submitting ? '送信中...' : '日程候補を送る ✉️'}
        </button>
        <p className="text-center text-xs text-zinc-500 mt-3">
          送信後、お相手に通知が届きます
        </p>
        <p className="text-center text-xs text-zinc-600 mt-2">
          <button
            onClick={() => router.push('/zoom-guide')}
            className="text-blue-400 hover:underline"
          >
            📱 Google Meetお見合い準備ガイドを見る
          </button>
        </p>
      </div>
    </div>
  )
}

export default function ScheduleRequestPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-950"><p className="text-zinc-400">読み込み中...</p></div>}>
      <ScheduleRequestContent />
    </Suspense>
  )
}
