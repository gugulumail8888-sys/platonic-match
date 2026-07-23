'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// 会員向け(main)ルートグループ配下のパス接頭辞。
// これらのページ・管理画面(/admin以下)ではサイドバー等と干渉しないよう
// アイコンのみのコンパクト表示にし、それ以外の公開ページ(トップ・LP・
// ご利用の流れ・ログイン等)ではテキスト付きの横長表示にする
// (2026/7/22、ユーザー依頼「会員画面と管理者の画面ではこの小さなアイコンで良いですが、
// それ以外の画面は横長の表示だったと思います」)。
const MEMBER_AREA_PREFIXES = [
  '/dashboard', '/members', '/matching', '/messages', '/recommend',
  '/mypage', '/profile', '/report', '/cancel-report', '/marriage-report',
  '/withdraw', '/withdrawal-survey', '/zoom-check', '/omiai-survey',
  '/schedule', '/option-apply',
]

// help/contact/zoom-guideは未ログインの訪問者にも公開される案内ページのため
// パスだけでは会員/管理画面かどうか判定できない。ログイン中はこの3ページも
// 他の会員・管理画面と同じ小さいアイコン表示にする
// (2026/7/23、ユーザー報告「ログイン状態でこの3画面を開くとご意見・ご要望が
// 大きく表示される」への対応)
const LOGGED_IN_COMPACT_PREFIXES = ['/help', '/contact', '/zoom-guide']

export default function FeedbackWidget() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  const isCompact = pathname?.startsWith('/admin')
    || MEMBER_AREA_PREFIXES.some((prefix) => pathname?.startsWith(prefix))
    || (isLoggedIn && LOGGED_IN_COMPACT_PREFIXES.some((prefix) => pathname?.startsWith(prefix)))

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
      alert('送信に失敗しました。もう一度お試しください。')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-20 left-4 z-50 flex flex-col items-start gap-2">
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

      {/* フローティングボタン(会員・管理画面はアイコンのみ、それ以外は横長のテキスト付き表示) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="ご意見・ご要望"
        className={
          isCompact
            ? "bg-orange-400 hover:bg-orange-500 text-white rounded-full shadow-lg text-sm font-medium flex items-center gap-2 transition-colors p-3"
            : "bg-orange-400 hover:bg-orange-500 text-white rounded-full px-4 py-3 shadow-lg text-sm font-medium flex items-center gap-2 transition-colors"
        }
      >
        <span className="text-lg">💬</span>
        {isCompact ? (
          <span className="sr-only">ご意見・ご要望（一言でもOK）</span>
        ) : (
          <span>ご意見・ご要望（一言でもOK）</span>
        )}
      </button>
    </div>
  )
}
