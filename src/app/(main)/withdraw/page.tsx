'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, Ban, ChevronRight, Loader2 } from 'lucide-react';

const REASONS = [
  { value: 'found_partner', label: '良いパートナーが見つかった' },
  { value: 'expensive',     label: '費用が高い' },
  { value: 'hard_to_use',   label: '使いにくかった' },
  { value: 'other',         label: 'その他' },
] as const;

type ReasonValue = typeof REASONS[number]['value'];

type WithdrawCheck = {
  optionDaysRemaining: number | null;
  hasSentPending: boolean;
  receivedPendingCount: number;
};

type Step = 'loading' | 'option-warning' | 'sent-blocked' | 'received-blocked' | 'form';

// ============================================================
// 退会前チェック画面（オプション警告 / お見合いブロック）
// ============================================================

function PreCheckCard({
  tone, icon: Icon, message, children,
}: {
  tone: 'warning' | 'block';
  icon: React.ElementType;
  message: string;
  children: React.ReactNode;
}) {
  const colors = tone === 'warning'
    ? {
        iconBg: 'bg-orange-950 border-orange-800',
        iconColor: 'text-orange-400',
        boxBg: 'bg-orange-950/20 border-orange-900/50',
        text: 'text-orange-300',
      }
    : {
        iconBg: 'bg-red-950 border-red-800',
        iconColor: 'text-red-400',
        boxBg: 'bg-red-950/20 border-red-900/50',
        text: 'text-red-300',
      };

  return (
    <div className="p-6 md:p-8 max-w-md mx-auto py-12">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 border rounded-xl flex items-center justify-center flex-shrink-0 ${colors.iconBg}`}>
          <Icon className={`w-5 h-5 ${colors.iconColor}`} />
        </div>
        <h1 className="text-xl font-bold text-white">退会のお手続き</h1>
      </div>

      <div className={`border rounded-2xl p-4 mb-6 ${colors.boxBg}`}>
        <p className={`text-sm font-medium leading-relaxed ${colors.text}`}>{message}</p>
      </div>

      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

export default function WithdrawPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('loading');
  const [check, setCheck] = useState<WithdrawCheck | null>(null);
  const [reason, setReason] = useState<ReasonValue | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/account/withdraw-check')
      .then((res) => res.json())
      .then((data: WithdrawCheck) => {
        setCheck(data);
        if (data.optionDaysRemaining !== null) {
          setStep('option-warning');
        } else if (data.hasSentPending) {
          setStep('sent-blocked');
        } else if (data.receivedPendingCount > 0) {
          setStep('received-blocked');
        } else {
          setStep('form');
        }
      })
      .catch(() => setStep('form'));
  }, []);

  const proceedAfterOptionWarning = () => {
    if (check?.hasSentPending) {
      setStep('sent-blocked');
    } else if ((check?.receivedPendingCount ?? 0) > 0) {
      setStep('received-blocked');
    } else {
      setStep('form');
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('本当に退会しますか？この操作は取り消せません。')) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/account/withdraw', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? '退会処理に失敗しました');
      }
      router.push('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : '退会処理に失敗しました');
      setSubmitting(false);
    }
  };

  // ── 読み込み中 ──
  if (step === 'loading') {
    return (
      <div className="p-6 md:p-8 max-w-md mx-auto py-12 flex items-center justify-center text-zinc-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> 確認中...
      </div>
    );
  }

  // ── ① オプション契約中チェック ──
  if (step === 'option-warning') {
    return (
      <PreCheckCard
        tone="warning"
        icon={Clock}
        message={`オプションプランの有効期限があと${check?.optionDaysRemaining}日あります。期限終了後の退会をお勧めします。`}
      >
        <button
          type="button"
          onClick={proceedAfterOptionWarning}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all text-sm"
        >
          このまま退会する <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => router.push('/mypage')}
          className="w-full py-3 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-2xl hover:bg-zinc-700 transition-all text-sm font-medium"
        >
          戻る
        </button>
      </PreCheckCard>
    );
  }

  // ── ② お見合い申請中チェック（自分が申請している） ──
  if (step === 'sent-blocked') {
    return (
      <PreCheckCard
        tone="block"
        icon={Ban}
        message="現在お見合いの申請中です。お見合い終了後に退会手続きをしてください。"
      >
        <button
          type="button"
          onClick={() => router.push('/mypage')}
          className="w-full py-3 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-2xl hover:bg-zinc-700 transition-all text-sm font-medium"
        >
          戻る
        </button>
      </PreCheckCard>
    );
  }

  // ── ③ お見合い申請受信チェック（相手から来ている） ──
  if (step === 'received-blocked') {
    return (
      <PreCheckCard
        tone="block"
        icon={Ban}
        message={`${check?.receivedPendingCount}件のお見合い申請が届いています。申請を確認してから退会手続きをしてください。`}
      >
        <button
          type="button"
          onClick={() => router.push('/mypage')}
          className="w-full py-3 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-2xl hover:bg-zinc-700 transition-all text-sm font-medium"
        >
          戻る
        </button>
      </PreCheckCard>
    );
  }

  // ── 退会理由フォーム ──
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

      {/* エラー */}
      {error && (
        <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {/* ボタン */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleWithdraw}
          disabled={submitting}
          className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all text-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> 処理中...
            </>
          ) : (
            <>
              退会する <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push('/mypage')}
          disabled={submitting}
          className="w-full py-3 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-2xl hover:bg-zinc-700 disabled:opacity-50 transition-all text-sm font-medium"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
