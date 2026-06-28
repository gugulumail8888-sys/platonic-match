'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCard, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function OmiaiPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const matchingId = searchParams.get('matchingId');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!matchingId) {
      router.push('/matching');
    }
  }, [matchingId, router]);

  async function handlePayment() {
    if (!matchingId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/create-omiai-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '決済の準備に失敗しました');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('エラーが発生しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-950 border border-teal-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">お見合い料のお支払い</h1>
          <p className="text-zinc-400 text-sm">日程が確定しました。お見合い料をお支払いください。</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-6 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <CreditCard className="w-4 h-4 text-teal-400" />
            <span className="text-zinc-400">お支払い内容</span>
            <span className="text-white ml-auto font-medium">お見合い料</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <User className="w-4 h-4 text-teal-400" />
            <span className="text-zinc-400">プラン</span>
            <span className="text-white ml-auto">無料プラン ¥3,500 / AIプラン ¥3,000（税込）</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-teal-400" />
            <span className="text-zinc-400">決済方法</span>
            <span className="text-white ml-auto">クレジットカード</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <Button fullWidth onClick={handlePayment} disabled={loading}>
          {loading ? '処理中...' : 'Stripeでお支払いへ進む'}
        </Button>
        <button
          onClick={() => router.push('/matching')}
          className="w-full mt-3 py-3 text-zinc-400 text-sm hover:text-white transition-colors"
        >
          マッチングページに戻る
        </button>
      </div>
    </div>
  );
}
