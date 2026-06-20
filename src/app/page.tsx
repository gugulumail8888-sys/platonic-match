import type { Metadata } from "next";
import Link from "next/link";
import { Users, Shield, MessageCircle, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScrollHeader } from "@/components/ui/ScrollHeader";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: '友情から始まる本物のパートナーシップ | amista',
  description: 'amistaは友情・信頼・パートナーシップを大切にする友情婚活マッチングサービス。AIおすすめ機能とGoogle Meetで効率よくお見合いができます。',
};

async function isCampaignBannerActive(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'campaign_banner_enabled')
    .maybeSingle();

  if (data?.value !== 'true') return false;

  const now = new Date();
  const start = new Date('2026-07-01T00:00:00+09:00');
  const end = new Date('2026-09-30T23:59:59+09:00');
  return now >= start && now <= end;
}

export default async function HomePage() {
  const showCampaignBanner = await isCampaignBannerActive();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* スクロール対応ヘッダー（クライアントコンポーネント） */}
      <ScrollHeader />

      {/* ヒーローセクション */}
      <section
        className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950"
      >
        <div className="max-w-4xl mx-auto text-center pt-20 pb-10">
          <div className="inline-flex items-center gap-2 bg-primary-950/80 text-primary-400 text-sm font-medium px-4 py-2 rounded-full mb-8 border border-primary-800/60 backdrop-blur-sm">
            <Star className="w-4 h-4 fill-current" />
            友情から始まる、新しい婚活のかたち
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            「結婚しなきゃ」から
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
            }}>
              解放される、新しい選択。
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto mb-2 leading-relaxed">
            親や周囲からの結婚プレッシャー、感じていませんか？
          </p>
          <p className="text-base text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
            amistaは「恋愛なし・価値観が合う生涯のパートナー」と出会える<br className="hidden sm:block" />
            友情婚活サービスです。
          </p>

          {/* 3つのポイント */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-10">
            {[
              { emoji: '😮‍💨', text: '「結婚しなきゃ」のプレッシャーから解放' },
              { emoji: '🤝',   text: '恋愛感情なしで一緒に生きるパートナーを探す' },
              { emoji: '✨',   text: '自分らしい人生の形を、自分で選ぶ' },
            ].map(({ emoji, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-700/60 rounded-full px-4 py-2 text-sm text-zinc-300 backdrop-blur-sm"
              >
                <span>{emoji}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="min-w-[200px] shadow-lg">
                <Heart className="w-5 h-5 fill-white" />
                無料で始める
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="min-w-[200px]">
                ログイン
              </Button>
            </Link>
          </div>

          <p className="text-sm text-zinc-500 mt-6">
            登録無料・本人確認審査あり・Google Meetでお見合い
          </p>
        </div>
      </section>

      {/* 夏のキャンペーンバナー */}
      {showCampaignBanner && (
        <section className="px-4 -mt-px">
          <div
            className="max-w-4xl mx-auto rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-5 md:gap-8 text-white"
            style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)' }}
          >
            <div className="text-5xl flex-shrink-0">🎉</div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-baseline gap-2 mb-2">
                <h2 className="text-xl md:text-2xl font-bold">オープン記念！初期限定キャンペーン</h2>
                <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  期間限定
                </span>
              </div>
              <p className="text-white/90 text-sm md:text-base leading-relaxed">
                7月〜9月にAIおすすめ機能をお申し込みの方は、申込日から3ヶ月間無料！
              </p>
            </div>
            <Link href="/option-apply" className="flex-shrink-0">
              <button className="bg-white text-orange-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors whitespace-nowrap">
                AIおすすめ機能を見る
              </button>
            </Link>
          </div>
        </section>
      )}

      {/* 友情婚活とは */}
      <section id="about" className="py-16 px-4 bg-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              友情婚活とは？
            </h2>
            <p className="text-zinc-400">恋愛から始まる婚活とは、少し違います</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-800 rounded-2xl p-6 border border-zinc-700">
              <h3 className="font-bold text-zinc-400 text-sm mb-3">❌ 一般的な婚活</h3>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>・ 第一印象や外見が重視される</li>
                <li>・ 恋愛感情が前提</li>
                <li>・ 「好き」という気持ちから始まる</li>
                <li>・ 早期に交際・プレッシャー</li>
              </ul>
            </div>
            <div className="bg-primary-950 rounded-2xl p-6 border border-primary-800">
              <h3 className="font-bold text-primary-400 text-sm mb-3">✅ amistaの友情婚活</h3>
              <ul className="space-y-2 text-sm text-primary-300">
                <li>・ 価値観・人柄・考え方を重視</li>
                <li>・ 友人として信頼関係を築く</li>
                <li>・ 「この人と人生を歩みたい」から始まる</li>
                <li>・ プレッシャーなく自分らしく</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 統計 */}
      <section className="py-12 px-4 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { icon: '🤝', label: '事務局が仲介', sub: '安心のサポート体制' },
              { icon: '💻', label: 'Google Meetお見合い', sub: '自宅から気軽に参加' },
              { icon: '🔒', label: '連絡先は事務局経由', sub: '個人情報を守ります' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl mb-2">{stat.icon}</div>
                <div className="text-sm md:text-base font-semibold text-white mb-1">{stat.label}</div>
                <div className="text-xs text-zinc-500">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section id="features" className="py-20 px-4 bg-zinc-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              amistaの<span className="text-primary-400">3つの特徴</span>
            </h2>
            <p className="text-zinc-400">友情を基盤にした婚活を支えるために</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "安心・安全な環境",
                desc: "本人確認必須・審査制で誠実な方だけが参加。Google Meetお見合いで顔を確認するため、外見より内面・価値観を重視した出会いを実現。",
                color: "text-blue-400",
                bg: "bg-blue-950",
                border: "border-blue-900",
              },
              {
                icon: Users,
                title: "価値観マッチング",
                desc: "趣味・ライフスタイル・将来の価値観を詳しく入力。友人として相性の良い相手を見つけるための充実したプロフィール。",
                color: "text-primary-400",
                bg: "bg-primary-950",
                border: "border-primary-900",
              },
              {
                icon: MessageCircle,
                title: "Google Meetでじっくり対話",
                desc: "テキストではなくGoogle Meetで顔を見ながら対話。友人として話すような感覚で、お互いの人柄をじっくり確かめることができます。",
                color: "text-amber-400",
                bg: "bg-amber-950",
                border: "border-amber-900",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-zinc-800 rounded-3xl p-8 shadow-card hover:shadow-card-hover transition-all duration-300 border border-zinc-700"
              >
                <div
                  className={`w-14 h-14 ${feature.bg} border ${feature.border} rounded-2xl flex items-center justify-center mb-5`}
                >
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金プラン */}
      <section id="pricing" className="py-20 px-4 bg-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              シンプルな<span className="text-primary-400">料金プラン</span>
            </h2>
            <p className="text-zinc-400">まずは無料で始めて、必要な時にアップグレード</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-start">

            {/* 無料プラン */}
            <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-8">
              <div className="mb-6">
                <p className="text-sm font-medium text-zinc-400 mb-1">無料プラン</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">¥0</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  '会員登録・プロフィール作成',
                  'メンバー検索・閲覧',
                  'お見合い申請（1件 ¥3,500（税込））',
                  'マイページ管理',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <span className="text-teal-400 flex-shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link href="/signup">
                <Button variant="outline" fullWidth>
                  無料で始める
                </Button>
              </Link>
            </div>

            {/* AIおすすめプラン */}
            <div className="bg-zinc-800 rounded-2xl border-2 border-pink-500/60 p-8 shadow-lg shadow-pink-950/30 relative">
              {/* おすすめバッジ */}
              <div
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1 rounded-full"
                style={{ background: 'linear-gradient(to right, #ec4899, #a855f7)' }}
              >
                おすすめ
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-pink-400 mb-1">AIおすすめプラン</p>
                {/* キャッチコピー */}
                <p className="text-xs text-pink-300/80 mb-2">仕事や育児で忙しいあなたへ</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">¥980</span>
                  <span className="text-zinc-400 text-sm mb-1">〜 / 月</span>
                </div>
                <p className="text-zinc-500 text-xs mt-0.5">税込 ¥1,078〜 / 月</p>
              </div>

              <ul className="space-y-3 mb-8">
                {/* 基本機能 */}
                {[
                  '会員登録・プロフィール作成',
                  'メンバー検索・閲覧',
                  'お見合い申請（1件 ¥3,000（税込））',
                  'マイページ管理',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <span className="flex-shrink-0 mt-0.5 text-teal-400">✓</span>
                    <span className="text-zinc-300">{item}</span>
                  </li>
                ))}

                {/* AI機能 区切り */}
                <li className="flex items-center gap-2 py-0.5">
                  <span className="flex-1 h-px bg-pink-800/50" />
                  <span className="text-xs text-pink-400/70 font-medium tracking-widest">AI 機能</span>
                  <span className="flex-1 h-px bg-pink-800/50" />
                </li>

                {/* AI機能 */}
                {[
                  'AIがあなたに合う相手を自動で選定',
                  '毎週おすすめメンバーをご提案',
                  '仕事・育児で忙しくても婚活できる',
                  'AIがあなたの代わりに相手を探す',
                  '優先サポート',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <span className="flex-shrink-0 mt-0.5 text-pink-400">✓</span>
                    <span className="text-pink-200">{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/register">
                <button
                  className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg"
                  style={{ background: 'linear-gradient(to right, #ec4899, #a855f7)' }}
                >
                  プランを選ぶ
                </button>
              </Link>
            </div>
          </div>

          {/* 注意書き */}
          <p className="text-center text-xs text-zinc-500 mt-6">
            ※ 無料プランのお見合い申請料：¥3,500（税込）／AIおすすめプランのお見合い申請料：¥3,000（税込）
          </p>
        </div>
      </section>

      {/* 他サービスとの違い */}
      <section id="voice" className="py-20 px-4 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">
              amistaが<span className="text-primary-400">選ばれる理由</span>
            </h2>
            <p className="text-zinc-400">一般的な婚活・マッチングアプリとの違い</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: '恋愛感情不要',
                icon: '💛',
                general: '「好き」という感情が必要',
                amista: '価値観・人柄で選ぶ友情婚活',
              },
              {
                title: '事務局が仲介',
                icon: '🤝',
                general: '個人間でやり取り',
                amista: '連絡先交換まで事務局がサポート',
              },
              {
                title: 'プレッシャーなし',
                icon: '😌',
                general: '交際・結婚を急かされる',
                amista: '自分のペースで自然に関係を築く',
              },
            ].map((item) => (
              <div key={item.title} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="bg-zinc-800 px-5 py-4 flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <h3 className="font-bold text-white text-sm">{item.title}</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-red-500 text-xs flex-shrink-0 mt-0.5 font-bold">❌</span>
                    <div>
                      <p className="text-[10px] text-zinc-500 mb-0.5">一般的な婚活</p>
                      <p className="text-sm text-zinc-400">{item.general}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-teal-400 text-xs flex-shrink-0 mt-0.5 font-bold">✅</span>
                    <div>
                      <p className="text-[10px] text-primary-400 mb-0.5">amista</p>
                      <p className="text-sm text-white font-medium">{item.amista}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA セクション */}
      <section className="py-20 px-4 bg-gradient-primary">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            信頼できる友人から、<br />ライフパートナーへ。
          </h2>
          <p className="text-white/80 mb-8">
            amistaで、あなたと価値観の合うパートナーを見つけましょう。
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-white text-primary-700 hover:bg-white/90 min-w-[200px]"
            >
              <Heart className="w-5 h-5 fill-current" />
              無料で始める
            </Button>
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-zinc-950 border-t border-zinc-800 text-zinc-500 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                <Heart className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="font-bold text-white tracking-wide">
                ami<span className="text-primary-400">sta</span>
              </span>
            </div>

            <nav className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/terms" className="hover:text-white transition-colors">
                利用規約
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                プライバシーポリシー
              </Link>
              <Link href="/tokusho" className="hover:text-white transition-colors">
                特定商取引法
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                お問い合わせ
              </Link>
              <Link href="/help" className="hover:text-white transition-colors">
                ヘルプ
              </Link>
              <Link href="/cancel-policy" className="hover:text-white transition-colors">
                キャンセルポリシー
              </Link>
            </nav>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-800 text-center text-xs">
            © 2026 amista. All rights reserved.
          </div>
        </div>
      </footer>
      <ScrollToTop />
    </div>
  );
}
