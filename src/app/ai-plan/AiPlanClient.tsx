'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart, ChevronLeft, Sparkles, Bot, Clock3, TrendingUp,
  UserPlus, ShieldCheck, CreditCard, Search, HeartHandshake,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { CAMPAIGN_SLOT_LIMIT } from '@/lib/campaign';

// ============================================================
// 特徴
// ============================================================

const FEATURES = [
  {
    icon: Bot,
    title: 'AIが自動でお相手を選定',
    description: '価値観や希望条件をもとに、AIが相性の良さそうなお相手を分析します。',
  },
  {
    icon: Clock3,
    title: '仕事や育児で忙しくてもOK',
    description: '毎週AIがおすすめメンバーをご提案。自分で探し回る必要はありません。',
  },
  {
    icon: TrendingUp,
    title: '相性スコアでわかりやすく',
    description: '相性スコアと理由つきでご紹介するので、次のアクションを判断しやすくなっています。',
  },
];

// ============================================================
// 簡単な流れ（4ステップに簡略化）
// ============================================================

const SIMPLE_STEPS = [
  {
    icon: UserPlus,
    title: '会員登録（無料）',
    description: '基本情報・プロフィールを入力して登録申請します。',
  },
  {
    icon: ShieldCheck,
    title: '本人確認審査',
    description: '身分証をアップロードいただき、通常1〜3営業日で審査完了です。',
  },
  {
    icon: Search,
    title: 'AIおすすめプランに申込',
    description: 'マイページから加入。以降、毎週AIがお相手をご提案します。',
  },
  {
    icon: HeartHandshake,
    title: '気になる方にお見合い申請',
    description: 'AIの提案から気になる方を選んで申請。お見合いはGoogle Meetで完結します。',
  },
];

export default function AiPlanClient() {
  const [showCampaignBanner, setShowCampaignBanner] = useState(false);
  const [campaignPeriodLabel, setCampaignPeriodLabel] = useState('');

  useEffect(() => {
    fetch('/api/campaign-banner')
      .then((res) => res.json())
      .then((data) => {
        setShowCampaignBanner(!!data.active);
        if (data.periodLabel) setCampaignPeriodLabel(data.periodLabel);
      })
      .catch(() => setShowCampaignBanner(false));
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ヘッダー */}
      <header className="sticky top-[var(--banner-offset)] z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-zinc-400 hover:text-teal-400 transition-colors"
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
        <div className="mb-6 text-center pt-6">
          <div className="inline-flex items-center gap-1.5 bg-pink-950/60 text-pink-300 text-xs font-medium px-3 py-1.5 rounded-full mb-4 border border-pink-800/60">
            <Sparkles className="w-3.5 h-3.5" />
            AIおすすめプラン
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            AIが、あなたに合うお相手を<br />毎週お届けします
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            仕事や育児で忙しい方でも、自分から探し回らずに婚活を続けられます。
          </p>
        </div>

        {/* キャンペーンバナー */}
        {showCampaignBanner && (
          <div
            className="rounded-2xl p-5 mb-6 text-white text-center"
            style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)' }}
          >
            <p className="font-bold text-sm mb-1">🎉 オープン記念キャンペーン</p>
            <p className="text-sm text-white/90 leading-relaxed">
              {campaignPeriodLabel}にお申し込みの方は、申込日から3ヶ月間無料！（先着{CAMPAIGN_SLOT_LIMIT}名まで）
            </p>
          </div>
        )}

        {/* 特徴 */}
        <div className="space-y-3 mb-8">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-zinc-800 rounded-2xl border border-zinc-700 p-4 flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-pink-900/40 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4.5 h-4.5 text-pink-400" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white mb-1">{f.title}</h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">{f.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* デモ動画 */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-400" />
            実際の画面イメージ
          </h2>
          <div className="rounded-2xl overflow-hidden border border-zinc-700">
            <Image
              src="/ai-recommend-full-demo-v2.gif"
              alt="AIおすすめプランの操作イメージ：希望条件を入力してAI分析を実行し、相性スコア付きのおすすめ相手が表示される様子"
              width={1556}
              height={790}
              unoptimized
              className="w-full h-auto"
            />
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            ※デモ画面です。実際の分析結果は登録内容により異なります。
          </p>
        </div>

        {/* 簡単な流れ */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-white mb-3">ご利用の流れ（かんたん4ステップ）</h2>
          <div className="space-y-2">
            {SIMPLE_STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="bg-zinc-800 rounded-2xl border border-zinc-700 p-4 flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-teal-900/60 border-2 border-teal-700/60 flex items-center justify-center text-xs font-bold text-teal-400 flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                      <h3 className="text-sm font-bold text-white">{s.title}</h3>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{s.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-center">
            <Link href="/how-it-works?plan=ai" className="text-xs text-teal-400 hover:text-teal-300 underline underline-offset-2">
              より詳しいステップを見る（お見合い〜成婚報告まで）
            </Link>
          </div>
        </div>

        {/* 料金 */}
        <div className="bg-zinc-800 rounded-2xl border-2 border-pink-500/60 p-6 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-pink-400" />
            <h2 className="text-sm font-bold text-white">料金</h2>
          </div>
          <div className="flex items-end gap-1 mb-1">
            <span className="text-3xl font-bold text-white">¥1,078</span>
            <span className="text-zinc-400 text-sm mb-1">〜 / 月（税込）</span>
          </div>
          <p className="text-zinc-500 text-xs mb-3">税別 ¥980〜 / 月</p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            上記の月額料金に加え、お見合いが決まった際は1件あたり¥3,000（税込）のお見合い料をお支払いいただきます。解約はマイページからいつでも可能で、違約金はありません。
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 mb-4">
          <Link href="/signup">
            <Button size="lg" fullWidth className="bg-teal-500 hover:bg-teal-400 text-white font-bold">
              <Heart className="w-4 h-4 fill-white" />
              無料で会員登録する
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" fullWidth>
              すでに会員の方はログイン
            </Button>
          </Link>
        </div>
        <p className="text-xs text-zinc-500 text-center mb-8">
          登録無料・本人確認審査あり・Google Meetでお見合い
        </p>

        <div className="pb-8" />
      </div>

      <ScrollToTop />
    </div>
  );
}
