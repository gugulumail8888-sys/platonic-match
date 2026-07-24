'use client';

import { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Heart, ArrowLeft, MapPin, Briefcase,
  Ruler, User, GraduationCap, Users, Cigarette,
  Wallet, Home, GitMerge, Calendar, Baby, Sparkles, HeartHandshake,
  Loader2, Bot, Receipt, TriangleAlert,
} from 'lucide-react';
import { getAvatarColor, AVATAR_COLORS } from '@/lib/utils';

interface Member {
  id: string;
  nickname: string;
  gender: string;
  birth_date: string | null;
  prefecture: string | null;
  occupation: string | null;
  body_type: string | null;
  marital_history: string | null;
  number_of_children: string | null;
  hobbies: string | null;
  height: number | null;
  blood_type: string | null;
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
  pr: string | null;
  desired_conditions: string | null;
  avatar_url: string | null;
}

interface MyProfile {
  nickname: string;
  age: number;
  prefecture: string | null;
  occupation: string | null;
  hobbies: string | null;
  pr: string | null;
}

function calcAge(birthDate: string | null): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5 md:p-6">
      <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function ConfirmApplyModal({ member, onClose, onConfirm, aiLoading, aiScore, aiReason, aiIsDemo, applying, hasAiOption }: {
  member: Member;
  onClose: () => void;
  onConfirm: () => void;
  aiLoading: boolean;
  aiScore: number | null;
  aiReason: string;
  aiIsDemo: boolean;
  applying: boolean;
  hasAiOption: boolean;
}) {
  const age = calcAge(member.birth_date);
  const color = getAvatarColor(member.id);
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <HeartHandshake className="w-5 h-5 text-teal-400" />
          <h2 className="text-lg font-bold text-white">お見合いを申請しますか？</h2>
        </div>
        <p className="text-sm text-zinc-500 mb-5">以下の内容でお見合いを申請します。</p>
        <div className="bg-zinc-800 rounded-xl p-4 mb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ backgroundColor: color }}>
            {member.nickname.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-white">{member.nickname}</p>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              {age > 0 && <span>{age}歳</span>}
              {member.prefecture && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-teal-500" />{member.prefecture}</span>}
            </div>
          </div>
        </div>
        <div className="bg-zinc-800 rounded-xl p-4 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm text-zinc-400">
            <Receipt className="w-4 h-4" />料金
          </span>
          <span className="text-white font-bold text-lg">1回 {hasAiOption ? '3,000' : '3,500'}円<span className="text-sm font-normal text-zinc-400 ml-1">（税込）</span></span>
        </div>
        {hasAiOption && <div className="bg-zinc-800 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Bot className="w-3.5 h-3.5 text-teal-400" />
            <p className="text-xs font-semibold text-teal-400 uppercase tracking-wide">AI相性コメント</p>
            {aiIsDemo && !aiLoading && (
              <span className="ml-auto text-[10px] bg-amber-900/40 text-amber-400 border border-amber-800 px-1.5 py-0.5 rounded-full">デモ</span>
            )}
          </div>
          {aiLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 text-teal-500 animate-spin flex-shrink-0" />
              <p className="text-sm text-zinc-400">AIが相性を分析中...</p>
            </div>
          ) : aiScore !== null ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-700 rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${aiScore >= 70 ? 'bg-teal-400' : aiScore >= 50 ? 'bg-teal-600' : 'bg-amber-500'}`}
                    style={{ width: `${aiScore}%` }} />
                </div>
                <span className={`text-sm font-bold tabular-nums ${aiScore >= 70 ? 'text-teal-400' : aiScore >= 50 ? 'text-teal-500' : 'text-amber-400'}`}>
                  {aiScore}
                </span>
              </div>
              {aiReason && <p className="text-xs text-zinc-400 leading-relaxed">{aiReason}</p>}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">分析結果を取得できませんでした</p>
          )}
        </div>}
        <div className="flex gap-3">
          <button onClick={onClose} disabled={applying}
            className="flex-1 py-2.5 rounded-xl border border-zinc-600 text-zinc-400 text-sm hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            キャンセル
          </button>
          <button onClick={onConfirm} disabled={applying}
            className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5">
            {applying ? <><Loader2 className="w-4 h-4 animate-spin" />申請中...</> : '申請する'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoApplyTriggered = useRef(false);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [hasAiOption, setHasAiOption] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiReason, setAiReason] = useState('');
  const [aiIsDemo, setAiIsDemo] = useState(false);
  const [applying, setApplying] = useState(false);
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [omiaiOpen, setOmiaiOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/members/${id}`)
      .then((r) => r.json())
      .then((data: { member: Member }) => setMember(data.member ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: { hasAiOption: boolean; profile?: MyProfile }) => {
        setHasAiOption(data.hasAiOption ?? false);
        setMyProfile(data.profile ?? null);
      })
      .catch(() => {});

    fetch('/api/likes')
      .then((r) => r.json())
      .then((data: { liked: string[]; remainingToday?: number }) => {
        setIsLiked((data.liked ?? []).includes(id));
        setRemainingToday(data.remainingToday ?? null);
      })
      .catch(() => {});

    fetch('/api/blocks')
      .then((r) => r.json())
      .then((data: { blocked: string[] }) => {
        setIsBlocked((data.blocked ?? []).includes(id));
      })
      .catch(() => {});

    fetch('/api/settings/omiai')
      .then(res => res.json())
      .then(data => setOmiaiOpen(data.omiai_open));
  }, [id]);

  const handleToggleLike = async () => {
    if (!member) return;
    setLikeLoading(true);
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id }),
      });
      const data = await res.json() as { liked?: boolean; error?: string };
      if (!res.ok) {
        alert(data.error ?? 'いいねの送信に失敗しました');
        return;
      }
      setIsLiked(data.liked ?? false);
    } catch {
      alert('いいねの送信に失敗しました');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!member) return;
    const msg = isBlocked
      ? `${member.nickname}さんのブロックを解除しますか？`
      : `${member.nickname}さんをブロックしますか？\nブロックすると会員一覧に表示されなくなります。`;
    if (!window.confirm(msg)) return;
    setBlockLoading(true);
    try {
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id }),
      });
      const data = await res.json() as { blocked: boolean };
      setIsBlocked(data.blocked);
    } catch {
    } finally {
      setBlockLoading(false);
    }
  };

  const handleOpenApply = () => {
    if (!member) return;
    setShowApplyModal(true);
    setAiLoading(true);
    setAiScore(null);
    setAiReason('');
    fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ myProfile: {}, candidates: [member] }),
    })
      .then((r) => r.json())
      .then((data: { candidates?: { id: string; score: number; reason: string }[]; isDemo?: boolean }) => {
        if (data.candidates?.[0]) {
          setAiScore(data.candidates[0].score);
          setAiReason(data.candidates[0].reason);
        }
        setAiIsDemo(data.isDemo ?? false);
      })
      .catch((err) => console.error('AI recommend error:', err))
      .finally(() => setAiLoading(false));
  };

  useEffect(() => {
    if (autoApplyTriggered.current) return;
    if (searchParams.get('apply') !== '1') return;
    if (!member || !myProfile) return;
    autoApplyTriggered.current = true;
    handleOpenApply();
  }, [member, myProfile, searchParams]);

  const handleConfirmApply = async () => {
    if (!member) return;
    setApplying(true);
    try {
      const res = await fetch('/api/matching/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant: {
            nickname: myProfile?.nickname,
            age: myProfile?.age,
            prefecture: myProfile?.prefecture,
            occupation: myProfile?.occupation,
            hobbies: myProfile?.hobbies,
            pr: myProfile?.pr,
          },
          member: { id: member.id, nickname: member.nickname, age: calcAge(member.birth_date), prefecture: member.prefecture, occupation: member.occupation },
          amount: 3000,
        }),
      });
      const data = await res.json() as { success: boolean; applicationId: string; notifyMessage: string; isDemo: boolean; error?: string };
      if (!res.ok || !data.success) {
        alert(data.error ?? 'お見合い申請に失敗しました。もう一度お試しください。');
        setApplying(false);
        return;
      }
      setApplied(true);
      setShowApplyModal(false);
      const query = new URLSearchParams({
        applicationId: data.applicationId,
        nickname: member.nickname,
        age: String(calcAge(member.birth_date)),
        prefecture: member.prefecture ?? '',
        notifyMessage: data.notifyMessage,
        isDemo: String(data.isDemo),
      });
      router.push(`/matching/complete?${query.toString()}`);
    } catch (err) {
      console.error(err);
      alert('お見合い申請に失敗しました。もう一度お試しください。');
      setApplying(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
    </div>
  );

  if (!member) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-zinc-400">メンバーが見つかりませんでした</p>
      <Link href="/members" className="text-teal-400 hover:underline">会員一覧へ戻る</Link>
    </div>
  );

  const age = calcAge(member.birth_date);
  const avatarColor = getAvatarColor(member.id);

  return (
    <>
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
        <Link href="/members" className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />メンバー一覧へ戻る
        </Link>

        {/* プレリリース中の案内(お見合い申請受付が開始されるまでの期間限定表示) */}
        {!omiaiOpen && (
          <div className="bg-teal-950/40 border border-teal-800/60 rounded-xl px-4 py-3 text-teal-300 text-xs sm:text-sm">
            右下の「ご意見・ご要望」より、プロフィールについてのご意見をお寄せください。
          </div>
        )}

        {/* ヘッダー */}
        <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 select-none shadow-lg"
            style={{ backgroundColor: avatarColor }}>
            {member.nickname.charAt(0)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{member.nickname}</h1>
            {age > 0 && <p className="text-zinc-400 text-sm mb-3">{age}歳</p>}
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm">
              {member.prefecture && <span className="flex items-center gap-1.5 text-zinc-300"><MapPin className="w-3.5 h-3.5 text-teal-500" />{member.prefecture}</span>}
              {member.occupation && <span className="flex items-center gap-1.5 text-zinc-300"><Briefcase className="w-3.5 h-3.5 text-teal-500" />{member.occupation}</span>}
              {member.height && <span className="flex items-center gap-1.5 text-zinc-300"><Ruler className="w-3.5 h-3.5 text-teal-500" />{member.height}cm</span>}
            </div>
          </div>
        </div>

        <div>
          {omiaiOpen && remainingToday !== null && (
            <p className="text-xs text-zinc-500 text-center mb-2">
              本日のいいね残り <span className={remainingToday === 0 ? 'text-red-400 font-bold' : 'text-teal-400 font-bold'}>{remainingToday}件</span>
            </p>
          )}
          <div className="flex flex-col gap-3">
            {omiaiOpen && (
              <div className="flex gap-3">
                <button onClick={handleToggleBlock} disabled={blockLoading}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${isBlocked ? 'bg-red-900/40 text-red-400 border border-red-800 hover:bg-red-900/60' : 'bg-zinc-700 text-zinc-300 border border-zinc-600 hover:bg-zinc-600'}`}>
                  {blockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TriangleAlert className="w-4 h-4" />}
                  {isBlocked ? 'ブロック解除' : 'ブロック'}
                </button>
                <button onClick={handleToggleLike} disabled={likeLoading}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${isLiked ? 'bg-pink-900/40 text-pink-400 border border-pink-800 hover:bg-pink-900/60' : 'bg-zinc-700 text-zinc-300 border border-zinc-600 hover:bg-zinc-600'}`}>
                    {likeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
                    {isLiked ? 'いいね済み' : 'いいね'}
                  </button>
              </div>
            )}
            {!applied && omiaiOpen && (
              <button onClick={handleOpenApply}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 transition-colors">
                <Heart className="w-4 h-4" />お見合いを申請する
              </button>
            )}
            {!applied && !omiaiOpen && (
              <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-700 text-zinc-400 text-sm cursor-not-allowed">
                <Heart className="w-4 h-4" />お見合い申請は近日開始予定
              </div>
            )}
            {applied && (
              <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-700 text-zinc-400 text-sm">
                <Heart className="w-4 h-4" />申請済み
              </div>
            )}
          </div>
        </div>

        {/* 基本情報 */}
        <SectionCard title="基本情報">
          <InfoRow icon={User} label="体型" value={member.body_type} />
          <InfoRow icon={Ruler} label="身長" value={member.height ? `${member.height}cm` : null} />
          <InfoRow icon={GitMerge} label="血液型" value={member.blood_type} />
          <InfoRow icon={GraduationCap} label="学歴" value={member.education} />
          <InfoRow icon={Users} label="兄弟姉妹の有無" value={member.siblings_exist} />
          {member.siblings_exist === 'あり' && (<>
<InfoRow icon={Users} label="兄弟姉妹の詳細" value={member.siblings_detail} />
            <InfoRow icon={Users} label="自分の続柄" value={member.siblings_position} />
            </>
          )}
          <InfoRow icon={Cigarette} label="喫煙" value={member.smoking === 'true' ? '喫煙あり' : member.smoking === 'false' ? '喫煙なし' : member.smoking} />
          <InfoRow icon={Wallet} label="年収" value={member.income} />
          <InfoRow icon={Home} label="住まい" value={member.living_arrangement} />
        </SectionCard>

        {/* 結婚観 */}
        <SectionCard title="結婚観">
          <InfoRow icon={Calendar} label="結婚時期" value={member.marriage_timing} />
          <InfoRow icon={Baby} label="子どもへの希望" value={member.children_desire === 'want' ? 'ほしい' : member.children_desire === 'notwant' ? 'ほしくない' : member.children_desire === 'undecided' ? '未定' : member.children_desire} />
          <InfoRow icon={Wallet} label="家計管理" value={member.finance_management} />
          <InfoRow icon={Sparkles} label="セクシュアリティ" value={member.sexuality} />
          <InfoRow icon={HeartHandshake} label="婚外パートナー" value={member.external_partner} />
        </SectionCard>

        {/* 趣味・自己PR */}
        {member.hobbies && (
          <SectionCard title="趣味">
            <p className="text-sm text-zinc-300 leading-relaxed">{member.hobbies}</p>
          </SectionCard>
        )}
        {member.pr && (
          <SectionCard title="自己PR">
            <p className="text-sm text-zinc-300 leading-relaxed">{member.pr}</p>
          </SectionCard>
        )}
        {member.desired_conditions && (
          <SectionCard title="希望条件">
            <p className="text-sm text-zinc-300 leading-relaxed">{member.desired_conditions}</p>
          </SectionCard>
        )}
      </div>

      {showApplyModal && (
        <ConfirmApplyModal
          member={member}
          onClose={() => setShowApplyModal(false)}
          onConfirm={handleConfirmApply}
          aiLoading={aiLoading}
          aiScore={aiScore}
          aiReason={aiReason}
          aiIsDemo={aiIsDemo}
          applying={applying}
          hasAiOption={hasAiOption}
        />
      )}
    </>
  );
}
