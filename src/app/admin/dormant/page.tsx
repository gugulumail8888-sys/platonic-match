'use client';
import { useState, useEffect } from 'react';
import { Moon, Mail, AlertTriangle } from 'lucide-react';
import { getAvatarColor } from '@/lib/utils';

interface DormantMember {
  id: string;
  nickname: string;
  email: string;
  gender: string;
  prefecture: string;
  occupation: string;
  status: string;
  created_at: string;
  last_sign_in_at: string | null;
  avatar_color: string | null;
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function DormantPage() {
  const [members, setMembers] = useState<DormantMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(6);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/dormant?months=${months}`)
      .then(r => r.json())
      .then(d => setMembers(d.members ?? []))
      .finally(() => setLoading(false));
  }, [months]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Moon className="w-6 h-6 text-zinc-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">休眠会員</h1>
          <p className="text-zinc-400 text-sm">長期間ログインがない会員の一覧</p>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex gap-3 mb-6">
        {[3, 6, 12].map(m => (
          <button
            key={m}
            onClick={() => setMonths(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              months === m
                ? 'bg-teal-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {m}ヶ月以上
          </button>
        ))}
      </div>

      {/* 件数 */}
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-500" />
        <span className="text-zinc-400 text-sm">
          {months}ヶ月以上未ログイン：
          <span className="text-white font-bold ml-1">{loading ? '...' : members.length}名</span>
        </span>
      </div>

      {/* テーブル */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-xs">
              <th className="text-left p-4">会員</th>
              <th className="text-left p-4">メール</th>
              <th className="text-left p-4">最終ログイン</th>
              <th className="text-left p-4">未ログイン日数</th>
              <th className="text-left p-4">登録日</th>
              <th className="text-left p-4">ステータス</th>
              <th className="text-left p-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center p-8 text-zinc-500">読み込み中...</td></tr>
            ) : members.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-8 text-zinc-500">該当する会員はいません</td></tr>
            ) : members.map(m => {
              const days = daysSince(m.last_sign_in_at);
              const color = getAvatarColor(m.id, m.avatar_color);
              const initial = m.nickname?.charAt(0) ?? '?';
              return (
                <tr key={m.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {initial}
                      </div>
                      <div>
                        <div className="text-white font-medium">{m.nickname}</div>
                        <div className="text-zinc-500 text-xs">{m.gender === 'male' ? '男性' : '女性'} · {m.prefecture}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-400">{m.email}</td>
                  <td className="p-4 text-zinc-400">
                    {m.last_sign_in_at
                      ? new Date(m.last_sign_in_at).toLocaleDateString('ja-JP')
                      : '未ログイン'}
                  </td>
                  <td className="p-4">
                    <span className={`font-bold ${days > 365 ? 'text-red-400' : days > 180 ? 'text-yellow-400' : 'text-zinc-300'}`}>
                      {days === 9999 ? '-' : `${days}日`}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-400">
                    {new Date(m.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="p-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">
                      {m.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors">
                      <Mail className="w-3 h-3" />
                      通知メール
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
