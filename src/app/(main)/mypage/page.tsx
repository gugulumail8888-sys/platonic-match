'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  User, Heart, Settings, MapPin, Briefcase,
  Ruler, Sparkles, GraduationCap, Users, Cigarette,
  Wallet, Home, GitMerge, Calendar, Baby, HeartHandshake,
  Mail, Lock,
  Edit3, Eye, ShieldOff,
} from 'lucide-react';

// ============================================================
// Dummy Data
// ============================================================

const LIKED_BY_ME = [
  { id: 3, nickname: 'たかし', age: 32, prefecture: '東京都', initials: 'た', avatarColor: '#2563eb' },
  { id: 5, nickname: 'けんじ', age: 35, prefecture: '神奈川県', initials: 'け', avatarColor: '#7c3aed' },
  { id: 7, nickname: 'ひろし', age: 29, prefecture: '千葉県', initials: 'ひ', avatarColor: '#b45309' },
];

const LIKED_ME = [
  { id: 9,  nickname: 'まさき', age: 34, prefecture: '埼玉県', initials: 'ま', avatarColor: '#be123c' },
  { id: 11, nickname: 'りょうた', age: 31, prefecture: '東京都', initials: 'り', avatarColor: '#0f766e' },
];

// ============================================================
// Shared Sub-components
// ============================================================

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5">
      <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-teal-500 rounded-full inline-block" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ElementType; label: string; value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-zinc-700/50 last:border-0">
      <div className="w-8 h-8 bg-zinc-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-teal-500" />
      </div>
      <span className="text-sm text-zinc-400 w-28 flex-shrink-0">{label}</span>
      <span className="text-sm text-zinc-100 font-medium">{value}</span>
    </div>
  );
}

// ============================================================
// Tab 1: マイプロフィール
// ============================================================

interface MyProfile {
  id: string;
  nickname: string;
  gender: string;
  birth_date: string | null;
  prefecture: string | null;
  occupation: string | null;
  height: number | null;
  body_type: string | null;
  blood_type: string | null;
  marital_history: string | null;
  number_of_children: string | null;
  education: string | null;
  siblings_exist: string | null;
  siblings_detail: string | null;
  siblings_position: string | null;
  smoking: string | null;
  income: string | null;
  living_arrangement: string | null;
  finance_management: string | null;
  external_partner: string | null;
  marriage_timing: string | null;
  children_desire: string | null;
  sexuality: string | null;
  hobbies: string | null;
  pr: string | null;
  desired_conditions: string | null;
}

const GENDER_LABELS: Record<string, string> = { male: '男性', female: '女性', other: 'その他' };

function yesNoLabel(v: string | boolean | null | undefined): string | null {
  if (v === 'true' || v === true) return 'あり';
  if (v === 'false' || v === false) return 'なし';
  return null;
}

function externalPartnerLabel(v: string | boolean | null | undefined): string | null {
  if (v === 'true' || v === true) return 'あり';
  if (v === 'false' || v === false || v === null || v === undefined) return 'なし';
  return null;
}

function childrenDesireLabel(v: string | null | undefined): string | null {
  if (v === 'undecided') return '未定';
  if (v === 'yes') return 'ほしい';
  if (v === 'no') return 'ほしくない';
  return v ?? null;
}

