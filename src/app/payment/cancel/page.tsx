'use client';

import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-zinc-900 border border-zinc-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-zinc-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">お支払いがキャンセルされました</h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          決済は完了していません。引き続きご利用になりたい場合は、もう一度お試しください。
        </p>
        <Button fullWidth onClick={() => router.push('/')}>
          ホームに戻る
        </Button>
      </div>
    </div>
  );
}
