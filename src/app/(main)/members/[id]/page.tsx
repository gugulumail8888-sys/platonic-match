'use client';

import { useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Heart, MessageCircle, ArrowLeft, MapPin, Briefcase,
  Ruler, User, GraduationCap, Users, Cigarette,
  Wallet, Home, GitMerge, Calendar, Baby, Sparkles, HeartHandshake,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getMemberById } from '../_data';

// ============================================================
// Info Row
// ============================================================

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
// Section Card
// ============================================================

function SectionCard({ title, children }: {
  title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5 md:p-6">
      <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-teal-500 rounded-full inline-block" />
        {title}
      </h2>
      {children}
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function MemberProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const member = getMemberById(Number(params.id));
  if (!member) notFound();

  const [liked, setLiked] = useState(false);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-4">
      {/* 戻るリンク */}
      <Link
        href="/members"
        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        メンバー一覧へ戻る
      </Link>

      {/* ===== ヘッダーエリア ===== */}
      <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* イニシャルアバター */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl flex-shrink-0 select-none shadow-lg"
          style={{ background: member.avatarColor }}
        >
          {member.initials}
        </div>

        {/* 基本情報 */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            {member.nickname}
          </h1>
          <p className="text-zinc-400 text-sm mb-3">{member.age}歳</p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <MapPin className="w-3.5 h-3.5 text-teal-500" />
              {member.prefecture}
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Briefcase className="w-3.5 h-3.5 text-teal-500" />
              {member.occupation}
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Ruler className="w-3.5 h-3.5 text-teal-500" />
              {member.height}cm
            </span>
          </div>
        </div>
      </div>

      {/* ===== 基本情報 ===== */}
      <SectionCard title="基本情報">
        <div className="space-y-0">
          <InfoRow icon={Ruler}         label="身長"         value={`${member.height}cm`} />
          <InfoRow icon={User}          label="体型"         value={member.bodyType} />
          <InfoRow icon={Sparkles}      label="血液型"       value={member.bloodType} />
          <InfoRow icon={HeartHandshake} label="結婚歴"      value={member.maritalHistory} />
          <InfoRow icon={Baby}          label="お子様の人数" value={member.numberOfChildren} />
          <InfoRow icon={GraduationCap} label="学歴"         value={member.education} />
          <InfoRow icon={Users}         label="兄弟姉妹"     value={member.siblings} />
        </div>
      </SectionCard>

      {/* ===== ライフスタイル ===== */}
      <SectionCard title="ライフスタイル">
        <div className="space-y-0">
          <InfoRow icon={Cigarette}  label="喫煙"       value={member.smoking} />
          <InfoRow icon={Wallet}     label="収入（年収）" value={member.income} />
          <InfoRow icon={Home}       label="居住形態"    value={member.livingArrangement} />
          <InfoRow icon={GitMerge}   label="家計の管理"  value={member.financeManagement} />
          <InfoRow icon={Heart}      label="外部パートナー" value={member.externalPartner} />
        </div>
      </SectionCard>

      {/* ===== パートナー希望 ===== */}
      <SectionCard title="パートナー希望">
        <div className="space-y-0">
          <InfoRow icon={Calendar}   label="結婚希望時期"      value={member.marriageTiming} />
          <InfoRow icon={Baby}       label="子供の有無（希望）" value={member.childrenDesire} />
          <InfoRow icon={Sparkles}   label="セクシュアリティ"  value={member.sexuality} />
        </div>
      </SectionCard>

      {/* ===== 自己紹介 ===== */}
      <SectionCard title="自己紹介">
        <div className="space-y-5">
          {/* 趣味 */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">趣味</p>
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
              {member.hobbies}
            </p>
          </div>

          {/* PR */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">PR</p>
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
              {member.pr}
            </p>
          </div>

          {/* 希望条件 */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
              希望条件
            </p>
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
              {member.desiredConditions}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ===== アクションボタン ===== */}
      <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5 flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => setLiked((v) => !v)}
          variant={liked ? 'primary' : 'primary'}
          fullWidth
          className={liked ? 'opacity-80' : ''}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-white' : ''}`} />
          {liked ? 'いいね済み ♥' : 'いいね！'}
        </Button>
        <Button variant="outline" fullWidth>
          <MessageCircle className="w-4 h-4" />
          メッセージを送る
        </Button>
      </div>

      {/* 戻るリンク（下部） */}
      <div className="text-center pb-4">
        <Link
          href="/members"
          className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          メンバー一覧へ戻る
        </Link>
      </div>
    </div>
  );
}