function ProfileTab() {
  const [profile, setProfile] = React.useState<MyProfile | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => setProfile(data.profile ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-zinc-400 py-12">読み込み中...</div>;
  if (!profile) return <div className="text-center text-zinc-500 py-12">プロフィールが見つかりません</div>;

  const p = profile;
  const age = calcAge(p.birth_date);
  const initial = p.nickname.charAt(0);
  const bg = avatarColor(p.id);

  return (
    <div className="space-y-4">
      {/* プロフィールカード */}
      <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* イニシャルアバター */}
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl flex-shrink-0 select-none shadow-lg ring-4 ring-zinc-700"
          style={{ background: bg }}
        >
          {initial}
        </div>

        {/* 基本情報 */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-white mb-0.5">{p.nickname}</h2>
              <p className="text-zinc-400 text-sm mb-2">
                {age !== null && `${age}歳`}
                {age !== null && p.gender && ' · '}
                {GENDER_LABELS[p.gender] ?? p.gender}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm">
                {p.prefecture && (
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <MapPin className="w-3.5 h-3.5 text-teal-500" />
                    {p.prefecture}
                  </span>
                )}
                {p.occupation && (
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <Briefcase className="w-3.5 h-3.5 text-teal-500" />
                    {p.occupation}
                  </span>
                )}
              </div>
            </div>
            <Link href="/profile/edit" className="flex-shrink-0">
              <button
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium transition-colors shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                プロフィールを編集する
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 基本情報 */}
      <SectionCard title="基本情報">
        <div className="space-y-0">
          <InfoRow icon={Ruler}          label="身長"         value={p.height ? `${p.height}cm` : null} />
          <InfoRow icon={User}           label="体型"         value={p.body_type} />
          <InfoRow icon={Sparkles}       label="血液型"       value={p.blood_type} />
          <InfoRow icon={HeartHandshake} label="結婚歴"       value={yesNoLabel(p.marital_history)} />
          <InfoRow icon={Baby}           label="お子様の人数" value={p.number_of_children} />
          <InfoRow icon={GraduationCap}  label="学歴"         value={p.education} />
          <InfoRow icon={Users}          label="兄弟姉妹の有無"     value={p.siblings_exist} />
          {p.siblings_exist === 'あり' && (<>
<InfoRow icon={Users} label="兄弟姉妹の詳細" value={p.siblings_detail} />
            <InfoRow icon={Users}        label="自分の続柄"         value={p.siblings_position} />
            </>
          )}
        </div>
      </SectionCard>

      {/* ライフスタイル */}
      <SectionCard title="ライフスタイル">
        <div className="space-y-0">
          <InfoRow icon={Cigarette} label="喫煙"           value={yesNoLabel(p.smoking)} />
          <InfoRow icon={Wallet}    label="収入（年収）"   value={p.income} />
          <InfoRow icon={Home}      label="居住形態"       value={p.living_arrangement} />
          <InfoRow icon={GitMerge}  label="家計の管理"     value={p.finance_management} />
          <InfoRow icon={Heart}     label="外部パートナー" value={externalPartnerLabel(p.external_partner)} />
        </div>
      </SectionCard>

      {/* パートナー希望 */}
      <SectionCard title="パートナー希望">
        <div className="space-y-0">
          <InfoRow icon={Calendar} label="結婚希望時期"       value={p.marriage_timing} />
          <InfoRow icon={Baby}     label="子供の有無（希望）" value={childrenDesireLabel(p.children_desire)} />
          <InfoRow icon={Sparkles} label="セクシュアリティ"   value={p.sexuality} />
        </div>
      </SectionCard>

      {/* 自己紹介 */}
      {(p.hobbies || p.pr || p.desired_conditions) && (
        <SectionCard title="自己紹介">
          <div className="space-y-5">
            {p.hobbies && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">趣味</p>
                <p className="text-zinc-300 text-sm leading-relaxed">{p.hobbies}</p>
              </div>
            )}
            {p.pr && (
              <div className="border-t border-zinc-700 pt-4">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">PR</p>
                <p className="text-zinc-300 text-sm leading-relaxed">{p.pr}</p>
              </div>
            )}
            {p.desired_conditions && (
              <div className="border-t border-zinc-700 pt-4">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">希望条件</p>
                <p className="text-zinc-300 text-sm leading-relaxed">{p.desired_conditions}</p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* 退会セクション */}
      <div className="mt-8 bg-zinc-800 rounded-2xl border border-rose-800 p-5">
        <p className="text-base font-bold text-rose-400 mb-2">アカウントの削除</p>
        <p className="text-sm text-zinc-400 leading-relaxed mb-4">
          退会をご希望の方は、下のボタンからお手続きください。退会後はすべてのデータが削除されます。
        </p>
        <Link
          href="/withdraw"
          className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl border border-red-900/60 text-red-500/80 text-sm font-medium hover:bg-red-950/30 hover:border-red-800 hover:text-red-400 transition-all"
        >
          退会する
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// Tab 2: いいね履歴
// ============================================================

interface LikeMember {
  id: string;
  nickname: string;
  birth_date: string | null;
  prefecture: string | null;
  isMutual?: boolean;
}

const AVATAR_COLORS = ['#0d9488','#2563eb','#7c3aed','#b45309','#be123c','#0f766e','#c2410c','#4f46e5'];

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function avatarColor(id: string): string {
  const n = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function LikeMemberCard({ member }: { member: LikeMember }) {
  const age = calcAge(member.birth_date);
  const initial = member.nickname.charAt(0);
  const bg = avatarColor(member.id);
  return (
    <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-4 flex items-center gap-4 hover:bg-zinc-700/60 hover:border-zinc-600 transition-all duration-200">
      {/* アバター */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 select-none"
        style={{ background: bg }}
      >
        {initial}
      </div>

      {/* 情報 */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm leading-tight">{member.nickname}</p>
        {age !== null && <p className="text-zinc-400 text-xs mt-0.5">{age}歳</p>}
        {member.prefecture && (
          <p className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-teal-600" />
            {member.prefecture}
          </p>
        )}
        {member.isMutual && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-pink-900/50 text-pink-300 border border-pink-800 mt-1">
            💑 相互いいね
          </span>
        )}
      </div>

      {/* リンク */}
      <Link
        href={`/members/${member.id}`}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-teal-700 text-teal-400 text-xs font-medium hover:bg-teal-900/40 hover:border-teal-500 transition-colors flex-shrink-0"
      >
        <Eye className="w-3 h-3" />
        プロフィールを見る
      </Link>
    </div>
  );
}

function LikesSentTab() {
  const [members, setMembers] = React.useState<LikeMember[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/likes')
      .then((r) => r.json())
      .then((data) => setMembers(data.members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-zinc-400 py-12">読み込み中...</div>;
  if (members.length === 0) return <div className="text-center text-zinc-500 py-12">いいねしたメンバーはいません</div>;
  return (
    <div className="space-y-2">
      {members.map((m) => <LikeMemberCard key={m.id} member={m} />)}
    </div>
  );
}

function LikesReceivedTab() {
  const [members, setMembers] = React.useState<LikeMember[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/likes/received')
      .then((r) => r.json())
      .then((data) => setMembers(data.members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-zinc-400 py-12">読み込み中...</div>;
  if (members.length === 0) return <div className="text-center text-zinc-500 py-12">いいねされたメンバーはいません</div>;
  return (
    <div className="space-y-2">
      {members.map((m) => <LikeMemberCard key={m.id} member={m} />)}
    </div>
  );
}

// ============================================================
// Tab 3: 設定
// ============================================================

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  badge?: string;
}

function ToggleSwitch({ checked, onChange, label, description, disabled, badge }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-700/50 last:border-0">
      <div>
        <p className="text-sm text-zinc-200 font-medium flex items-center gap-2">
          {label}
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-700 text-zinc-400 rounded-full font-normal">
              {badge}
            </span>
          )}
        </p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          disabled ? 'cursor-not-allowed opacity-40 bg-zinc-600' : `cursor-pointer focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${checked ? 'bg-teal-600' : 'bg-zinc-600'}`
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

const inputCls =
  'bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm ' +
  'placeholder-zinc-500 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors w-full';

function AIOptionSection() {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();
      setIsPremium(data?.is_premium ?? false);
      setLoading(false);
    });
  }, []);

  const handleCancel = async () => {
    if (!window.confirm('AIおすすめオプションを解約しますか？\n現在の請求期間終了後に解約されます。')) return;
    setCancelling(true);
    try {
      const res = await fetch('/api/stripe/cancel-subscription', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? '解約処理に失敗しました');
        return;
      }
      setCancelled(true);
    } catch {
      alert('解約処理に失敗しました');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5">
      <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-teal-500 rounded-full inline-block" />
        AIおすすめオプション
      </h3>
      {isPremium ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-teal-900/50 text-teal-300 border border-teal-800 font-medium">
              加入中
            </span>
            <span className="text-sm text-zinc-300">AIおすすめプラン（月額¥1,078）</span>
          </div>
          {cancelled ? (
            <div className="text-sm text-amber-400 bg-amber-950/30 border border-amber-800 rounded-xl px-4 py-3">
              解約申請を受け付けました。現在の請求期間終了後に解約されます。
            </div>
          ) : (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 rounded-xl border border-red-900 text-red-400 text-sm font-medium hover:bg-red-950/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelling ? '処理中...' : '解約する'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-700 text-zinc-400 border border-zinc-600 font-medium">
              未加入
            </span>
            <span className="text-sm text-zinc-400">AIおすすめプランに加入していません</span>
          </div>
          <Link
            href="/option-apply"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium transition-colors"
          >
            AIおすすめプランに申し込む
          </Link>
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const [email, setEmail] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [notifyLike, setNotifyLike] = useState(true);
  const [notifyMatch, setNotifyMatch] = useState(false);

  const [toast, setToast] = useState('');
  const [emailError, setEmailError] = useState('');
  const [pwError, setPwError] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email);
    });
  }, []);

  const handleEmailSave = async () => {
    setEmailError('');
    setEmailSaving(true);
    try {
      const res = await fetch('/api/auth/update-email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error ?? 'メールアドレスの更新に失敗しました');
        return;
      }
      showToast('メールアドレスを更新しました');
    } catch {
      setEmailError('メールアドレスの更新に失敗しました');
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwError('');

    if (!currentPw || !newPw || !confirmPw) {
      setPwError('すべての項目を入力してください');
      return;
    }
    if (newPw.length < 8) {
      setPwError('新しいパスワードは8文字以上で入力してください');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('新しいパスワードと確認用パスワードが一致しません');
      return;
    }

    setPwSaving(true);
    try {
      const res = await fetch('/api/auth/update-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error ?? 'パスワードの変更に失敗しました');
        return;
      }
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      showToast('パスワードを変更しました');
    } catch {
      setPwError('パスワードの変更に失敗しました');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* AIおすすめオプション */}
      <AIOptionSection />

        {/* アカウント設定 */}
        <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5">
          <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-5 flex items-center gap-2">
            <span className="w-1 h-4 bg-teal-500 rounded-full inline-block" />
            アカウント設定
          </h3>

          {/* メールアドレス変更 */}
          <div className="mb-5 pb-5 border-b border-zinc-700">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              <Mail className="w-3.5 h-3.5" />
              メールアドレス
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
                placeholder="メールアドレスを入力"
              />
              <button
                type="button"
                onClick={handleEmailSave}
                disabled={emailSaving}
                className="px-4 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailSaving ? '保存中...' : '保存'}
              </button>
            </div>
            {emailError && <p className="text-xs text-red-400 mt-2">{emailError}</p>}
          </div>

          {/* パスワード変更 */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
              <Lock className="w-3.5 h-3.5" />
              パスワード変更
            </label>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-zinc-500 mb-1">現在のパスワード</p>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className={inputCls}
                  placeholder="現在のパスワード"
                />
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">新しいパスワード</p>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className={inputCls}
                  placeholder="新しいパスワード（8文字以上）"
                />
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">確認用パスワード</p>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className={inputCls}
                  placeholder="もう一度入力"
                />
              </div>
              {pwError && <p className="text-xs text-red-400">{pwError}</p>}
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={pwSaving}
                className="w-full mt-1 px-4 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pwSaving ? '変更中...' : 'パスワードを変更する'}
              </button>
            </div>
          </div>
        </div>

        {/* 通知設定 */}
        <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5">
          <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-teal-500 rounded-full inline-block" />
            通知設定
            <span className="text-[11px] text-zinc-500 font-normal normal-case tracking-normal">※正式リリース後にご利用いただけます</span>
          </h3>
          <div className="space-y-0">
            <ToggleSwitch
              checked={notifyLike}
              onChange={setNotifyLike}
              label="いいね通知"
              description="いいねを受け取ったときに通知します"
              disabled
              badge="準備中"
            />
            <ToggleSwitch
              checked={notifyMatch}
              onChange={setNotifyMatch}
              label="マッチング通知"
              description="マッチングが成立したときに通知します"
              disabled
              badge="準備中"
            />
          </div>
        </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-zinc-800 border border-zinc-700 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl z-50">
          ✓ {toast}
        </div>
      )}
      </div>
  );
}

// ============================================================
// Blocked Tab
// ============================================================

function BlockedTab() {
  const [members, setMembers] = React.useState<{id:string;nickname:string;prefecture:string|null;occupation:string|null}[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/blocks/list')
      .then((r) => r.json())
      .then((data) => setMembers(data.members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUnblock = async (memberId: string, nickname: string) => {
    if (!window.confirm(`${nickname}さんのブロックを解除しますか？`)) return;
    await fetch('/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    });
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  if (loading) return <div className="text-center text-zinc-400 py-12">読み込み中...</div>;
  if (members.length === 0) return <div className="text-center text-zinc-400 py-12">ブロックしているユーザーはいません</div>;

  return (
    <div className="space-y-3">
      {members.map((m) => (
        <div key={m.id} className="bg-zinc-800 rounded-xl border border-zinc-700 p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">{m.nickname}</p>
            <p className="text-sm text-zinc-400">{m.prefecture}{m.occupation ? ` / ${m.occupation}` : ''}</p>
          </div>
          <button onClick={() => handleUnblock(m.id, m.nickname)}
            className="px-3 py-1.5 rounded-lg bg-zinc-700 text-zinc-300 text-sm hover:bg-zinc-600 transition-colors">
            解除
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Tab Navigation
// ============================================================

type TabId = 'profile' | 'likes-sent' | 'likes-received' | 'blocked' | 'settings';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'profile',        label: 'マイプロフィール', icon: User },
  { id: 'likes-sent',     label: 'いいね送信',            icon: Heart },
  { id: 'likes-received', label: 'いいね受信',            icon: HeartHandshake },
  { id: 'blocked',        label: 'ブロック',          icon: ShieldOff },
  { id: 'settings',       label: '設定',              icon: Settings },
];

// ============================================================
// Main Page
// ============================================================

export default function MyPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* ページヘッダー */}
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-0.5">マイページ</h1>
        <p className="text-zinc-500 text-sm">プロフィールや設定を管理できます</p>
      </div>

      {/* タブナビゲーション */}
      <div className="flex flex-col border-b border-zinc-800 mb-6 gap-1">
        {/* 上段: マイプロフィール（全幅） */}
        <div className="flex">
          {TABS.slice(0, 1).map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center justify-center gap-1.5 px-4 py-3 w-full text-sm font-medium transition-all duration-200 border-b-2 -mb-px focus:outline-none ${
                  isActive
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-zinc-500'}`} />
                {label}
              </button>
            );
          })}
        </div>

        {/* 下段: いいねした・いいねされた・ブロックリスト・設定（均等幅） */}
        <div className="flex">
          {TABS.slice(1).map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center justify-center gap-1 px-2 py-3 flex-1 text-xs font-medium transition-all duration-200 border-b-2 -mb-px focus:outline-none ${
                  isActive
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-zinc-500'}`} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'profile'        && <ProfileTab />}
      {activeTab === 'likes-sent'     && <LikesSentTab />}
      {activeTab === 'likes-received' && <LikesReceivedTab />}
      {activeTab === 'blocked'        && <BlockedTab />}
      {activeTab === 'settings'       && <SettingsTab />}
    </div>
  );
}
