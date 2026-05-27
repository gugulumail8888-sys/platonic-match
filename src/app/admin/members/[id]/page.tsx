'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Briefcase, Ruler, User, GraduationCap, Cigarette, Wallet, Home, Calendar, Baby, Sparkles, HeartHandshake, Mail } from 'lucide-react';
import {
  getAdminMemberById, getApplicationsByMemberId,
  MEMBER_STATUS_CONFIG, APP_STATUS_CONFIG,
  type MemberStatus,
} from '../../_data';

// ============================================================
// Sub-components
// ============================================================

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-zinc-700/40 last:border-0">
      <span className="text-xs text-zinc-500 w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-zinc-200">{value}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5">
      <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-1 h-3 bg-teal-500 rounded-full" />
        {title}
      </h3>
      {children}
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function AdminMemberDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const member = getAdminMemberById(Number(params.id));

  if (!member) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-400">会員が見つかりませんでした</p>
        <Link href="/admin/members" className="text-teal-400 text-sm mt-2 inline-block hover:text-teal-300">
          ← 会員一覧に戻る
        </Link>
      </div>
    );
  }

  const applications = getApplicationsByMemberId(member.id);

  const [currentStatus, setCurrentStatus] = useState<MemberStatus>(member.memberStatus);
  const [adminNote, setAdminNote]         = useState('');
  const [toast, setToast]                 = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleStatusChange = (newStatus: MemberStatus) => {
    setCurrentStatus(newStatus);
    showToast(`ステータスを「${MEMBER_STATUS_CONFIG[newStatus].label}」に変更しました`);
  };

  const handleSaveNote = () => {
    showToast('管理者メモを保存しました');
  };

  const statusCfg = MEMBER_STATUS_CONFIG[currentStatus];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-5">
      {/* 戻る */}
      <Link
        href="/admin/members"
        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        会員一覧へ戻る
      </Link>

      {/* ===== ヘッダー ===== */}
      <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl flex-shrink-0 select-none shadow-lg"
          style={{ background: member.avatarColor }}
        >
          {member.initials}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">{member.nickname}</h1>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-zinc-500" />
              {member.email}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-teal-500" />
              {member.prefecture}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-teal-500" />
              {member.occupation}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1.5">
            登録日: {member.registeredAt} ／ ID: #{member.id} ／ {member.gender === 'male' ? '男性' : '女性'}
          </p>
        </div>
      </div>

      {/* ===== ステータス変更 ===== */}
      <SectionCard title="ステータス管理">
        <p className="text-xs text-zinc-400 mb-3">
          現在のステータス：
          <span className={`ml-1 font-semibold ${
            currentStatus === 'approved' ? 'text-green-400' :
            currentStatus === 'pending'  ? 'text-amber-400' : 'text-red-400'
          }`}>
            {statusCfg.label}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {currentStatus !== 'approved' && (
            <button
              onClick={() => handleStatusChange('approved')}
              className="px-4 py-2 rounded-xl bg-green-900/40 border border-green-800 text-green-300 text-sm font-medium hover:bg-green-900/70 transition-colors"
            >
              ✓ 承認する
            </button>
          )}
          {currentStatus !== 'suspended' && (
            <button
              onClick={() => handleStatusChange('suspended')}
              className="px-4 py-2 rounded-xl bg-red-900/30 border border-red-900 text-red-400 text-sm font-medium hover:bg-red-900/50 transition-colors"
            >
              停止する
            </button>
          )}
          {currentStatus !== 'pending' && (
            <button
              onClick={() => handleStatusChange('pending')}
              className="px-4 py-2 rounded-xl bg-amber-900/30 border border-amber-800 text-amber-400 text-sm font-medium hover:bg-amber-900/50 transition-colors"
            >
              審査中に戻す
            </button>
          )}
          <button
            className="px-4 py-2 rounded-xl bg-zinc-700/50 border border-zinc-600 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors"
            onClick={() => showToast('退会処理を実行しました（ダミー）')}
          >
            退会させる
          </button>
        </div>
      </SectionCard>

      {/* ===== プロフィール情報 ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="基本情報">
          <div className="space-y-0">
            <InfoRow label="年齢"       value={`${member.age}歳`} />
            <InfoRow label="身長"       value={`${member.height}cm`} />
            <InfoRow label="体型"       value={member.bodyType} />
            <InfoRow label="血液型"     value={member.bloodType} />
            <InfoRow label="学歴"       value={member.education} />
            <InfoRow label="兄弟姉妹"   value={member.siblings} />
            <InfoRow label="結婚歴"     value={member.maritalHistory} />
            <InfoRow label="お子様"     value={member.numberOfChildren} />
          </div>
        </SectionCard>

        <SectionCard title="ライフスタイル">
          <div className="space-y-0">
            <InfoRow label="居住地"     value={member.prefecture} />
            <InfoRow label="職業"       value={member.occupation} />
            <InfoRow label="収入（年収）" value={member.income} />
            <InfoRow label="居住形態"   value={member.livingArrangement} />
            <InfoRow label="喫煙"       value={member.smoking} />
            <InfoRow label="結婚希望時期" value={member.marriageTiming} />
            <InfoRow label="子供希望"   value={member.childrenDesire} />
            <InfoRow label="セクシュアリティ" value={member.sexuality} />
          </div>
        </SectionCard>
      </div>

      {/* 自己紹介 */}
      <SectionCard title="自己紹介・PR">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1.5">趣味</p>
            <p className="text-zinc-300 text-sm leading-relaxed">{member.hobbies}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1.5">自己PR</p>
            <p className="text-zinc-300 text-sm leading-relaxed">{member.pr}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1.5">希望条件</p>
            <p className="text-zinc-300 text-sm leading-relaxed">{member.desiredConditions}</p>
          </div>
        </div>
      </SectionCard>

      {/* ===== 申請履歴 ===== */}
      <SectionCard title={`申請履歴（${applications.length}件）`}>
        {applications.length === 0 ? (
          <p className="text-zinc-500 text-sm">申請履歴はありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left py-2 px-2 text-xs text-zinc-400 font-medium">申請番号</th>
                  <th className="text-left py-2 px-2 text-xs text-zinc-400 font-medium">相手</th>
                  <th className="text-left py-2 px-2 text-xs text-zinc-400 font-medium">申請日</th>
                  <th className="text-left py-2 px-2 text-xs text-zinc-400 font-medium">ステータス</th>
                  <th className="text-left py-2 px-2 text-xs text-zinc-400 font-medium">料金</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700">
                {applications.map((app) => {
                  const partner = app.applicant.id === member.id ? app.target : app.applicant;
                  const role    = app.applicant.id === member.id ? '申請' : '受け';
                  const cfg     = APP_STATUS_CONFIG[app.status];
                  return (
                    <tr key={app.id} className="hover:bg-zinc-700/30 transition-colors">
                      <td className="py-2.5 px-2 font-mono text-zinc-400 text-xs">
                        {app.id}
                        <span className="ml-1.5 text-zinc-600">({role})</span>
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                            style={{ background: partner.avatarColor }}
                          >
                            {partner.initials}
                          </div>
                          <span className="text-zinc-200">{partner.nickname}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-zinc-400 text-xs">{app.appliedAt}</td>
                      <td className="py-2.5 px-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-zinc-400 text-xs">
                        ¥{app.amount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ===== 管理者メモ ===== */}
      <SectionCard title="管理者メモ">
        <textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="この会員に関する管理者メモを入力..."
          rows={4}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors resize-none"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSaveNote}
            className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 transition-colors"
          >
            保存する
          </button>
        </div>
      </SectionCard>

      {/* トースト */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-800 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl z-50">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
