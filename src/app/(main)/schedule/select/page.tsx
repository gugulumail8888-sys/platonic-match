'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type ScheduleSlot = {
  id: string
  matching_id: string
  proposed_at: string
  proposed_by: string | null
  is_selected: boolean
  created_at: string
}

function formatSlot(proposedAt: string) {
  const d = new Date(proposedAt)
  const date = d.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })
  const time = d.toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' })
  return { date, time }
}

function ScheduleSelectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const matchingId = searchParams.get('id') || ''
  const partnerName = searchParams.get('name') || 'お相手'

  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!matchingId) {
      setLoading(false)
      return
    }
    fetch(`/api/schedule/slots?matchingId=${matchingId}`)
      .then((r) => r.json())
      .then((data: ScheduleSlot[]) => setSlots(Array.isArray(data) ? data : []))
      .catch(() => setError('候補日程の取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [matchingId])

  const handleConfirm = async () => {
    if (selected === null || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/schedule/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: selected }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? '確定に失敗しました')
        setSubmitting(false)
        return
      }

      router.push('/matching')
    } catch {
      setError('確定に失敗しました')
      setSubmitting(false)
    }
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
        </div>

        {/* 候補日程 */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 mb-6">
          <h2 className="font-semibold text-zinc-200 mb-4">候補日程</h2>

          {loading ? (
            <p className="text-zinc-500 text-sm text-center py-6">読み込み中...</p>
          ) : slots.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-6">候補日程がまだ届いていません</p>
          ) : (
            <div className="space-y-3">
              {slots.map((slot, index) => {
                const { date, time } = formatSlot(slot.proposed_at)
                return (
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
                        <div className="text-xs text-zinc-500 mb-1">第{index + 1}希望</div>
                        <div className="font-semibold text-zinc-100">{date}</div>
                        <div className="text-pink-400 font-bold text-lg">{time}〜</div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${selected === slot.id ? 'border-pink-500 bg-pink-500' : 'border-zinc-500'}`}>
                        {selected === slot.id && <span className="text-white text-xs">✓</span>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-3 mb-6 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* 確定ボタン */}
        <button
          onClick={handleConfirm}
          disabled={selected === null || submitting}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all
            ${selected !== null && !submitting
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}
        >
          {submitting ? '確定中...' : 'この日程で確定する 🎉'}
        </button>
        <p className="text-center text-xs text-zinc-500 mt-3">
          確定後、Google Meetリンクをお送りします
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

export default function ScheduleSelectPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-950"><p className="text-zinc-400">読み込み中...</p></div>}>
      <ScheduleSelectContent />
    </Suspense>
  )
}
