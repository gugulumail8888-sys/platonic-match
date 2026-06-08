'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PaymentSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-teal-950 border border-teal-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-teal-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">お支払いが完了しました</h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          ご登録ありがとうございます。プランの利用が開始されました。
        </p>
        <Button fullWidth onClick={() => router.push('/')}>
          ホームに戻る
        </Button>
      </div>
    </div>
  );
}
