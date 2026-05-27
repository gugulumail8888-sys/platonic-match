'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MapPin, Bot, X, ChevronRight, FileText,
} from 'lucide-react';
import {
  ADMIN_APPLICATIONS,
  APP_STATUS_CONFIG,
  type AdminApplication, type AppStatus,
} from '../_data';

// ============================================================
// Sub-components
// ============================================================

function StatusBadge({ status }: { status: AppStatus }) {
  const cfg = APP_STATUS_CONFIG[status];
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function MemberChip({
  nickname, age, prefecture, avatarColor, initials, occupation,
}: {
  nickname: string; age: number; prefecture: string;
  avatarColor: string; initials: string; occupation: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: avatarColor }}
      >
        {initials}
      </div>
      <div>
        <p className="text-zinc-100 text-sm font-medium">{nickname}</p>
        <p className="text-zinc-500 text-xs flex items-center gap-1">
          {age}歳
          <span>·</span>
          <MapPin className="w-2.5 h-2.5 text-teal-500" />
          {prefecture}
        </p>
      </div>
    </div>
  );
}

// ── 詳細モーダル ──────────────────────────────────────────────

function DetailModal({
  app,
  onClose,
  onStatusChange,
}: {
  app: AdminApplication;
  onClose: () => void;
  onStatusChange: (id: string, status: AppStatus) => void;
}) {
  const [note, setNote] = useState(app.adminNote);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const nextStatus: AppStatus | null =
    app.status === 'pending'    ? 'scheduling' :
    app.status === 'scheduling' ? 'completed'  : null;

  const nextLabel =
    app.status === 'pending'    ? '日程調整中に進める →' :
    app.status === 'scheduling' ? '完了にする →'          : null;

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white">{app.id}</h2>
            <div className="mt-1">
              <StatusBadge status={app.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* 両者プロフィール概要 */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">申請者 → お相手</p>
            <div className="grid grid-cols-1 gap-3">
              {/* 申請者 */}
              <div className="bg-zinc-800 rounded-xl p-4">
                <p className="text-[10px] text-zinc-500 mb-2">申請者</p>
                <MemberChip {...app.applicant} />
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <Link
                    href={`/admin/members/${app.applicant.id}`}
                    className="text-teal-400 hover:text-teal-300 flex items-center gap-0.5 transition-colors"
                  >
                    詳細を見る <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
              {/* 相手 */}
              <div className="bg-zinc-800 rounded-xl p-4">
                <p className="text-[10px] text-zinc-500 mb-2">お相手</p>
                <MemberChip {...app.target} />
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <Link
                    href={`/admin/members/${app.target.id}`}
                    className="text-teal-400 hover:text-teal-300 flex items-center gap-0.5 transition-colors"
                  >
                    詳細を見る <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* AI相性スコア */}
          <div className="bg-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Bot className="w-3.5 h-3.5 text-teal-400" />
              <p className="text-xs font-semibold text-teal-400 uppercase tracking-wide">AI相性分析</p>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 bg-zinc-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    app.aiScore >= 80 ? 'bg-teal-500' :
                    app.aiScore >= 65 ? 'bg-teal-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${app.aiScore}%` }}
                />
              </div>
              <span className={`text-xl font-bold tabular-nums ${
                app.aiScore >= 80 ? 'text-teal-400' :
                app.aiScore >= 65 ? 'text-teal-500' : 'text-amber-400'
              }`}>
                {app.aiScore}
              </span>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed">{app.aiComment}</p>
          </div>

          {/* 申請詳細 */}
          <div className="text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-zinc-500">申請日</span>
              <span className="text-zinc-200">{app.appliedAt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">料金</span>
              <span className="text-zinc-200">¥{app.amount.toLocaleString()}（税込）</span>
            </div>
          </div>

          {/* ステータス変更 */}
          {nextStatus && nextLabel && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">ステータス変更</p>
              <button
                onClick={() => { onStatusChange(app.id, nextStatus); onClose(); }}
                className="w-full py-2.5 rounded-xl bg-teal-700 text-white text-sm font-medium hover:bg-teal-600 transition-colors"
              >
                {nextLabel}
              </button>
            </div>
          )}

          {/* 管理者メモ */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                管理者メモ
              </span>
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="管理者メモを入力..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              {saved && (
                <span className="text-xs text-teal-400">✓ 保存しました</span>
              )}
              <button
                onClick={handleSave}
                className="ml-auto px-3 py-1.5 rounded-lg bg-zinc-700 text-zinc-200 text-xs hover:bg-zinc-600 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

