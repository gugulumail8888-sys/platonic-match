import type { Metadata } from 'next';
import Link from 'next/link';
import {
  UserPlus, ShieldCheck, Search, Heart, Calendar,
  Video, ThumbsUp, CreditCard, MessageCircle, ClipboardList,
  AlertTriangle, ChevronDown, ChevronLeft,
} from 'lucide-react';
import { ScrollToTop } from '@/components/ui/ScrollToTop';

export const metadata: Metadata = {
  title: 'ご利用の流れ',
};

// ============================================================
// Types & Data
// ============================================================

type StepVariant = 'default' | 'paid' | 'goal';

interface Step {
  number: number;
  title: string;
  icon: React.ElementType;
  description: string;
  badge: string;
  variant: StepVariant;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: '会員登録（無料）',
    icon: UserPlus,
    description: '基本情報・プロフィールを入力して登録申請',
    badge: '無料',
    variant: 'default',
  },
  {
    number: 2,
    title: '本人確認審査',
    icon: ShieldCheck,
    description: '運転免許証・マイナンバーカード・パスポートのいずれかをアップロード。通常1〜3営業日で審査完了',
    badge: '1〜3営業日',
    variant: 'default',
  },
  {
    number: 3,
    title: 'メンバーを探す',
    icon: Search,
    description: '会員一覧やAIおすすめ機能から気になるメンバーを探す',
    badge: 'AIおすすめ機能あり',
    variant: 'default',
  },
  {
    number: 4,
    title: 'お見合い申請',
    icon: Heart,
    description: '気になった相手にお見合いを申請します。この時点での費用は発生しません',
    badge: '無料',
    variant: 'default',
  },
  {
    number: 5,
    title: '日程調整',
    icon: Calendar,
    description: '相手が承認したら希望日時を入力。日程確定後、前日までに両者それぞれ¥3,000をお支払いいただきます。事務局がZOOMリンクをお送りします',
    badge: '各¥3,000（税込）',
    variant: 'paid',
  },
  {
    number: 6,
    title: 'ZOOMお見合い',
    icon: Video,
    description: 'ZOOMでオンラインお見合い。顔を見ながらじっくりお話しましょう',
    badge: 'オンライン完結',
    variant: 'default',
  },
  {
    number: 7,
    title: '交際希望ボタン',
    icon: ThumbsUp,
    description: 'お見合い後にお互いが「交際希望」ボタンを押した場合のみ次のステップへ',
    badge: '両者合意が必要',
    variant: 'default',
  },
  {
    number: 8,
    title: '成功報酬のお支払い',
    icon: CreditCard,
    description: '両者が成功報酬をお支払いいただきます（金額は別途定める）',
    badge: '金額未定・変更予定',
    variant: 'paid',
  },
  {
    number: 9,
    title: '連絡先交換',
    icon: MessageCircle,
    description: 'お支払い確認後、事務局から相手の連絡先をご案内します。ここからお二人の新しい関係が始まります！',
    badge: 'ステップ完了',
    variant: 'default',
  },
  {
    number: 10,
    title: '成婚報告・アンケート提出',
    icon: ClipboardList,
    description: 'パートナーシップが成立したら、ぜひ事務局へご報告ください。成婚報告アンケートにご協力いただくと、サービス改善に役立てることができます。末永くお幸せに！',
    badge: '🎉 ゴール',
    variant: 'goal',
  },
];

// ============================================================
// Variant styles
// ============================================================

const variantStyles: Record<StepVariant, {
  card: string;
  numberBg: string;
  numberText: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
}> = {
  default: {
    card:       'bg-zinc-800 border-zinc-700',
    numberBg:   'bg-teal-900/60 border-teal-700/60',
    numberText: 'text-teal-400',
    iconBg:     'bg-teal-900/40',
    iconColor:  'text-teal-400',
    badgeBg:    'bg-zinc-700/60',
    badgeText:  'text-zinc-300',
  },
  paid: {
    card:       'bg-rose-950/20 border-rose-800/50',
    numberBg:   'bg-rose-900/60 border-rose-700/60',
    numberText: 'text-rose-400',
    iconBg:     'bg-rose-900/40',
    iconColor:  'text-rose-400',
    badgeBg:    'bg-rose-900/50 border border-rose-700/50',
    badgeText:  'text-rose-300',
  },
  goal: {
    card:       'bg-amber-950/20 border-amber-700/40',
    numberBg:   'bg-amber-900/60 border-amber-700/60',
    numberText: 'text-amber-400',
    iconBg:     'bg-amber-900/40',
    iconColor:  'text-amber-400',
    badgeBg:    'bg-amber-900/50 border border-amber-700/50',
    badgeText:  'text-amber-300',
  },
};

// ============================================================
// StepCard component
// ============================================================

function StepCard({ step }: { step: Step }) {
  const s = variantStyles[step.variant];
  const Icon = step.icon;

  return (
    <div className={`rounded-2xl border p-5 ${s.card}`}>
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center flex-shrink-0 gap-2">
          <span className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold ${s.numberBg} ${s.numberText}`}>
            {step.number}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${s.iconBg}`}>
              <Icon className={`w-4 h-4 ${s.iconColor}`} />
            </span>
            <h2 className="text-sm font-bold text-white">
              STEP {step.number}　{step.title}
            </h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed mb-3">
            {step.description}
          </p>
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${s.badgeBg} ${s.badgeText}`}>
            {step.badge}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            トップページへ
          </Link>
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}>
              <Heart className="w-2.5 h-2.5 text-white fill-white" />
            </div>
            <span className="font-bold text-white text-sm tracking-wide">
              ami<span className="text-teal-400">sta</span>
            </span>
          </Link>
        </div>
      </header>

      <div className="p-4 md:p-6 max-w-xl mx-auto">
        {/* ページヘッダー */}
        <div className="mb-6 text-center pt-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            amista ご利用の流れ
          </h1>
          <p className="text-zinc-400 text-sm">
            友情婚活パートナーを見つけるまでの9ステップ
          </p>
        </div>

        {/* 凡例 */}
        <div className="flex flex-wrap justify-center gap-3 mb-6 text-xs">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
            通常ステップ
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            有料ステップ
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            ゴール
          </span>
        </div>

        {/* ステップリスト */}
        <div>
          {STEPS.map((step, index) => (
            <div key={step.number}>
              <StepCard step={step} />
              {index < STEPS.length - 1 && (
                <div className="flex justify-center py-1">
                  <ChevronDown className="w-5 h-5 text-zinc-600" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 注意事項 */}
        <div className="mt-6 bg-zinc-800 rounded-2xl border border-zinc-700 p-5">
          <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            注意事項
          </h2>
          <ul className="space-y-2">
            {[
              'お見合い費用（各¥3,000）は日程確定後、前日までに両者それぞれにご請求します',
              '成功報酬は両者合意が確認できた場合のみ発生します',
              '連絡先の交換は必ず事務局を通じて行います',
              '個人間での直接的な連絡先交換はお控えください',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-400 leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="pb-12" />
      </div>

      <ScrollToTop />
    </div>
  );
}
