import type { Metadata } from 'next';
import { Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: 'メンテナンス中',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/10 flex items-center justify-center">
            <Wrench className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">メンテナンス中</h1>
          <p className="text-zinc-400">
            現在システムメンテナンスを行っております。しばらくお待ちください。
          </p>
        </div>
      </div>
    </div>
  );
}
