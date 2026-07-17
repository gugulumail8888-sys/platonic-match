"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Shield, MessageCircle, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScrollHeader } from "@/components/ui/ScrollHeader";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { getCampaignPeriodLabel, CAMPAIGN_SLOT_LIMIT } from "@/lib/campaign";

export default function HomePage() {
  const [showCampaignBanner, setShowCampaignBanner] = useState(false);

  useEffect(() => {
    fetch("/api/campaign-banner")
      .then((res) => res.json())
      .then((data) => setShowCampaignBanner(!!data.active))
      .catch(() => setShowCampaignBanner(false));
  }, []);

  useEffect(() => {
    const canvas = document.getElementById("heroCanvas") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const TEAL = "13,148,136", WHITE = "255,255,255";
    let W: number, H: number;
    const mouse = { x: null as number|null, y: null as number|null };
    const COUNT = 90, CONNECT_DIST = 140, MOUSE_DIST = 180;
    class Particle {
      x=0; y=0; vx=0; vy=0; r=0; isPerson=false; alpha=0; pulse=0; pulseSpeed=0;
      constructor() { this.reset(true); }
      reset(init: boolean) {
        this.x = Math.random()*W; this.y = init ? Math.random()*H : (Math.random()<.5 ? -8 : H+8);
        this.vx = (Math.random()-.5)*.45; this.vy = (Math.random()-.5)*.45;
        this.r = Math.random()*2+1.2; this.isPerson = Math.random()<.18;
        if (this.isPerson) this.r = Math.random()*2+3.5;
        this.alpha = Math.random()*.5+.3; this.pulse = Math.random()*Math.PI*2; this.pulseSpeed = Math.random()*.02+.008;
      }
      update() {
        this.x += this.vx; this.y += this.vy; this.pulse += this.pulseSpeed;
        if (this.x < -10) this.x = W+10; if (this.x > W+10) this.x = -10;
        if (this.y < -10) this.y = H+10; if (this.y > H+10) this.y = -10;
        if (mouse.x !== null && mouse.y !== null) {
          const dx = this.x-mouse.x, dy = this.y-mouse.y, d = Math.sqrt(dx*dx+dy*dy);
          if (d < MOUSE_DIST) { const f=(MOUSE_DIST-d)/MOUSE_DIST*.6; this.x+=dx/d*f*2.2; this.y+=dy/d*f*2.2; }
        }
      }
      draw() {
        const p = Math.sin(this.pulse)*.3+.7, a = this.alpha*p;
        if (this.isPerson) {
          const g = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.r*3.5);
          g.addColorStop(0,`rgba(${TEAL},${a})`); g.addColorStop(.5,`rgba(${TEAL},${a*.4})`); g.addColorStop(1,`rgba(${TEAL},0)`);
          ctx.beginPath(); ctx.arc(this.x,this.y,this.r*3.5,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
          ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fillStyle=`rgba(${WHITE},${a*.95})`; ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fillStyle=`rgba(${TEAL},${a*.8})`; ctx.fill();
        }
      }
    }
    let particles: Particle[] = [];
    let animId: number;
    function init() { resize(); particles = Array.from({length:COUNT},()=>new Particle()); }
    function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
    function drawConn() {
      for (let i=0;i<particles.length;i++) for (let j=i+1;j<particles.length;j++) {
        const a=particles[i],b=particles[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy);
        if (d<CONNECT_DIST) {
          const al=(1-d/CONNECT_DIST)*.45,pp=a.isPerson&&b.isPerson;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
          ctx.strokeStyle=pp?`rgba(${WHITE},${al*.7})`:`rgba(${TEAL},${al})`; ctx.lineWidth=pp?1.2:.6; ctx.stroke();
        }
      }
    }
    function animate() { ctx.clearRect(0,0,W,H); drawConn(); particles.forEach(p=>{p.update();p.draw();}); animId=requestAnimationFrame(animate); }
    const onMouseMove = (e: MouseEvent) => { const r=canvas.getBoundingClientRect(); mouse.x=e.clientX-r.left; mouse.y=e.clientY-r.top; };
    const onMouseLeave = () => { mouse.x=null; mouse.y=null; };
    window.addEventListener("resize", resize);
    canvas.closest("section")?.addEventListener("mousemove", onMouseMove as EventListener);
    canvas.closest("section")?.addEventListener("mouseleave", onMouseLeave);
    init(); animate();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-teal-950">
      {/* スクロール対応ヘッダー（クライアントコンポーネント） */}
      <ScrollHeader />

      {/* プレリリース告知・キャンペーンバナー(スクロールなしで見えるようヒーローセクションより前に表示。ヘッダー分の余白はこのdivでまとめて確保) */}
      <div style={{ paddingTop: 'calc(var(--banner-offset) + 4.5rem)' }}>
      {showCampaignBanner && (
        <section className="px-4 pb-4">
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
                {getCampaignPeriodLabel()}にAIおすすめ機能をお申し込みの方は、申込日から3ヶ月間無料！（先着{CAMPAIGN_SLOT_LIMIT}名まで）
              </p>
            </div>
            <Link href="/recommend" className="flex-shrink-0">
              <button className="bg-white text-orange-600 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors whitespace-nowrap">
                AIおすすめ機能を見る
              </button>
            </Link>
          </div>
        </section>
      )}
      </div>

      {/* ヒーローセクション */}
      <section
        className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-teal-800 via-teal-700 to-cyan-700 relative overflow-hidden"
      >
        <canvas id="heroCanvas" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:1,opacity:0.55}} />
        <div className="max-w-4xl mx-auto text-center pt-20 pb-10">
          <div className="inline-flex items-center gap-2 bg-primary-950/80 text-primary-400 text-sm font-medium px-4 py-2 rounded-full mb-8 border border-primary-800/60 backdrop-blur-sm">
            <Star className="w-4 h-4 fill-current" />
            友情から始まる、新しい婚活のかたち
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 drop-shadow-lg">
            <span className="text-white">「結婚しなきゃ」</span><span className="text-white/40">から</span>
            <br />
            <span className="text-white">解放される、</span><span className="text-white/40">新しい選択。</span>
          </h1>

          <p className="text-lg md:text-xl text-white font-bold max-w-2xl mx-auto mt-4 mb-4 leading-relaxed" style={{textDecoration: 'underline double', textUnderlineOffset: '4px'}}>
            親や周囲からの結婚プレッシャー、感じていませんか？
          </p>
          <p className="text-base text-white/90 max-w-xl mx-auto mb-8 leading-relaxed font-medium">
            amistaは「恋愛なし・価値観が合う生涯のパートナー」と出会える<br className="hidden sm:block" />
            友情婚活サービスです。
          </p>

          {/* 3つのポイント */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 mb-10">
            {[
              { emoji: '😮‍💨', line1: '「結婚しなきゃ」', line2: 'のプレッシャーから解放' },
              { emoji: '🤝',   line1: '「恋愛感情なしで」', line2: '一緒に生きるパートナーを探す' },
              { emoji: '✨',   line1: '「自分らしい人生の形を」', line2: '自分で選ぶ' },
            ].map(({ emoji, line1, line2 }) => (
              <div
                key={line1}
                className="flex items-center gap-2 bg-white border border-white rounded-full px-5 py-2.5 text-sm text-teal-700 font-medium shadow-lg"
              >
                <span>{emoji}</span>
                <div className="flex flex-col text-center">
                  <span className="font-bold text-teal-800 text-base">{line1}</span>
                  <span className="font-normal text-teal-600 text-xs">{line2}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="min-w-[200px] shadow-lg bg-teal-500 hover:bg-teal-400 text-white font-bold border-2 border-white">
                <Heart className="w-5 h-5 fill-white" />
                無料で始める
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="min-w-[200px] text-white/70 border-white/30 hover:bg-white/10 hover:text-white">
                ログイン
              </Button>
            </Link>
          </div>

          <p className="text-sm text-white/70 mt-6">
            登録無料・本人確認審査あり・Google Meetでお見合い
          </p>
        </div>
      </section>

      {/* 友情婚活とは */}
      <section id="about" className="py-16 px-4 bg-teal-100 scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-teal-900 mb-3">
              友情婚活とは？
            </h2>
            <p className="text-teal-800">恋愛から始まる婚活とは、少し違います</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-800 rounded-2xl p-6 border border-zinc-700">
              <h3 className="font-bold text-zinc-200 text-sm mb-3">❌ 一般的な婚活</h3>
              <ul className="space-y-2 text-sm text-zinc-200">
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
      <section className="py-12 px-4 bg-teal-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { icon: '🤝', label: '事務局が仲介', sub: '安心のサポート体制' },
              { icon: '💻', label: 'Google Meetお見合い', sub: '自宅から気軽に参加' },
              { icon: '🔒', label: '連絡先は事務局経由', sub: '個人情報を守ります' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl mb-2">{stat.icon}</div>
                <div className="text-sm md:text-base font-semibold text-teal-900 mb-1">{stat.label}</div>
                <div className="text-xs text-teal-700">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section id="features" className="py-20 px-4 bg-teal-100 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-teal-900 mb-4">
              amistaの<span className="text-primary-400">3つの特徴</span>
            </h2>
            <p className="text-teal-800">友情を基盤にした婚活を支えるために</p>
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
                <p className="text-zinc-300 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 料金プラン */}
      <section id="pricing" className="py-20 px-4 bg-teal-200 scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-teal-900 mb-3">
              シンプルな<span className="text-primary-400">料金プラン</span>
            </h2>
            <p className="text-teal-800">まずは無料で始めて、必要な時にアップグレード</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-start">

            {/* 無料プラン */}
            <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-8">
              <div className="mb-6">
                <p className="text-sm font-medium text-teal-800 mb-1">無料プラン</p>
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
                {showCampaignBanner && (
                  <div
                    className="inline-block mb-3 text-white text-xs font-bold px-3 py-1 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)' }}
                  >
                    🎉 今なら申込日から3ヶ月無料（先着{CAMPAIGN_SLOT_LIMIT}名まで）
                  </div>
                )}
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

              <Link href="/how-it-works?plan=ai&from=top">
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
          <p className="text-center text-xs text-teal-700 mt-6">
            ※ 無料プランのお見合い申請料：¥3,500（税込）／AIおすすめプランのお見合い申請料：¥3,000（税込）
          </p>
        </div>
      </section>

      {/* 他サービスとの違い */}
      <section id="voice" className="py-20 px-4 bg-teal-100 scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-teal-900 mb-3">
              amistaが<span className="text-primary-400">選ばれる理由</span>
            </h2>
            <p className="text-teal-800">一般的な婚活・マッチングアプリとの違い</p>
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
              <div key={item.title} className="bg-teal-900 rounded-2xl border border-teal-700/60 overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <h3 className="font-bold text-white text-sm">{item.title}</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-red-500 text-xs flex-shrink-0 mt-0.5 font-bold">❌</span>
                    <div>
                      <p className="text-[10px] text-zinc-300 mb-0.5">一般的な婚活</p>
                      <p className="text-sm text-zinc-300">{item.general}</p>
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
      <section className="py-20 px-4" style={{ background: '#14b8a6' }}>
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
      <footer className="text-white py-12 px-4" style={{ background: '#14b8a6' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                <Heart className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="font-bold text-teal-900 tracking-wide">
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
