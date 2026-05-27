'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import {
  Heart, MessageCircle, ArrowLeft, MapPin, Briefcase,
  Ruler, User, GraduationCap, Users, Cigarette,
  Wallet, Home, GitMerge, Calendar, Baby, Sparkles, HeartHandshake,
  Loader2, Bot, Receipt, TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getMemberById } from '../_data';

// ============================================================
// ログインユーザー（さくら）のプロフィール
// TODO: Supabase連携後はセッションから取得する
// ============================================================

const MY_PROFILE = {
  nickname: 'さくら',
  age: 30,
  prefecture: '東京都',
  occupation: 'OL',
  hobbies:
    '読書が大好きで、毎月5冊以上は読んでいます。カフェ巡りも趣味で、休日は気になったカフェを巡っています。映画も好きで、特にフランス映画が好みです。',
  marriageTiming: '1〜2年以内',
  childrenDesire: 'ほしい',
  desiredConditions:
    '価値観が合う方を探しています。外見よりも中身を大切にしてくれる方、一緒にいて落ち着ける方が理想です。年齢は28〜38歳くらいの方。',
  pr: '明るくておっとりした性格です。仕事は真面目に取り組みながら、プライベートも大切にしています。料理は得意ではありませんが、一緒に作ることが好きです。日常の小さな幸せを大切にできるパートナーを探しています。',
};

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
// Confirm Apply Modal
// ============================================================

