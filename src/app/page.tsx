import Link from "next/link";
import { Users, Shield, MessageCircle, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScrollHeader } from "@/components/ui/ScrollHeader";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* スクロール対応ヘッダー（クライアントコンポーネント） */}
      <ScrollHeader />

      {/* ヒーローセクション - カフェ風ウォームグラデーション */}
      <section
        className="relative min-h-screen flex items-center justify-center px-4"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(180, 120, 80, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(237, 126, 92, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 60% 80%, rgba(120, 80, 50, 0.12) 0%, transparent 50%),
            linear-gradient(135deg, #0a0806 0%, #1a1008 40%, #0f0c08 100%)
          `,
        }}
      >
        {/* テキスト可読性向上オーバーレイ */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />

        {/* ヒーローコンテンツ */}
        <div className="relative z-10 max-w-4xl mx-auto text-center pt-16">
          <div className="inline-flex items-center gap-2 bg-primary-950/80 text-primary-400 text-sm font-medium px-4 py-2 rounded-full mb-8 border border-primary-800/60 backdrop-blur-sm">
            <Star className="w-4 h-4 fill-current" />
            友情から始まる、新しい婚活のかたち
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6 drop-shadow-lg">
            信頼できる友として、
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #f09270 0%, #ed7e5c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
            }}>
              ともに歩もう。
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto mb-4 leading-relaxed drop-shadow">
            amistaは、恋愛感情より深い「友情・信頼・パートナーシップ」を大切にする
            友情婚活マッチングサービスです。
          </p>
          <p className="text-base text-zinc-400 max-w-xl mx-auto mb-12">
            外見や条件より、価値観や人柄が合うライフパートナーを見つけましょう。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="min-w-[200px] shadow-lg">
                <Heart className="w-5 h-5 fill-white" />
                無料で始める
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="min-w-[200px] backdrop-blur-sm">
                ログイン
              </Button>
            </Link>
          </div>

          <p className="text-sm text-zinc-500 mt-8">
            登録無料・審査あり・プロフィール写真任意
          </p>
        </div>

        {/* 下部グラデーションフェード（次セクションへの自然な接続） */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none" />
      </section>

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
              { number: "8,000+", label: "登録会員数" },
              { number: "2,100+", label: "パートナーシップ成立" },
              { number: "96%", label: "「友人として信頼できる」回答率" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold mb-2" style={{
                  background: 'linear-gradient(135deg, #f09270 0%, #ed7e5c 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  display: 'inline-block',
                }}>
                  {stat.number}
                </div>
                <div className="text-xs md:text-sm text-zinc-500">{stat.label}</div>
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
                desc: "本人確認必須・審査制で誠実な方だけが参加。プロフィール写真は任意で、外見より内面を重視した出会いを実現。",
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
                title: "じっくり交流",
                desc: "マッチング後は焦らずメッセージで交流。友達として話すような感覚で、お互いをゆっくりと深く知り合えます。",
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

      {/* 体験談 */}
      <section id="voice" className="py-20 px-4 bg-zinc-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              パートナーシップ <span className="text-primary-400">成立体験談</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                text: "恋愛がうまくいかず婚活をあきらめていましたが、amistaでは「まず友達として話しましょう」という雰囲気がよく、プレッシャーなく自分を出せました。今の夫とは半年間友人として交流し、自然とパートナーになれました。",
                name: "Aさん（32歳・女性）",
              },
              {
                text: "外見より価値観が合う人を探していたので、amistaの「友情優先」のコンセプトがぴったりでした。共通の趣味で盛り上がり、気がつけば一緒にいることが一番自然な存在になっていました。",
                name: "Bさん（38歳・男性）",
              },
            ].map((voice) => (
              <div key={voice.name} className="bg-zinc-800 rounded-2xl p-6 shadow-card border border-zinc-700">
                <div className="text-primary-400 text-4xl font-serif mb-3">"</div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">{voice.text}</p>
                <p className="text-xs text-zinc-500 font-medium">{voice.name}</p>
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
          <Link href="/register">
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
              <Link href="/contact" className="hover:text-white transition-colors">
                お問い合わせ
              </Link>
              <Link href="/help" className="hover:text-white transition-colors">
                ヘルプ
              </Link>
            </nav>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-800 text-center text-xs">
            © 2026 amista. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
