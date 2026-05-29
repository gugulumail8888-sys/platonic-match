'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle, Send } from 'lucide-react';

const REASONS = [
  '急病・体調不良',
  '家族の緊急事態',
  '仕事の緊急対応',
  '交通機関のトラブル',
  '天災・自然災害',
  'その他',
];

export default function CancelReportPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [selectedReason, setSelectedReason] = useState('');
  const [detail, setDetail] = useState('');

  const handleSubmit = () => {
    if (!selectedReason) return;
    // TODO: Supabase連携後に実際に送信・管理者通知
    setStep('done');
  };

  if (step === 'done') {
    return (
      <div className="p-6 md:p-8 max-w-xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-teal-900 border border-teal-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-teal-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">報告を受け付けました</h1>
        <p className="text-zinc-400 text-sm mb-2 leading-relaxed">
          運営が内容を確認し、24時間以内にご連絡いたします。
        </p>
        <p className="text-zinc-500 text-xs mb-8 leading-relaxed">
          ※ キャンセルの理由・状況によってはアカウント停止となる場合があります。<br />
          やむを得ない事情がある場合は詳細をご記載ください。
        </p>
        <button
          onClick={() => router.push('/matching')}
          className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-medium transition-all"
        >
          マッチング一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-900 border border-red-800 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">キャンセル理由の報告</h1>
          <p className="text-xs text-zinc-400">お見合いをキャンセルされた方はこちらからご報告ください</p>
        </div>
      </div>

      {/* 注意バナー */}
      <div className="flex items-start gap-3 bg-amber-950/50 border border-amber-800 rounded-2xl p-4 mb-6">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-300 font-medium text-sm mb-1">ご確認ください</p>
          <p className="text-amber-400/80 text-xs leading-relaxed">
            キャンセル理由によっては違約金が発生します。<br />
            やむを得ない事情がある場合は詳細をご記載ください。運営が状況を確認した上で対応いたします。
          </p>
        </div>
      </div>

      {/* 理由選択 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5">
        <p className="text-white font-medium text-sm mb-3">キャンセル理由を選んでください <span className="text-red-400">*</span></p>
        <div className="space-y-2">
          {REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-sm text-left transition-all ${
                selectedReason === reason
                  ? 'bg-teal-950/50 border-teal-700 text-teal-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${
                selectedReason === reason ? 'bg-teal-500 border-teal-500' : 'border-zinc-600'
              }`}>
                {selectedReason === reason && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              {reason}
            </button>
          ))}
        </div>
      </div>

      {/* 詳細入力 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
        <p className="text-white font-medium text-sm mb-1">詳細・補足</p>
        <p className="text-zinc-500 text-xs mb-3">状況をできるだけ詳しく記載してください（任意）</p>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="例：急に高熱が出て病院に行く必要がありました..."
          rows={4}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-teal-700 transition-colors"
        />
      </div>

      {/* 送信ボタン */}
      <button
        onClick={handleSubmit}
        disabled={!selectedReason}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-medium transition-all ${
          selectedReason
            ? 'bg-red-700 hover:bg-red-600 text-white'
            : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
        }`}
      >
        <Send className="w-4 h-4" />
        報告を送信する
      </button>

      <p className="text-center text-xs text-zinc-600 mt-4">
        運営が内容を確認し、24時間以内にご連絡いたします
      </p>
    </div>
  );
}
