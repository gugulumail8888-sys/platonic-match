'use client';

import { useEffect, useState } from 'react';
import {
  Download, Users, UserX, AlertCircle, Search, Loader2, ChevronLeft, ChevronRight,
  ClipboardCheck, Heart, Receipt,
} from 'lucide-react';
import { formatDateJa } from '@/lib/utils';

const STORAGE_KEYS = {
  withdrawn: 'admin_export_withdrawn_last_downloaded',
  all: 'admin_export_all_last_downloaded',
  omiaiSurveys: 'admin_export_omiai_surveys_last_downloaded',
  marriageReports: 'admin_export_marriage_reports_last_downloaded',
  refunds: 'admin_export_refunds_last_downloaded',
} as const;

type ExportKey = keyof typeof STORAGE_KEYS;

const PAGE_SIZE = 10;

const EXPORTS: {
  key: ExportKey;
  title: string;
  description: string;
  endpoint: string;
  icon: React.ElementType;
  group: string;
}[] = [
  {
    key: 'withdrawn',
    title: '退会済みユーザーCSVダウンロード',
    description: '退会手続きが完了した会員の情報をCSV形式で出力します(削除予定日時・お見合い実績・キャンセル・返金の集計列を含む全22列)。',
    endpoint: '/api/admin/export/withdrawn-users',
    icon: UserX,
    group: '会員データ',
  },
  {
    key: 'all',
    title: '全ユーザーCSVダウンロード',
    description: '退会済み会員を含む、全会員の情報をCSV形式で出力します(お見合い実績・キャンセル・返金の集計列を含む全22列)。',
    endpoint: '/api/admin/export/all-users',
    icon: Users,
    group: '会員データ',
  },
  {
    key: 'omiaiSurveys',
    title: 'お見合い後アンケートCSVダウンロード',
    description: 'お見合い後アンケートの回答をCSV形式で出力します。',
    endpoint: '/api/admin/export/omiai-surveys',
    icon: ClipboardCheck,
    group: 'アンケート・決済関連',
  },
  {
    key: 'marriageReports',
    title: '成婚報告アンケートCSVダウンロード',
    description: '成婚報告アンケートの回答をCSV形式で出力します。',
    endpoint: '/api/admin/export/marriage-reports',
    icon: Heart,
    group: 'アンケート・決済関連',
  },
  {
    key: 'refunds',
    title: '返金履歴CSVダウンロード',
    description: 'これまでの返金処理履歴をCSV形式で出力します。',
    endpoint: '/api/admin/export/refunds',
    icon: Receipt,
    group: 'アンケート・決済関連',
  },
];

// ============================================================
// ユーザー検索
// ============================================================

const inputCls =
  'bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm ' +
  'placeholder-zinc-500 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors w-full';

const selectCls =
  'bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm ' +
  'focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors w-full';

const STATUS_BADGE_CLASS: Record<string, string> = {
  pending: 'bg-amber-900/50 text-amber-300 border border-amber-800',
  approved: 'bg-green-900/50 text-green-300 border border-green-800',
  rejected: 'bg-red-900/50 text-red-300 border border-red-800',
  withdrawn: 'bg-zinc-700/50 text-zinc-300 border border-zinc-600',
};

interface SearchFormState {
  name: string;
  email: string;
  dateField: 'created_at' | 'withdrawn_at';
  dateFrom: string;
  dateTo: string;
  target: 'all' | 'withdrawn';
}

const INITIAL_SEARCH_FORM: SearchFormState = {
  name: '',
  email: '',
  dateField: 'created_at',
  dateFrom: '',
  dateTo: '',
  target: 'all',
};

interface SearchResultRow {
  id: string;
  name: string;
  email: string;
  status: string;
  statusLabel: string;
  createdAt: string;
}

