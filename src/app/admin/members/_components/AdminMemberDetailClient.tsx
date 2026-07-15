'use client';

import Link from 'next/link';
import { ArrowLeft, MapPin, Briefcase, Mail, ChevronRight } from 'lucide-react';
import { MEMBER_STATUS_CONFIG, type MemberStatus } from './AdminMembersClient';
import { APP_STATUS_CONFIG, type AppStatus } from '../../matching/_components/AdminMatchingClient';

// ── 型定義 ────────────────────────────────────────────────────

export interface MemberDetail {
  id: string;
  nickname: string;
  gender: string;
  birth_date: string;
  prefecture: string;
  occupation: string;
  height: number | null;
  body_type: string | null;
  blood_type: string | null;
  marital_history: boolean | null;
  number_of_children: string | null;
  education: string | null;
  siblings: string | null;
  income: string | null;
  marriage_timing: string | null;
  children_desire: string | null;
  sexuality: string | null;
  sexuality_other: string | null;
  living_arrangement: string | null;
  hobbies: string | null;
  pr: string | null;
  desired_conditions: string | null;
  avatar_url: string | null;
  avatar_color: string | null;
  status: MemberStatus;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  created_at: string;
  email: string;
}

export interface ApplicationRow {
  id: string;
  status: AppStatus;
  created_at: string;
  partner: { id: string; nickname: string; avatar_url: string | null; avatar_color: string | null } | null;
  isApplicant: boolean;
  amount: number | null;
  partnerAmount: number | null;
  paymentIntentId: string | null;
  partnerPaymentIntentId: string | null;
  refunded: boolean;
  partnerRefunded: boolean;
}

const STATUS_ORDER: MemberStatus[] = ['pending', 'approved', 'verified', 'rejected', 'withdrawn'];

// ── ヘルパー ──────────────────────────────────────────────────

function calcAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function displayOrEmpty(value: string | number | null) {
  return value === null || value === '' ? '未入力' : String(value);
}

function maritalHistoryLabel(v: string | boolean | null): string {
  if (v === true || v === 'true') return 'あり';
  if (v === false || v === 'false') return 'なし';
  return '未入力';
}

function childrenDesireLabel(v: string | null): string {
  if (v === 'want') return 'ほしい';
  if (v === 'notwant') return 'ほしくない';
  if (v === 'undecided') return '未定';
  return v ?? '未入力';
}

// ── サブコンポーネント ─────────────────────────────────────────

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