type StatusFilter = 'all' | AppStatus;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',        label: 'すべて' },
  { value: 'pending',    label: '申請中' },
  { value: 'scheduling', label: '日程調整中' },
  { value: 'completed',  label: '完了' },
];

export default function AdminMatchingPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [applications, setApplications] = useState<AdminApplication[]>(ADMIN_APPLICATIONS);
  const [selectedApp, setSelectedApp]   = useState<AdminApplication | null>(null);
  const [toast, setToast]               = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const filtered = applications.filter((a) =>
    statusFilter === 'all' ? true : a.status === statusFilter
  );

  const handleStatusChange = (id: string, newStatus: AppStatus) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    showToast(`${id} のステータスを「${APP_STATUS_CONFIG[newStatus].label}」に変更しました`);
  };

  // 件数サマリー
  const counts = {
    all:        applications.length,
    pending:    applications.filter((a) => a.status === 'pending').length,
    scheduling: applications.filter((a) => a.status === 'scheduling').length,
    completed:  applications.filter((a) => a.status === 'completed').length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-white">お見合い申請管理</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          全 {applications.length} 件（ダミーデータ）
        </p>
      </div>

      {/* フィルタータブ */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const isActive = statusFilter === opt.value;
          const count    = counts[opt.value];
          return (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-950 text-teal-400 border border-teal-900'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              {opt.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-teal-900 text-teal-300' : 'bg-zinc-700 text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* テーブル */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead className="border-b border-zinc-800">
              <tr>
                {['申請番号', '申請者', 'お相手', '申請日', 'ステータス', '料金', '操作'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs text-zinc-400 font-medium uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">
                    該当する申請が見つかりませんでした
                  </td>
                </tr>
              ) : (
                filtered.map((app) => {
                  const nextStatus: AppStatus | null =
                    app.status === 'pending'    ? 'scheduling' :
                    app.status === 'scheduling' ? 'completed'  : null;
                  const nextLabel =
                    app.status === 'pending'    ? '日程調整中へ' :
                    app.status === 'scheduling' ? '完了へ'       : null;

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-zinc-800/50 transition-colors"
                    >
                      {/* 申請番号 */}
                      <td className="px-4 py-3 font-mono text-zinc-400 text-xs">{app.id}</td>

                      {/* 申請者 */}
                      <td className="px-4 py-3">
                        <MemberChip {...app.applicant} />
                      </td>

                      {/* 相手 */}
                      <td className="px-4 py-3">
                        <MemberChip {...app.target} />
                      </td>

                      {/* 申請日 */}
                      <td className="px-4 py-3 text-zinc-400 text-xs">{app.appliedAt}</td>

                      {/* ステータス */}
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} />
                      </td>

                      {/* 料金 */}
                      <td className="px-4 py-3 text-zinc-300 text-xs">
                        ¥{app.amount.toLocaleString()}
                      </td>

                      {/* 操作 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="text-xs px-2.5 py-1 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                          >
                            詳細
                          </button>
                          {nextStatus && nextLabel && (
                            <button
                              onClick={() => handleStatusChange(app.id, nextStatus)}
                              className="text-xs px-2.5 py-1 rounded-lg border border-teal-800 text-teal-400 hover:bg-teal-900/40 transition-colors"
                            >
                              {nextLabel}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* フッター */}
        <div className="px-4 py-3 border-t border-zinc-800 text-xs text-zinc-500">
          {filtered.length} 件表示 / 全 {applications.length} 件
        </div>
      </div>

      {/* 詳細モーダル */}
      {selectedApp && (
        <DetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* トースト */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-800 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl z-50">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
