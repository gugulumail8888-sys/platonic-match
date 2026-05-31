'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ChevronRight } from 'lucide-react';

const REASONS = [
  { value: 'found_partner', label: '良いパートナーが見つかった' },
  { value: 'expensive',     label: '費用が高い' },
  { value: 'hard_to_use',   label: '使いにくかった' },
  { value: 'other',         label: 'その他' },
] as const;

type ReasonValue = typeof REASONS[number]['value'];

export default function WithdrawPage() {
  const router = useRouter();
  const [reason, setReason] = useState<ReasonValue | ''>('');

  const handleWithdraw = () => {
    console.log('退会処理:', { reason });
  };

  return (
    <div className="p-6 md:p-8 max-w-md mx-auto py-12">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-950 border border-red-800 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white">退会のお手続き</h1>
      </div>

      {/* 注意文 */}
      <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-4 mb-6">
        <p className="text-red-300 text-sm font-medium mb-2">退会するとすべてのデータが削除されます</p>
        <ul className="space-y-1 text-xs text-red-400/80">
          <li className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
            プロフィール情報
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
            いいね・マッチング履歴
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
            メッセージ履歴
          </li>
        </ul>
        <p className="text-red-400/70 text-xs mt-2">この操作は取り消せません。</p>
      </div>

      {/* 退会理由 */}
      <div className="mb-6">
        <p className="text-sm text-zinc-400 mb-3">
          退会理由を教えてください
          <span className="text-zinc-600 ml-1.5 text-xs">（任意）</span>
        </p>
        <div className="space-y-2">
          {REASONS.map(({ value, label }) => {
            const selected = reason === value;
            return (
              <label
                key={value}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                  selected
                    ? 'border-teal-600 bg-teal-900/20 text-teal-300'
                    : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800'
                }`}
              >
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'border-teal-400' : 'border-zinc-600'}`}>
                  {selected && <span className="w-2 h-2 rounded-full bg-teal-400 block" />}
                </span>
                <input
                  type="radio"
                  name="reason"
                  value={value}
                  checked={selected}
                  onChange={() => setReason(value)}
                  className="sr-only"
                />
                <span className="text-sm">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ボタン */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleWithdraw}
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all text-sm"
        >
          退会する <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => router.push('/mypage')}
          className="w-full py-3 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-2xl hover:bg-zinc-700 transition-all text-sm font-medium"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
