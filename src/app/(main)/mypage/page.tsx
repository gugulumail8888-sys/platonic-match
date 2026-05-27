'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  User, Heart, Settings, MapPin, Briefcase,
  Ruler, Sparkles, GraduationCap, Users, Cigarette,
  Wallet, Home, GitMerge, Calendar, Baby, HeartHandshake,
  Mail, Lock, Bell, AlertTriangle, X, ChevronRight,
  Edit3, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// ============================================================
// Dummy Data
// ============================================================

const MY_PROFILE = {
  nickname: 'さくら',
  gender: '女性',
  age: 30,
  prefecture: '東京都',
  occupation: 'OL',
  initials: 'さ',
  avatarColor: '#0d9488',
  // 基本情報
  height: 158,
  bodyType: '普通',
  bloodType: 'A型',
  maritalHistory: 'なし',
  numberOfChildren: 'なし',
  education: '大学卒',
  siblings: '長女（2人姉妹）',
  // ライフスタイル
  smoking: 'なし',
  income: '300万〜400万未満',
  livingArrangement: '一人暮らし',
  financeManagement: '相談に応じて',
  externalPartner: 'なし',
  // パートナー希望
  marriageTiming: '1〜2年以内',
  childrenDesire: 'ほしい',
  sexuality: 'ヘテロセクシュアル',
  // 自己紹介
  hobbies: '読書が大好きで、毎月5冊以上は読んでいます。カフェ巡りも趣味で、休日は気になったカフェを巡っています。映画も好きで、特にフランス映画が好みです。',
  pr: '明るくておっとりした性格です。仕事は真面目に取り組みながら、プライベートも大切にしています。料理は得意ではありませんが、一緒に作ることが好きです。日常の小さな幸せを大切にできるパートナーを探しています。',
  desiredConditions: '価値観が合う方を探しています。外見よりも中身を大切にしてくれる方、一緒にいて落ち着ける方が理想です。年齢は28〜38歳くらいの方。',
};

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
  icon: React.ElementType; label: string; value: string;
}) {
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

function ProfileTab() {
  const p = MY_PROFILE;
  return (
    <div className="space-y-4">
      {/* プロフィールカード */}
      <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* イニシャルアバター */}
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl flex-shrink-0 select-none shadow-lg ring-4 ring-zinc-700"
          style={{ background: p.avatarColor }}
        >
          {p.initials}
        </div>

        {/* 基本情報 */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-white mb-0.5">{p.nickname}</h2>
              <p className="text-zinc-400 text-sm mb-2">{p.age}歳 · {p.gender}</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <MapPin className="w-3.5 h-3.5 text-teal-500" />
                  {p.prefecture}
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Briefcase className="w-3.5 h-3.5 text-teal-500" />
                  {p.occupation}
                </span>
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
          <InfoRow icon={Ruler}          label="身長"         value={`${p.height}cm`} />
          <InfoRow icon={User}           label="体型"         value={p.bodyType} />
          <InfoRow icon={Sparkles}       label="血液型"       value={p.bloodType} />
          <InfoRow icon={HeartHandshake} label="結婚歴"       value={p.maritalHistory} />
          <InfoRow icon={Baby}           label="お子様の人数" value={p.numberOfChildren} />
          <InfoRow icon={GraduationCap}  label="学歴"         value={p.education} />
          <InfoRow icon={Users}          label="兄弟姉妹"     value={p.siblings} />
        </div>
      </SectionCard>

      {/* ライフスタイル */}
      <SectionCard title="ライフスタイル">
        <div className="space-y-0">
          <InfoRow icon={Cigarette} label="喫煙"           value={p.smoking} />
          <InfoRow icon={Wallet}    label="収入（年収）"   value={p.income} />
          <InfoRow icon={Home}      label="居住形態"       value={p.livingArrangement} />
          <InfoRow icon={GitMerge}  label="家計の管理"     value={p.financeManagement} />
          <InfoRow icon={Heart}     label="外部パートナー" value={p.externalPartner} />
        </div>
      </SectionCard>

      {/* パートナー希望 */}
      <SectionCard title="パートナー希望">
        <div className="space-y-0">
          <InfoRow icon={Calendar} label="結婚希望時期"       value={p.marriageTiming} />
          <InfoRow icon={Baby}     label="子供の有無（希望）" value={p.childrenDesire} />
          <InfoRow icon={Sparkles} label="セクシュアリティ"   value={p.sexuality} />
        </div>
      </SectionCard>

      {/* 自己紹介 */}
      <SectionCard title="自己紹介">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">趣味</p>
            <p className="text-zinc-300 text-sm leading-relaxed">{p.hobbies}</p>
          </div>
          <div className="border-t border-zinc-700 pt-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">PR</p>
            <p className="text-zinc-300 text-sm leading-relaxed">{p.pr}</p>
          </div>
          <div className="border-t border-zinc-700 pt-4">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">希望条件</p>
            <p className="text-zinc-300 text-sm leading-relaxed">{p.desiredConditions}</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ============================================================
// Tab 2: いいね履歴
// ============================================================

interface LikeMember {
  id: number;
  nickname: string;
  age: number;
  prefecture: string;
  initials: string;
  avatarColor: string;
}

function LikeMemberCard({ member }: { member: LikeMember }) {
  return (
    <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-4 flex items-center gap-4 hover:bg-zinc-700/60 hover:border-zinc-600 transition-all duration-200">
      {/* アバター */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 select-none"
        style={{ background: member.avatarColor }}
      >
        {member.initials}
      </div>

      {/* 情報 */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm leading-tight">{member.nickname}</p>
        <p className="text-zinc-400 text-xs mt-0.5">{member.age}歳</p>
        <p className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3 text-teal-600" />
          {member.prefecture}
        </p>
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

function LikesTab() {
  return (
    <div className="space-y-6">
      {/* あなたがいいねしたメンバー */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-bold text-zinc-200">あなたがいいねしたメンバー</h3>
          <span className="ml-auto text-xs text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">
            {LIKED_BY_ME.length}件
          </span>
        </div>
        <div className="space-y-2">
          {LIKED_BY_ME.map((m) => (
            <LikeMemberCard key={m.id} member={m} />
          ))}
        </div>
      </div>

      {/* あなたにいいねしたメンバー */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <HeartHandshake className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-bold text-zinc-200">あなたにいいねしたメンバー</h3>
          <span className="ml-auto text-xs text-zinc-500 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">
            {LIKED_ME.length}件
          </span>
        </div>
        <div className="space-y-2">
          {LIKED_ME.map((m) => (
            <LikeMemberCard key={m.id} member={m} />
          ))}
        </div>
      </div>
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
}

function ToggleSwitch({ checked, onChange, label, description }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-700/50 last:border-0">
      <div>
        <p className="text-sm text-zinc-200 font-medium">{label}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
          checked ? 'bg-teal-600' : 'bg-zinc-600'
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

interface WithdrawalModalProps {
  onClose: () => void;
}

function WithdrawalModal({ onClose }: WithdrawalModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* モーダル本体 */}
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-950 border border-red-800 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-white">退会の確認</h3>
        </div>

        <p className="text-zinc-400 text-sm leading-relaxed mb-2">
          退会するとすべてのデータが削除され、元に戻すことはできません。
        </p>
        <ul className="text-zinc-500 text-xs space-y-1 mb-6 list-disc list-inside">
          <li>プロフィール情報</li>
          <li>いいね・マッチング履歴</li>
          <li>メッセージ履歴</li>
        </ul>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-600 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors"
          >
            退会する
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm ' +
  'placeholder-zinc-500 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors w-full';

function SettingsTab() {
  const [email, setEmail] = useState('sakura@example.com');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [notifyLike, setNotifyLike] = useState(true);
  const [notifyMessage, setNotifyMessage] = useState(true);
  const [notifyMatch, setNotifyMatch] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);

  return (
    <>
      {showWithdrawal && <WithdrawalModal onClose={() => setShowWithdrawal(false)} />}

      <div className="space-y-4">
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
                className="px-4 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors flex-shrink-0"
              >
                保存
              </button>
            </div>
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
              <button
                type="button"
                className="w-full mt-1 px-4 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                パスワードを変更する
              </button>
            </div>
          </div>
        </div>

        {/* 通知設定 */}
        <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5">
          <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-teal-500 rounded-full inline-block" />
            通知設定
          </h3>
          <div className="space-y-0">
            <ToggleSwitch
              checked={notifyLike}
              onChange={setNotifyLike}
              label="いいね通知"
              description="いいねを受け取ったときに通知します"
            />
            <ToggleSwitch
              checked={notifyMessage}
              onChange={setNotifyMessage}
              label="メッセージ通知"
              description="新しいメッセージが届いたときに通知します"
            />
            <ToggleSwitch
              checked={notifyMatch}
              onChange={setNotifyMatch}
              label="マッチング通知"
              description="マッチングが成立したときに通知します"
            />
          </div>
        </div>

        {/* 退会 */}
        <div className="bg-zinc-800 rounded-2xl border border-red-900/50 p-5">
          <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-2">
            <span className="w-1 h-4 bg-red-500 rounded-full inline-block" />
            危険ゾーン
          </h3>
          <p className="text-zinc-500 text-xs mb-4">
            退会するとすべてのデータが完全に削除されます。この操作は取り消せません。
          </p>
          <button
            type="button"
            onClick={() => setShowWithdrawal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            退会する
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Tab Navigation
// ============================================================

type TabId = 'profile' | 'likes' | 'settings';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'profile',  label: 'マイプロフィール', icon: User },
  { id: 'likes',    label: 'いいね履歴',        icon: Heart },
  { id: 'settings', label: '設定',              icon: Settings },
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
      <div className="flex border-b border-zinc-800 mb-6 gap-1 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 border-b-2 -mb-px focus:outline-none ${
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

      {/* タブコンテンツ */}
      {activeTab === 'profile'  && <ProfileTab />}
      {activeTab === 'likes'    && <LikesTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  );
}
