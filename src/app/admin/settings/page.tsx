import { Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">設定</h1>
        <p className="text-sm text-zinc-400 mt-0.5">amista 管理者設定</p>
      </div>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-12 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center">
          <Settings className="w-7 h-7 text-zinc-500" />
        </div>
        <div>
          <p className="text-white font-semibold text-lg">準備中</p>
          <p className="text-zinc-500 text-sm mt-1">この機能は現在開発中です。</p>
        </div>
      </div>
    </div>
  );
}
