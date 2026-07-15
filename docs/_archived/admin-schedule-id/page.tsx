'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function AdminSchedulePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [meetLink, setMeetLink] = useState('')
  const [meetDate, setMeetDate] = useState('2026年6月15日（日）14:00')
  const [memo, setMemo] = useState('')
  const [sent, setSent] = useState(false)

  const isValid = meetLink.startsWith('https://meet.google.com')

  const handleSend = () => {
    if (!isValid) return
    setSent(true)
    setTimeout(() => {
      router.push('/admin/matching')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">

        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">← 戻る</button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Google Meetリンク送信</h1>
            <p className="text-sm text-gray-400">申請番号：{id}</p>
          </div>
        </div>

        {/* 確定日程 */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="text-sm font-semibold text-green-700 mb-1">✅ 確定した日程</div>
          <div className="text-green-800 font-bold">{meetDate}</div>
        </div>

        {/* Google Meetリンク入力 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="font-semibold text-gray-700 mb-4">Google Meetリンク</h2>

          <div className="mb-4">
            <label className="text-sm text-gray-500 mb-2 block">Google Meetリンク <span className="text-red-400">*</span></label>
            <input
              type="url"
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2
                ${isValid ? 'border-green-300 focus:ring-green-200' : 'border-gray-200 focus:ring-pink-200'}`}
            />
            {meetLink && !isValid && (
              <p className="text-xs text-red-400 mt-1">正しいGoogle Meetリンクを入力してください</p>
            )}
            {isValid && (
              <p className="text-xs text-green-500 mt-1">✓ 有効なGoogle Meetリンクです</p>
            )}
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-500 mb-2 block">確定日時（確認用）</label>
            <input
              type="text"
              value={meetDate}
              onChange={(e) => setMeetDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-2 block">管理者メモ（任意）</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="特記事項があれば入力"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
            />
          </div>
        </div>

        {/* 送信内容プレビュー */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm">
          <div className="font-semibold text-gray-600 mb-2">📧 送信内容プレビュー</div>
          <div className="text-gray-500 space-y-1">
            <div>送信先：両者のメールアドレス</div>
            <div>日時：{meetDate}</div>
            <div>Google Meetリンク：{meetLink || '（未入力）'}</div>
          </div>
        </div>

        {/* 送信ボタン */}
        <button
          onClick={handleSend}
          disabled={!isValid || sent}
          className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all
            ${isValid && !sent
              ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg hover:shadow-xl hover:scale-105'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          {sent ? '送信完了！✅' : 'Google Meetリンクを両者に送信する 📨'}
        </button>
        <p className="text-center text-xs text-gray-400 mt-3">
          送信すると両者にメールで通知されます
        </p>
      </div>
    </div>
  )
}
