'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2, MapPin, Receipt, Bot, TriangleAlert,
  Users, ClipboardList, Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ============================================================
// コンテンツ（useSearchParams を使用するため Suspense 必要）
// ============================================================

function CompleteContent() {
  const params = useSearchParams();

  const applicationId  = params.get('applicationId') ?? 'APP-000';
  const nickname       = params.get('nickname') ?? '';
  const age            = params.get('age') ?? '';
  const prefecture     = params.get('prefecture') ?? '';
  const notifyMessage  = params.get('notifyMessage') ?? '';
  const isDemo         = params.get('isDemo') === 'true';

  // ニックネームの頭文字をアバターに使用
  const initial = nickname ? nickname[0] : '?';

  return (
    <div className="max-w-lg mx-auto p-4 md:p-6 space-y-4">

      {/* ===== 完了ヘッダー ===== */}
      <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-8 text-center">
        <div className="w-20 h-20 bg-teal-900/40 border-2 border-teal-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-teal-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-1">
          お見合い申請が完了しました！
        </h1>
        <p className="text-zinc-400 text-sm">
          申請を受け付けました。運営スタッフよりご連絡します。
        </p>
      </div>

      {/* ===== 申請内容 ===== */}
      <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5 space-y-4">
        <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-4 bg-teal-500 rounded-full inline-block" />
          申請内容
        </h2>

        {/* 相手情報 */}
        <div className="flex items-center gap-3 py-3 border-b border-zinc-700">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 select-none"
            style={{ background: '#0d9488' }}
          >
            {initial}
          </div>
          <div>
            <p className="text-white font-semibold">{nickname}</p>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <span>{age}歳</span>
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-teal-500" />
                {prefecture}
              </span>
            </div>
          </div>
        </div>

        {/* 申請番号・料金 */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <ClipboardList className="w-3.5 h-3.5" />
              申請番号
            </span>
            <span className="text-white font-mono font-medium">{applicationId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Receipt className="w-3.5 h-3.5" />
              料金
            </span>
            <span className="text-white font-medium">無料プラン ¥3,500（税込）・AIおすすめプラン ¥3,000（税込）</span>
          </div>
        </div>
      </div>

      {/* ===== AI通知メッセージ ===== */}
      {notifyMessage && (
        <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5 space-y-3">
          <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-4 bg-teal-500 rounded-full inline-block" />
            相手の方へ以下の通知が送られます
          </h2>

          {/* デモバナー */}
          {isDemo && (
            <div className="flex items-start gap-2 bg-amber-950/50 border border-amber-800 rounded-xl px-3 py-2">
              <TriangleAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300 text-xs">
                ※ 現在はデモ表示です。本番環境ではAIが実際に通知文を生成します。
              </p>
            </div>
          )}

          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-700">
            <div className="flex items-center gap-1.5 mb-2">
              <Bot className="w-3.5 h-3.5 text-teal-400" />
              <p className="text-xs text-teal-400 font-medium">AI生成通知文</p>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">
              {notifyMessage}
            </p>
          </div>
        </div>
      )}

      {/* ===== 今後の流れ ===== */}
      <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5">
        <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2 mb-4">
          <span className="w-1 h-4 bg-teal-500 rounded-full inline-block" />
          今後の流れ
        </h2>
        <div className="space-y-3">
          {[
            { step: '1', text: '運営スタッフより3営業日以内にメールにてご連絡いたします。' },
            { step: '2', text: 'Google MeetのURLをお送りしますので、ご確認ください。' },
            { step: '3', text: 'お互いの都合に合わせてお見合い日程を調整します。' },
          ].map(({ step, text }) => (
            <div key={step} className="flex gap-3 text-sm">
              <div className="w-5 h-5 bg-teal-900/50 border border-teal-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-teal-400 text-xs font-bold">{step}</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== アクションボタン ===== */}
      <div className="flex flex-col gap-3 pb-6">
        <Link href="/members">
          <Button fullWidth>
            <Users className="w-4 h-4" />
            メンバー一覧に戻る
          </Button>
        </Link>
        <Link
          href="/matching"
          className="w-full py-2.5 rounded-xl border border-zinc-600 text-zinc-300 text-sm font-medium hover:bg-zinc-800 hover:text-white transition-colors flex items-center justify-center gap-2"
        >
          <ClipboardList className="w-4 h-4" />
          申請履歴を見る
        </Link>
      </div>

      {/* 通報リンク */}
      <div className="pb-6 flex justify-center">
        <a
          href={`/report?applicationId=${applicationId}&nickname=${encodeURIComponent(nickname)}`}
          className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-rose-400 transition-colors"
        >
          <Flag className="w-3 h-3" />
          この相手を通報する
        </a>
      </div>
    </div>
  );
}

// ============================================================
// Page（Suspense ラッパー）
// ============================================================

export default function CompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-zinc-400 text-sm">読み込み中...</p>
        </div>
      }
    >
      <CompleteContent />
    </Suspense>
  );
}