function ConfirmApplyModal({
  member,
  onClose,
  onConfirm,
  aiLoading,
  aiScore,
  aiReason,
  aiIsDemo,
  applying,
}: {
  member: ReturnType<typeof getMemberById> & object;
  onClose: () => void;
  onConfirm: () => void;
  aiLoading: boolean;
  aiScore: number | null;
  aiReason: string;
  aiIsDemo: boolean;
  applying: boolean;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center gap-2 mb-1">
          <HeartHandshake className="w-5 h-5 text-teal-400" />
          <h2 className="text-lg font-bold text-white">お見合いを申請しますか？</h2>
        </div>
        <p className="text-sm text-zinc-500 mb-5">
          以下の内容でお見合いを申請します
        </p>

        {/* 相手情報カード */}
        <div className="bg-zinc-800 rounded-xl p-4 mb-4 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 select-none"
            style={{ background: member.avatarColor }}
          >
            {member.initials}
          </div>
          <div>
            <p className="text-white font-semibold">{member.nickname}</p>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <span>{member.age}歳</span>
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-teal-500" />
                {member.prefecture}
              </span>
            </div>
          </div>
        </div>

        {/* 料金 */}
        <div className="bg-zinc-800 rounded-xl p-4 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm text-zinc-400">
            <Receipt className="w-4 h-4" />
            料金
          </span>
          <span className="text-white font-bold text-lg">
            1回 3,000円
            <span className="text-sm font-normal text-zinc-400 ml-1">（税込）</span>
          </span>
        </div>

        {/* 説明文 */}
        <p className="text-zinc-400 text-xs leading-relaxed mb-4 px-1">
          申請後、運営スタッフが双方に連絡し、ZOOMにてお見合いの日程を調整します。
          決済は申請後に確定いたします。
        </p>

        {/* AI相性コメント */}
        <div className="bg-zinc-800 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Bot className="w-3.5 h-3.5 text-teal-400" />
            <p className="text-xs font-semibold text-teal-400 uppercase tracking-wide">
              AI相性コメント
            </p>
            {aiIsDemo && !aiLoading && (
              <span className="ml-auto text-[10px] bg-amber-900/40 text-amber-400 border border-amber-800 px-1.5 py-0.5 rounded-full">
                デモ
              </span>
            )}
          </div>

          {aiLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 text-teal-500 animate-spin flex-shrink-0" />
              <p className="text-zinc-500 text-sm">AIが相性を分析中...</p>
            </div>
          ) : aiScore !== null ? (
            <div className="space-y-2">
              {/* スコアバー */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      aiScore >= 70 ? 'bg-teal-500' : aiScore >= 50 ? 'bg-teal-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${aiScore}%` }}
                  />
                </div>
                <span
                  className={`text-xl font-bold tabular-nums ${
                    aiScore >= 70 ? 'text-teal-400' : aiScore >= 50 ? 'text-teal-500' : 'text-amber-400'
                  }`}
                >
                  {aiScore}
                </span>
              </div>
              {aiReason && (
                <p className="text-zinc-300 text-sm leading-relaxed">{aiReason}</p>
              )}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">分析結果を取得できませんでした</p>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={applying}
            className="flex-1 py-2.5 rounded-xl border border-zinc-600 text-zinc-400 text-sm hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={aiLoading || applying}
            className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
          >
            {applying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                申請中...
              </>
            ) : (
              '申請する'
            )}
          </button>
        </div>
      </div>
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

  const router = useRouter();

  // お見合い申請の状態
  const [applied, setApplied]               = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [aiLoading, setAiLoading]           = useState(false);
  const [aiScore, setAiScore]               = useState<number | null>(null);
  const [aiReason, setAiReason]             = useState('');
  const [aiIsDemo, setAiIsDemo]             = useState(false);
  const [applying, setApplying]             = useState(false);

  // モーダルを開き、AIスコアを先読み
  const handleOpenApplyModal = async () => {
    setShowApplyModal(true);
    setAiLoading(true);
    setAiScore(null);
    setAiReason('');

    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          myProfile: MY_PROFILE,
          candidates: [member],
        }),
      });
      const data = await res.json() as {
        candidates?: { id: number; score: number; reason: string }[];
        isDemo?: boolean;
      };
      if (data.candidates?.[0]) {
        setAiScore(data.candidates[0].score);
        setAiReason(data.candidates[0].reason);
      }
      setAiIsDemo(data.isDemo ?? false);
    } catch (err) {
      console.error('AI recommend error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // 申請確定 → apply API → 完了ページへ遷移
  const handleConfirmApply = async () => {
    setApplying(true);
    try {
      const res = await fetch('/api/matching/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant: MY_PROFILE,
          member: {
            id:         member.id,
            nickname:   member.nickname,
            age:        member.age,
            prefecture: member.prefecture,
            occupation: member.occupation,
          },
          amount: 3000,
        }),
      });

      const data = await res.json() as {
        success:        boolean;
        applicationId:  string;
        notifyMessage:  string;
        isDemo:         boolean;
      };

      if (!data.success) throw new Error('apply failed');

      setApplied(true);
      setShowApplyModal(false);

      // 完了ページへ遷移（URLパラメータで情報を渡す）
      const query = new URLSearchParams({
        applicationId: data.applicationId,
        nickname:      member.nickname,
        age:           String(member.age),
        prefecture:    member.prefecture,
        notifyMessage: data.notifyMessage,
        isDemo:        String(data.isDemo),
      });
      router.push(`/matching/complete?${query.toString()}`);
    } catch (err) {
      console.error('Apply error:', err);
      setApplying(false);
    }
  };

  return (
    <>
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
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl flex-shrink-0 select-none shadow-lg"
            style={{ background: member.avatarColor }}
          >
            {member.initials}
          </div>
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
            <InfoRow icon={Ruler}          label="身長"         value={`${member.height}cm`} />
            <InfoRow icon={User}           label="体型"         value={member.bodyType} />
            <InfoRow icon={Sparkles}       label="血液型"       value={member.bloodType} />
            <InfoRow icon={HeartHandshake} label="結婚歴"       value={member.maritalHistory} />
            <InfoRow icon={Baby}           label="お子様の人数" value={member.numberOfChildren} />
            <InfoRow icon={GraduationCap}  label="学歴"         value={member.education} />
            <InfoRow icon={Users}          label="兄弟姉妹"     value={member.siblings} />
          </div>
        </SectionCard>

        {/* ===== ライフスタイル ===== */}
        <SectionCard title="ライフスタイル">
          <div className="space-y-0">
            <InfoRow icon={Cigarette} label="喫煙"         value={member.smoking} />
            <InfoRow icon={Wallet}    label="収入（年収）" value={member.income} />
            <InfoRow icon={Home}      label="居住形態"     value={member.livingArrangement} />
            <InfoRow icon={GitMerge}  label="家計の管理"   value={member.financeManagement} />
            <InfoRow icon={Heart}     label="外部パートナー" value={member.externalPartner} />
          </div>
        </SectionCard>

        {/* ===== パートナー希望 ===== */}
        <SectionCard title="パートナー希望">
          <div className="space-y-0">
            <InfoRow icon={Calendar} label="結婚希望時期"       value={member.marriageTiming} />
            <InfoRow icon={Baby}     label="子供の有無（希望）" value={member.childrenDesire} />
            <InfoRow icon={Sparkles} label="セクシュアリティ"   value={member.sexuality} />
          </div>
        </SectionCard>

        {/* ===== 自己紹介 ===== */}
        <SectionCard title="自己紹介">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">趣味</p>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{member.hobbies}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">PR</p>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{member.pr}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">希望条件</p>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{member.desiredConditions}</p>
            </div>
          </div>
        </SectionCard>

        {/* ===== アクションボタン ===== */}
        <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5 space-y-3">
          {/* お見合いを申請する（メインアクション） */}
          {applied ? (
            <button
              disabled
              className="w-full py-3 rounded-xl bg-zinc-700 text-zinc-500 text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-4 h-4" />
              申請済み
            </button>
          ) : (
            <button
              onClick={handleOpenApplyModal}
              className="w-full py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 active:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
              <HeartHandshake className="w-4 h-4" />
              お見合いを申請する（3,000円）
            </button>
          )}

          {/* サブアクション */}
          <Button variant="outline" fullWidth>
            <MessageCircle className="w-4 h-4" />
            メッセージを送る
          </Button>
        </div>

        {/* 注意書き */}
        <div className="flex items-start gap-2 px-1 pb-2">
          <TriangleAlert className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0 mt-0.5" />
          <p className="text-zinc-600 text-xs leading-relaxed">
            お見合い申請後、運営スタッフがご本人確認を行い、双方の同意を確認してから日程調整を進めます。
          </p>
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

      {/* ===== 確認モーダル ===== */}
      {showApplyModal && (
        <ConfirmApplyModal
          member={member}
          onClose={() => { if (!applying) setShowApplyModal(false); }}
          onConfirm={handleConfirmApply}
          aiLoading={aiLoading}
          aiScore={aiScore}
          aiReason={aiReason}
          aiIsDemo={aiIsDemo}
          applying={applying}
        />
      )}
    </>
  );
}
