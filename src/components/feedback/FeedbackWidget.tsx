'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSending(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('feedback').insert({
        content: content.trim(),
        user_id: user?.id ?? null,
        page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      })
      if (error) throw error
      setSent(true)
      setContent('')
      setTimeout(() => {
        setSent(false)
        setIsOpen(false)
      }, 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-20 right-6 z-50 flex flex-col items-end gap-2">
      {/* ポップアップ */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-80 p-4 border border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-800 text-sm">💬 ご意見・ご要望</h3>
              <p className="text-xs text-gray-500 mt-1">一言でOK！気軽にお送りください。</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
          {sent ? (
            <div className="text-center py-4 text-teal-600 font-medium text-sm">
              ✅ ありがとうございました！
            </div>
          ) : (
            <>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={500}
                placeholder="ご意見・ご要望・バグ報告など、なんでもお気軽にどうぞ。"
                className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-teal-400 text-gray-800 bg-white placeholder-gray-400"
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                残り {500 - content.length}文字
              </div>
              <button
                onClick={handleSubmit}
                disabled={sending || !content.trim()}
                className="mt-2 w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                {sending ? '送信中...' : '送信する'}
              </button>
            </>
          )}
        </div>
      )}

      {/* フローティングボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-3 shadow-lg text-sm font-medium flex items-center gap-2 transition-colors"
      >
        💬 <span>ご意見・ご要望（一言でもOK）</span>
      </button>
    </div>
  )
}
