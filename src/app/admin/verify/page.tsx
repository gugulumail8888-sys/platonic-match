'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShieldX, Clock, FileText, MapPin, RefreshCw, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAvatarColor } from '@/lib/utils';

type VerifyStatus = 'pending' | 'approved' | 'verified' | 'rejected';

interface VerifyItem {
  id: string;
  nickname: string;
  age: number;
  prefecture: string;
  gender: string | null;
  createdAt: string;
  status: VerifyStatus;
  frontUrl: string | null;
  backUrl: string | null;
  resubmitted_at: string | null;
  lastDeficiencySentAt: string | null;
}

// 会員管理画面(AdminMembersClient.tsx)のMEMBER_STATUS_CONFIGと同じ日本語訳に統一（自動/手動の区別のみ括弧で補足）
const STATUS_CONFIG: Record<VerifyStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending:  { label: '審査中',         className: 'bg-amber-900/50 text-amber-300 border border-amber-800', icon: Clock },
  approved: { label: '承認済み（自動）', className: 'bg-blue-900/50 text-blue-300 border border-blue-800',   icon: ShieldCheck },
  verified: { label: '手動チェック済み', className: 'bg-green-900/50 text-green-300 border border-green-800', icon: CheckSquare },
  rejected: { label: '拒否',           className: 'bg-red-900/50 text-red-300 border border-red-800',      icon: ShieldX },
};

function StatusBadge({ status }: { status: VerifyStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

type FilterTab = 'all' | VerifyStatus | 'resubmitted' | 'deficiency_pending';

const FILTER_OPTIONS: { value: FilterTab; label: string }[] = [
  { value: 'all',         label: 'すべて' },
  { value: 'pending',     label: '審査中' },
  { value: 'approved',    label: '承認済み（自動）' },
  { value: 'resubmitted', label: '再審査待ち' },
  { value: 'deficiency_pending', label: '不備通知済み(未再提出)' },
  { value: 'verified',    label: '手動チェック済み' },
  { value: 'rejected',    label: '拒否' },
];

const PAGE_SIZE = 12;

export default function AdminVerifyPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('approved');
  const [items, setItems] = useState<VerifyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchItems = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    fetch('/api/admin/verify')
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null) as { error?: string } | null;
          throw new Error(body?.error ?? '取得に失敗しました');
        }
        return res.json() as Promise<{ items: VerifyItem[] }>;
      })
      .then((data) => setItems(data.items))
      .catch((err) => setLoadError(err instanceof Error ? err.message : '取得に失敗しました'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleManualCheck = async (id: string) => {
    if (!window.confirm('この会員を手動チェック済みにしますか？')) return;
    setCheckingId(id);
    try {
      const res = await fetch(`/api/admin/verify/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'verified' }),
      });
      if (!res.ok) throw new Error('更新に失敗しました');
      setItems((prev) => prev.map((v) => v.id === id ? { ...v, status: 'verified', resubmitted_at: null } : v));
    } catch {
      alert('更新に失敗しました');
    } finally {
      setCheckingId(null);
    }
  };

  const filtered = items.filter((v) => {
    if (filter === 'all') return true;
    if (filter === 'resubmitted') return !!v.resubmitted_at;
    if (filter === 'deficiency_pending') {
      return !!v.lastDeficiencySentAt && (!v.resubmitted_at || new Date(v.resubmitted_at) < new Date(v.lastDeficiencySentAt));
    }
    return v.status === filter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const counts = {
    all:         items.length,
    pending:     items.filter((v) => v.status === 'pending').length,
    approved:    items.filter((v) => v.status === 'approved').length,
    resubmitted: items.filter((v) => !!v.resubmitted_at).length,
    deficiency_pending: items.filter((v) => !!v.lastDeficiencySentAt && (!v.resubmitted_at || new Date(v.resubmitted_at) < new Date(v.lastDeficiencySentAt))).length,
    verified:    items.filter((v) => v.status === 'verified').length,
    rejected:    items.filter((v) => v.status === 'rejected').length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">本人確認審査</h1>
          <p className="text-sm text-zinc-400 mt-0.5">全 {items.length} 件</p>
        </div>
        <button
          onClick={fetchItems}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          更新
        </button>
      </div>

      {/* フィルタータブ */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => { setFilter(opt.value); setPage(1); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-950 text-teal-400 border border-teal-900'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              {opt.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-teal-900 text-teal-300' : 'bg-zinc-700 text-zinc-400'
              }`}>
                {counts[opt.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* 一覧 */}
      {isLoading ? (
        <div className="text-center py-16 text-zinc-500">読み込み中...</div>
      ) : loadError ? (
        <div className="text-center py-16 text-red-400">{loadError}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">該当する申請が見つかりませんでした</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paged.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 hover:border-zinc-700 transition-all"
            >
              {/* 上段 */}
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 select-none"
                  style={{ background: getAvatarColor(item.id) }}
                >
                  {item.nickname.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-white font-semibold">{item.nickname}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                        <span>{item.age}歳</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-teal-500" />
                          {item.prefecture}
                        </span>
                        <span>·</span>
                        <span>{item.gender === 'male' ? '男性' : item.gender === 'female' ? '女性' : '不明'}</span>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              </div>

              {/* 書類情報 */}
              <div className="bg-zinc-800 rounded-xl p-3 mb-4 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    書類
                  </span>
                  <span className="text-zinc-200 font-medium">
                    {item.frontUrl && item.backUrl ? '提出済み' : '未提出'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">登録日</span>
                  <span className="text-zinc-200">{new Date(item.createdAt).toLocaleDateString('ja-JP')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">審査番号</span>
                  <span className="text-zinc-400 font-mono">{item.id.slice(0, 8)}</span>
                </div>
              </div>

              {/* 書類画像プレビュー */}
              {(item.frontUrl || item.backUrl) && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {item.frontUrl && (
                    <img src={item.frontUrl} alt="表面" className="w-full h-20 object-cover rounded-lg border border-zinc-700" />
                  )}
                  {item.backUrl && (
                    <img src={item.backUrl} alt="裏面" className="w-full h-20 object-cover rounded-lg border border-zinc-700" />
                  )}
                </div>
              )}

              {/* ボタンエリア */}
              <div className="space-y-2">
                {(item.status === 'approved' || !!item.resubmitted_at) && (
                  <button
                    onClick={() => handleManualCheck(item.id)}
                    disabled={checkingId === item.id}
                    className="w-full py-2 rounded-xl text-sm font-medium bg-teal-700 text-white hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckSquare className="w-4 h-4" />
                    {checkingId === item.id ? '処理中...' : '手動チェック済みにする'}
                  </button>
                )}
                <button
                  onClick={() => router.push(`/admin/verify/${item.id}`)}
                  className="w-full py-2 rounded-xl text-sm font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                >
                  {item.status === 'pending' ? '審査する' : '詳細を見る'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {!isLoading && !loadError && filtered.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-zinc-500">
            全{filtered.length}件中 {(currentPage - 1) * PAGE_SIZE + 1}〜{Math.min(currentPage * PAGE_SIZE, filtered.length)}件を表示
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
  );
}