function AppStatusBadge({ status }: { status: AppStatus }) {
  const cfg = APP_STATUS_CONFIG[status] ?? { label: status, className: 'bg-zinc-700 text-zinc-300 border border-zinc-600' };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

// ── メインコンポーネント ───────────────────────────────────────

export default function AdminMemberDetailClient({
  member,
  applications,
  updateStatus,
  suspendMember,
  unsuspendMember,
}: {
  member: MemberDetail;
  applications: ApplicationRow[];
  updateStatus: (formData: FormData) => Promise<void>;
  suspendMember: (formData: FormData) => Promise<void>;
  unsuspendMember: (formData: FormData) => Promise<void>;
}) {
  const statusCfg = MEMBER_STATUS_CONFIG[member.status] ?? {
    label: member.status,
    className: 'bg-zinc-700 text-zinc-300 border border-zinc-600',
  };

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
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.nickname}
            className="w-20 h-20 rounded-full object-cover flex-shrink-0 shadow-lg"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl flex-shrink-0 select-none shadow-lg"
            style={{ background: member.avatar_color ?? '#0d9488' }}
          >
            {member.nickname.charAt(0)}
          </div>
        )}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">{member.nickname}</h1>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
            {member.is_suspended && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-900/50 text-red-300 border border-red-800">
                🔒 停止中
              </span>
            )}
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
            登録日: {new Date(member.created_at).toLocaleDateString('ja-JP')} ／ ID: {member.id.slice(0, 8).toUpperCase()} ／{' '}
            {member.gender === 'male' ? '男性' : member.gender === 'female' ? '女性' : 'その他'}
          </p>
        </div>
      </div>

      {/* ===== ステータス管理 ===== */}
      <SectionCard title="ステータス管理">
        <p className="text-xs text-zinc-400 mb-3">
          現在のステータス：
          <span className="ml-1 font-semibold text-zinc-200">{statusCfg.label}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.filter((s) => s !== member.status).map((s) => {
            const cfg = MEMBER_STATUS_CONFIG[s];
            return (
              <form key={s} action={updateStatus}>
                <input type="hidden" name="id" value={member.id} />
                <input type="hidden" name="status" value={s} />
                <button
                  type="submit"
                  onClick={(e) => {
                    if (!window.confirm(`${member.nickname} さんのステータスを「${cfg.label}」に変更しますか？`)) {
                      e.preventDefault();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-700/50 border border-zinc-600 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
                >
                  {cfg.label}にする
                </button>
              </form>
            );
          })}

          {!member.is_suspended ? (
            <form action={suspendMember}>
              <input type="hidden" name="id" value={member.id} />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-red-900/30 border border-red-900 text-red-400 text-sm font-medium hover:bg-red-900/50 transition-colors"
              >
                停止する
              </button>
            </form>
          ) : (
            <form action={unsuspendMember}>
              <input type="hidden" name="id" value={member.id} />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-zinc-700/50 border border-zinc-600 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
              >
                停止解除
              </button>
            </form>
          )}
        </div>

        {member.is_suspended && member.suspended_at && (
          <p className="text-xs text-red-400 mt-3">
            {formatDateTime(member.suspended_at)}停止
            {member.suspended_reason ? `（理由：${member.suspended_reason}）` : ''}
          </p>
        )}
      </SectionCard>

      {/* ===== プロフィール情報 ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="基本情報">
          <div className="space-y-0">
            <InfoRow label="年齢"     value={`${calcAge(member.birth_date)}歳`} />
            <InfoRow label="身長"     value={member.height !== null ? `${member.height}cm` : '未入力'} />
            <InfoRow label="体型"     value={displayOrEmpty(member.body_type)} />
            <InfoRow label="血液型"   value={displayOrEmpty(member.blood_type)} />
            <InfoRow label="学歴"     value={displayOrEmpty(member.education)} />
            <InfoRow label="兄弟姉妹" value={displayOrEmpty(member.siblings)} />
            <InfoRow label="結婚歴"   value={maritalHistoryLabel(member.marital_history)} />
            <InfoRow label="お子様"   value={displayOrEmpty(member.number_of_children)} />
          </div>
        </SectionCard>

        <SectionCard title="ライフスタイル">
          <div className="space-y-0">
            <InfoRow label="居住地"       value={member.prefecture} />
            <InfoRow label="職業"         value={member.occupation} />
            <InfoRow label="収入（年収）" value={displayOrEmpty(member.income)} />
            <InfoRow label="居住形態"     value={displayOrEmpty(member.living_arrangement)} />
            <InfoRow label="結婚希望時期" value={displayOrEmpty(member.marriage_timing)} />
            <InfoRow label="子供希望"     value={childrenDesireLabel(member.children_desire)} />
            <InfoRow
              label="セクシュアリティ"
              value={
                member.sexuality === null
                  ? '未入力'
                  : member.sexuality_other
                  ? `${member.sexuality}（その他：${member.sexuality_other}）`
                  : member.sexuality
              }
            />
          </div>
        </SectionCard>
      </div>

      {/* 自己紹介 */}
      <SectionCard title="自己紹介・PR">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1.5">趣味</p>
            <p className="text-zinc-300 text-sm leading-relaxed">{displayOrEmpty(member.hobbies)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1.5">自己PR</p>
            <p className="text-zinc-300 text-sm leading-relaxed">{displayOrEmpty(member.pr)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1.5">希望条件</p>
            <p className="text-zinc-300 text-sm leading-relaxed">{displayOrEmpty(member.desired_conditions)}</p>
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
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-zinc-700/30 transition-colors">
                    <td className="py-2.5 px-2 font-mono text-zinc-400 text-xs">
                      {app.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-2.5 px-2">
                      {app.partner ? (
                        <div className="flex items-center gap-1.5">
                          {app.partner.avatar_url ? (
                            <img
                              src={app.partner.avatar_url}
                              alt={app.partner.nickname}
                              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                              style={{ background: app.partner.avatar_color ?? '#0d9488' }}
                            >
                              {app.partner.nickname.charAt(0)}
                            </div>
                          )}
                          <span className="text-zinc-200">{app.partner.nickname}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs">不明</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-zinc-400 text-xs">
                      {new Date(app.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="py-2.5 px-2">
                      <AppStatusBadge status={app.status} />
                    </td>
                    <td className="py-2.5 px-2 text-zinc-400 text-xs">
                      {(() => {
                        const myAmount = app.isApplicant ? app.amount : app.partnerAmount;
                        const myPaid = app.isApplicant ? !!app.paymentIntentId : !!app.partnerPaymentIntentId;
                        const myRefunded = app.isApplicant ? app.refunded : app.partnerRefunded;
                        const status = myRefunded ? '返金済み' : myPaid ? '支払い済み' : '未払い';
                        return `${myAmount != null ? `¥${myAmount.toLocaleString()}` : '未確定'}（${status}）`;
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ===== 審査・メモ 案内 ===== */}
      <SectionCard title="審査・管理者メモ">
        <p className="text-sm text-zinc-300 mb-3">
          詳細な審査・メモは本人確認審査またはプロフィール管理画面から行ってください。
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/admin/verify/${member.id}`}
            className="inline-flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            本人確認審査へ <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/admin/review/${member.id}`}
            className="inline-flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            プロフィール管理へ <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