// ── CSVダウンロードのトリガー ──
async function triggerCsvDownload(res: Response, fallbackFilename: string) {
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const filename = disposition.match(/filename="?([^"]+)"?/)?.[1] ?? fallbackFilename;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function AdminExportPage() {
  const [lastDownloads, setLastDownloads] = useState<Record<ExportKey, string | null>>({
    withdrawn: null,
    all: null,
    omiaiSurveys: null,
    marriageReports: null,
    refunds: null,
  });
  const [loadingKey, setLoadingKey] = useState<ExportKey | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setLastDownloads({
      withdrawn: localStorage.getItem(STORAGE_KEYS.withdrawn),
      all: localStorage.getItem(STORAGE_KEYS.all),
      omiaiSurveys: localStorage.getItem(STORAGE_KEYS.omiaiSurveys),
      marriageReports: localStorage.getItem(STORAGE_KEYS.marriageReports),
      refunds: localStorage.getItem(STORAGE_KEYS.refunds),
    });
  }, []);

  const handleDownload = async (item: typeof EXPORTS[number]) => {
    setError('');
    setLoadingKey(item.key);
    try {
      const res = await fetch(item.endpoint);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'CSVのダウンロードに失敗しました');
      }

      await triggerCsvDownload(res, `${item.key}.csv`);

      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS[item.key], now);
      setLastDownloads((prev) => ({ ...prev, [item.key]: now }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'CSVのダウンロードに失敗しました');
    } finally {
      setLoadingKey(null);
    }
  };

  // ── ユーザー検索 ──
  const [searchForm, setSearchForm] = useState<SearchFormState>(INITIAL_SEARCH_FORM);
  const [searchResults, setSearchResults] = useState<SearchResultRow[] | null>(null);
  const [searchCount, setSearchCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchDownloading, setSearchDownloading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchPage, setSearchPage] = useState(1);

  const updateSearchForm = <K extends keyof SearchFormState>(key: K, value: SearchFormState[K]) => {
    setSearchForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = async () => {
    setSearchError('');
    setSearching(true);
    try {
      const res = await fetch('/api/admin/export/search-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...searchForm, format: 'preview' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? '検索に失敗しました');
      }
      const data = await res.json();
      setSearchResults(data.results);
      setSearchCount(data.count);
      setSearchPage(1);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : '検索に失敗しました');
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchDownload = async () => {
    setSearchError('');
    setSearchDownloading(true);
    try {
      const res = await fetch('/api/admin/export/search-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...searchForm, format: 'csv' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'CSVのダウンロードに失敗しました');
      }
      await triggerCsvDownload(res, 'search_users.csv');
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'CSVのダウンロードに失敗しました');
    } finally {
      setSearchDownloading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-white">データ出力</h1>
        <p className="text-sm text-zinc-400 mt-0.5">会員データをCSV形式でダウンロードできます</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {Array.from(new Set(EXPORTS.map((item) => item.group))).map((groupName) => (
        <div key={groupName} className="space-y-3">
          <h2 className="text-xs font-bold text-teal-400 uppercase tracking-wider">{groupName}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {EXPORTS.filter((item) => item.group === groupName).map((item) => {
              const Icon = item.icon;
              const lastDownloaded = lastDownloads[item.key];
              const isLoading = loadingKey === item.key;
              return (
                <div key={item.key} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-950 border border-teal-900 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {isLoading ? 'ダウンロード中...' : 'CSVダウンロード'}
                  </button>

                  <p className="text-xs text-zinc-500">
                    最終ダウンロード日時：
                    {lastDownloaded ? formatDateJa(lastDownloaded, 'yyyy年MM月dd日 HH:mm') : '未ダウンロード'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ユーザー検索＆CSV出力 */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-950 border border-teal-900 rounded-xl flex items-center justify-center flex-shrink-0">
            <Search className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">ユーザー検索＆CSV出力</h2>
            <p className="text-xs text-zinc-500 mt-0.5">条件を指定して該当ユーザーを検索し、結果をCSV出力できます。</p>
          </div>
        </div>

        {/* 検索フォーム */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">氏名（部分一致）</label>
            <input
              type="text"
              value={searchForm.name}
              onChange={(e) => updateSearchForm('name', e.target.value)}
              className={inputCls}
              placeholder="例：山田"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">メールアドレス（部分一致）</label>
            <input
              type="text"
              value={searchForm.email}
              onChange={(e) => updateSearchForm('email', e.target.value)}
              className={inputCls}
              placeholder="例：example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">検索対象</label>
            <select
              value={searchForm.target}
              onChange={(e) => updateSearchForm('target', e.target.value as SearchFormState['target'])}
              className={selectCls}
            >
              <option value="all">全ユーザー</option>
              <option value="withdrawn">退会済みのみ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">日時種別</label>
            <select
              value={searchForm.dateField}
              onChange={(e) => updateSearchForm('dateField', e.target.value as SearchFormState['dateField'])}
              className={selectCls}
            >
              <option value="created_at">登録日</option>
              <option value="withdrawn_at">退会日</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">開始日</label>
            <input
              type="date"
              value={searchForm.dateFrom}
              onChange={(e) => updateSearchForm('dateFrom', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">終了日</label>
            <input
              type="date"
              value={searchForm.dateTo}
              onChange={(e) => updateSearchForm('dateTo', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <p className="text-xs text-zinc-500">※選択した日時種別の期間で絞り込みます</p>

        {searchError && (
          <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {searchError}
          </div>
        )}

        {/* ボタン */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            検索
          </button>
          <button
            type="button"
            onClick={handleSearchDownload}
            disabled={searchDownloading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            {searchDownloading ? 'ダウンロード中...' : '検索結果をCSVダウンロード'}
          </button>
        </div>

        {/* プレビュー */}
        {searchResults && (() => {
          const totalPages = Math.max(1, Math.ceil(searchResults.length / PAGE_SIZE));
          const currentPage = Math.min(searchPage, totalPages);
          const pagedResults = searchResults.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
          return (
            <div>
              <p className="text-sm text-zinc-300 mb-3">検索結果：{searchCount}件</p>
              {searchResults.length > 0 ? (
                <>
                  <div className="overflow-x-auto rounded-lg border border-zinc-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-zinc-800/60 text-zinc-400 text-xs">
                          <th className="text-left font-medium px-3 py-2">氏名</th>
                          <th className="text-left font-medium px-3 py-2">メールアドレス</th>
                          <th className="text-left font-medium px-3 py-2">ステータス</th>
                          <th className="text-left font-medium px-3 py-2">登録日</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {pagedResults.map((row) => (
                          <tr key={row.id} className="text-zinc-200">
                            <td className="px-3 py-2 whitespace-nowrap">{row.name || '-'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-zinc-400">{row.email || '-'}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE_CLASS[row.status] ?? 'bg-zinc-700/50 text-zinc-300 border border-zinc-600'}`}>
                                {row.statusLabel}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-zinc-400">{row.createdAt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between px-1 py-3">
                    <span className="text-xs text-zinc-500">
                      全{searchResults.length}件中 {(currentPage - 1) * PAGE_SIZE + 1}〜{Math.min(currentPage * PAGE_SIZE, searchResults.length)}件を表示
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSearchPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        前へ
                      </button>
                      <span className="text-xs text-zinc-400">{currentPage} / {totalPages}</span>
                      <button
                        onClick={() => setSearchPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        次へ
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-zinc-500">該当するユーザーが見つかりませんでした。</p>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
