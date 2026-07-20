'use client';
import { useState, useEffect } from 'react';
import { Moon, Mail, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAvatarColor } from '@/lib/utils';

const PAGE_SIZE = 10;

// 会員管理画面(AdminMembersClient.tsx)のMEMBER_STATUS_CONFIGと同じ日本語訳に統一
const STATUS_LABELS: Record<string, string> = {
  pending: '審査中',
  approved: '承認済み',
  verified: '手動チェック済み',
  rejected: '拒否',
  withdrawn: '退会済み',
};

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
  dormant_notice_sent_at: string | null;
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function DormantPage() {
  const [members, setMembers] = useState<DormantMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(6);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/dormant?months=${months}`)
      .then(r => r.json())
      .then(d => setMembers(d.members ?? []))
      .finally(() => setLoading(false));
  }, [months]);

  useEffect(() => {
    setPage(1);
  }, [months]);

  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = members.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleNotify = async (id: string, nickname: string, alreadySentAt: string | null) => {
    const confirmMessage = alreadySentAt
      ? `${nickname} さんには ${new Date(alreadySentAt).toLocaleDateString('ja-JP')} に通知メールを送信済みです。再度送信しますか？(自動送信バッチと重複する可能性があります)`
      : `${nickname} さんに通知メールを送信しますか？(自動送信バッチの対象になっている場合、後日重複して届く可能性は低くなります)`;
    if (!window.confirm(confirmMessage)) return;
    setSendingId(id);
    try {
      const res = await fetch('/api/admin/dormant/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? '送信に失敗しました');
        return;
      }
      alert('通知メールを送信しました');
    } catch {
      alert('送信に失敗しました');
    } finally {
      setSendingId(null);
    }
  };

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
      <p className="text-xs text-zinc-500 mb-6 -mt-4">
        ※自動通知バッチは335日(約11ヶ月)以上未ログインの会員のみを対象に送信されます。3・6ヶ月のフィルタは早期の状況把握用で、自動通知の対象ではありません。
      </p>

      {/* 件数 */}
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-500" />
        <span className="text-zinc-400 text-sm">
          {months}ヶ月以上未ログイン：
          <span className="text-white font-bold ml-1">{loading ? '...' : members.length}名</span>
        </span>
      </div>

      {/* テーブル */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-xs">
              <th className="text-left p-4 whitespace-nowrap">会員</th>
              <th className="text-left p-4 whitespace-nowrap">メール</th>
              <th className="text-left p-4 whitespace-nowrap">最終ログイン</th>
              <th className="text-left p-4 whitespace-nowrap">未ログイン日数</th>
              <th className="text-left p-4 whitespace-nowrap">登録日</th>
              <th className="text-left p-4 whitespace-nowrap">ステータス</th>
              <th className="text-left p-4 whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center p-8 text-zinc-500">読み込み中...</td></tr>
            ) : members.length === 0 ? (
              <tr><td colSpan={7} className="text-center p-8 text-zinc-500">該当する会員はいません</td></tr>
            ) : paged.map(m => {
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
                      {STATUS_LABELS[m.status] ?? m.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleNotify(m.id, m.nickname, m.dormant_notice_sent_at)}
                        disabled={sendingId === m.id}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Mail className="w-3 h-3" />
                        {sendingId === m.id ? '送信中...' : m.dormant_notice_sent_at ? '再送信' : '通知メール'}
                      </button>
                      {m.dormant_notice_sent_at && (
                        <span className="text-[10px] text-zinc-500">
                          送信済み：{new Date(m.dormant_notice_sent_at).toLocaleDateString('ja-JP')}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && members.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">
              全{members.length}名中 {(currentPage - 1) * PAGE_SIZE + 1}〜{Math.min(currentPage * PAGE_SIZE, members.length)}名を表示
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                前へ
              </button>
              <span className="text-xs text-zinc-400">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
              >
                次へ
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
