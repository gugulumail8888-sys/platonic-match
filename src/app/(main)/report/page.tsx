'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Flag, Phone, MessageSquareWarning, UserX, CalendarX, FileQuestion,
  ChevronLeft, CheckCircle2,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'contact_demand', label: '連絡先の強要', icon: Phone, description: 'LINE・電話番号などを強引に求められた' },
  { id: 'inappropriate', label: '不適切な発言', icon: MessageSquareWarning, description: '性的・差別的・脅迫的な発言があった' },
  { id: 'impersonation', label: 'なりすまし', icon: UserX, description: '写真や情報が本人のものでない疑いがある' },
  { id: 'cancel', label: '無断キャンセル', icon: CalendarX, description: '連絡なしにお見合いをキャンセルされた' },
  { id: 'other', label: 'その他', icon: FileQuestion, description: '上記に当てはまらない問題' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

function ReportContent() {
  const router = useRouter();
  const params = useSearchParams();
  const applicationId = params.get('applicationId') ?? '';
  const nickname = params.get('nickname') ?? '相手の方';
  const [selected, setSelected] = useState<CategoryId | null>(null);
  const [detail, setDetail] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!selected || isSubmitting) return;
    setSubmitting(true);
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId,
        nickname,
        category: selected,
        categoryLabel: CATEGORIES.find((c) => c.id === selected)?.label,
        detail,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? '通報の送信に失敗しました');
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto p-4 md:p-6">
        <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-teal-900/40 border-2 border-teal-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">通報を受け付けました</h2>
            <p className="text-zinc-400 text-sm leading-relaxed">ご報告ありがとうございます。<br />内容を確認し、適切に対処いたします。</p>
          </div>
          <button onClick={() => router.push('/matching')} className="w-full py-3 rounded-xl border border-zinc-600 text-zinc-300 text-sm font-medium hover:bg-zinc-700 hover:text-white transition-colors">
            マッチング一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Flag className="w-4 h-4 text-rose-400" />
          <h1 className="text-base font-bold text-white">通報する</h1>
        </div>
      </div>

      <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-4">
        <p className="text-xs text-zinc-500 mb-1">通報対象</p>
        <p className="text-white font-semibold">{nickname} さん</p>
        {applicationId && <p className="text-xs text-zinc-500 mt-0.5">申請番号: {applicationId}</p>}
      </div>

      <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5 space-y-3">
        <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-4 bg-teal-500 rounded-full inline-block" />通報の種類
        </h2>
        <div className="space-y-2">
          {CATEGORIES.map(({ id, label, icon: Icon, description }) => {
            const isActive = selected === id;
            return (
              <button key={id} onClick={() => setSelected(id)}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-start gap-3 ${isActive ? 'border-rose-500 bg-rose-950/30' : 'border-zinc-700 hover:border-zinc-500'}`}>
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-rose-400' : 'text-zinc-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isActive ? 'text-rose-300' : 'text-zinc-200'}`}>{label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
                </div>
                {isActive && <span className="text-rose-400 text-xs font-bold flex-shrink-0 mt-0.5">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5 space-y-2">
        <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-4 bg-teal-500 rounded-full inline-block" />詳細（任意）
        </h2>
        <textarea value={detail} onChange={(e) => setDetail(e.target.value)}
          placeholder="具体的な状況をご記入いただけると対処がスムーズになります"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-teal-600 resize-none transition-colors"
          rows={4} />
      </div>

      <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 text-xs text-amber-400">
        ⚠️ 虚偽の通報はアカウント停止の対象となる場合があります。事実に基づいてご報告ください。
      </div>

      <div className="flex flex-col gap-3 pb-6">
        <button onClick={handleSubmit} disabled={!selected || isSubmitting}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${selected && !isSubmitting ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'}`}>
          {isSubmitting ? '送信中...' : '通報を送信する'}
        </button>
        <p className="text-xs text-center text-zinc-600">通報内容は事務局のみが確認します。相手には通知されません。</p>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><p className="text-zinc-400 text-sm">読み込み中...</p></div>}>
      <ReportContent />
    </Suspense>
  );
}
