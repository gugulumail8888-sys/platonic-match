'use client';

import { useEffect, useState } from 'react';
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { CAMPAIGN_SLOT_LIMIT } from "@/lib/campaign";

export default function LpPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // プレオープン前の案内バナー。lpはメンテナンスリダイレクトの対象外だが
  // 登録ボタン(/signup)自体はメンテナンス対象のため、ここで先にオープン予定を
  // 案内する(2026/7/23、ユーザー依頼「lpにメンテナンス中等のメッセージがない」への対応)
  const [prelaunchActive, setPrelaunchActive] = useState(false);
  const [prelaunchEndLabel, setPrelaunchEndLabel] = useState('');
  useEffect(() => {
    fetch('/api/prelaunch-status')
      .then((res) => res.json())
      .then((data) => {
        setPrelaunchActive(!!data.active);
        if (data.endLabel) setPrelaunchEndLabel(data.endLabel);
      })
      .catch(() => setPrelaunchActive(false));
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // パーティクルアニメーション
    (function() {
      const canvas = document.getElementById("particleCanvas") as HTMLCanvasElement;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const TEAL = "13,148,136", WHITE = "255,255,255";
      let W: number, H: number, particles: Particle[] = [];
      const mouse = { x: null as number|null, y: null as number|null };
      const COUNT = 90, CONNECT_DIST = 140, MOUSE_DIST = 180;
      function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
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
      function init() { resize(); particles = Array.from({length:COUNT},()=>new Particle()); }
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
      function animate() { ctx.clearRect(0,0,W,H); drawConn(); particles.forEach(p=>{p.update();p.draw();}); requestAnimationFrame(animate); }
      window.addEventListener("resize", resize);
      const hero = canvas.closest("section");
      if (hero) {
        hero.addEventListener("mousemove",e=>{const r=canvas.getBoundingClientRect();mouse.x=(e as MouseEvent).clientX-r.left;mouse.y=(e as MouseEvent).clientY-r.top;});
        hero.addEventListener("mouseleave",()=>{mouse.x=null;mouse.y=null;});
      }
      init(); animate();
    })();

    // FAQアコーディオン
    const toggleFaq = (btn: HTMLElement) => {
      const item = btn.closest(".faq-item") as HTMLElement;
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(i=>i.classList.remove("open"));
      if (!isOpen) item.classList.add("open");
    };
    document.querySelectorAll(".faq-q").forEach(btn => {
      btn.addEventListener("click", () => toggleFaq(btn as HTMLElement));
    });

    // スクロールアニメーション
    const reveals = document.querySelectorAll(".reveal");
    reveals.forEach(el=>{
      new IntersectionObserver((entries)=>{
        entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("visible"); } });
      },{threshold:0}).observe(el);
    });

    // ナビスクロール
    const nav = document.getElementById("mainNav");
    const handleScroll = () => nav?.classList.toggle("scrolled", window.scrollY>60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&family=DM+Serif+Display:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --teal:#0d9488;--teal-light:#14b8a6;--teal-dim:#0d948820;--teal-mid:#0d948840;--dark:#1a2540;--dark-2:#1f2d4e;--light:#f7f8fa;--light-2:#ffffff;--light-border:#d8dde6;--dark-text:#1a2540;--muted:#4a5670;--white:#ffffff; }
        html { scroll-behavior: smooth; }
        body { background: var(--dark); color: var(--white); font-family: "Noto Sans JP", sans-serif; font-weight: 300; line-height: 1.7; overflow-x: hidden; }
        nav { position: fixed; top: var(--banner-offset); left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 12px 48px; background: linear-gradient(to bottom, #1a254099 0%, transparent 100%); backdrop-filter: blur(2px); transition: background .3s; }
        nav.scrolled { background: rgba(26,37,64,.97); }
        .logo { font-family: inherit; font-size: 1.25rem; font-weight: 700; letter-spacing: normal; color: var(--white); display: flex; align-items: center; gap: 0; }
        .logo span { color: var(--teal-light); letter-spacing: normal; }
        nav ul { list-style: none; display: flex; gap: 32px; }
        nav ul a { color: rgba(255,255,255,.6); font-size: .82rem; letter-spacing: .08em; text-decoration: none; transition: color .2s; }
        nav ul a:hover { color: var(--teal-light); }
        .nav-cta { background: transparent; border: 1px solid var(--teal); color: var(--teal-light) !important; padding: 8px 22px; border-radius: 2px; transition: background .2s, color .2s !important; }
        .nav-cta:hover { background: var(--teal) !important; color: #fff !important; }
        .nav-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 8px; z-index: 101; }
        .nav-hamburger span { display: block; width: 22px; height: 2px; background: #fff; margin: 5px 0; }
        .mobile-menu { position: fixed; inset: 0; z-index: 150; background: rgba(26,37,64,.98); backdrop-filter: blur(4px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; }
        .mobile-menu a { color: #fff; font-size: 1.1rem; text-decoration: none; letter-spacing: .04em; }
        .mobile-menu a.nav-cta { border: 1px solid var(--teal); padding: 10px 32px; border-radius: 3px; color: var(--teal-light) !important; }
        .mobile-menu-close { position: absolute; top: 24px; right: 24px; background: none; border: none; color: #fff; font-size: 1.8rem; line-height: 1; cursor: pointer; }
        #hero { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; background: radial-gradient(ellipse 80% 60% at 50% 30%, #0d948820 0%, transparent 70%), linear-gradient(160deg, #2a3f6a 0%, #1e3058 40%, #182848 100%); }
        .orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .18; pointer-events: none; animation: drift 18s ease-in-out infinite alternate; }
        .orb-1 { width: 600px; height: 600px; background: var(--teal); top: -100px; left: -200px; }
        .orb-2 { width: 400px; height: 400px; background: #1e40af; top: 40%; right: -100px; animation-delay: -6s; }
        .orb-3 { width: 300px; height: 300px; background: var(--teal-light); bottom: 0; left: 30%; animation-delay: -12s; }
        @keyframes drift { from { transform: translate(0,0) scale(1); } to { transform: translate(40px,30px) scale(1.08); } }
        .hero-content { position: relative; z-index: 2; text-align: center; max-width: 820px; padding: 0 24px; }
        .hero-eyebrow { display: inline-block; margin-bottom: 28px; font-size: .72rem; letter-spacing: .22em; text-transform: uppercase; color: var(--teal-light); border: 1px solid var(--teal-mid); padding: 7px 20px; border-radius: 40px; background: var(--teal-dim); }
        .hero-title { font-size: clamp(2.6rem, 6vw, 4.4rem); line-height: 1.2; font-weight: 900; color: var(--white); margin-bottom: 12px; }
        .hero-title em { font-style: normal; color: var(--teal-light); }
        .hero-tagline { font-size: clamp(1.05rem, 2.4vw, 1.25rem); color: rgba(255,255,255,.65); font-weight: 300; letter-spacing: .04em; margin-bottom: 48px; }
        .hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .btn-primary { background: var(--teal); color: #fff; padding: 16px 40px; border-radius: 3px; border: none; cursor: pointer; font-size: .9rem; letter-spacing: .06em; font-family: inherit; font-weight: 400; transition: background .2s, transform .15s; text-decoration: none; display: inline-block; }
        .btn-primary:hover { background: var(--teal-light); transform: translateY(-1px); }
        .btn-ghost { background: transparent; color: var(--white); padding: 16px 40px; border-radius: 3px; border: 1px solid rgba(255,255,255,.25); cursor: pointer; font-size: .9rem; letter-spacing: .06em; font-family: inherit; font-weight: 300; transition: border-color .2s, color .2s; text-decoration: none; display: inline-block; }
        .btn-ghost:hover { border-color: var(--teal); color: var(--teal-light); }
        .hero-scroll { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; color: rgba(255,255,255,.4); font-size: .72rem; letter-spacing: .14em; text-transform: uppercase; z-index: 4; }
        .scroll-line { width: 1px; height: 48px; background: linear-gradient(to bottom, var(--teal), transparent); animation: scrollPulse 2.2s ease-in-out infinite; }
        @keyframes scrollPulse { 0%,100%{opacity:.4} 50%{opacity:1} }
        section { padding: 100px 48px; }
        .container { max-width: 1080px; margin: 0 auto; }
        .section-eyebrow { font-size: .7rem; letter-spacing: .22em; text-transform: uppercase; margin-bottom: 16px; }
        .section-title { font-size: clamp(1.8rem, 3.5vw, 2.8rem); font-weight: 700; line-height: 1.25; margin-bottom: 20px; }
        .section-desc { font-size: .95rem; max-width: 560px; line-height: 1.85; }
        #concept { background: #c8dcee; }
        #concept .section-eyebrow { color: var(--teal); }
        #concept .section-title { color: var(--dark-text); }
        #concept .section-title em { color: var(--teal); }
        .concept-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; margin-top: 64px; }
        .concept-text p { color: var(--muted); line-height: 1.95; font-size: .93rem; margin-bottom: 20px; }
        .concept-text strong { color: var(--dark-text); font-weight: 600; }
        .concept-visual { position: relative; height: 380px; border: 1px solid var(--light-border); border-radius: 4px; background: #f0f9f8; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .connection-ring { position: absolute; border-radius: 50%; border: 1px solid var(--teal-mid); animation: ringPulse 4s ease-in-out infinite; }
        .ring-1 { width: 120px; height: 120px; } .ring-2 { width: 220px; height: 220px; animation-delay: .8s; } .ring-3 { width: 320px; height: 320px; animation-delay: 1.6s; }
        @keyframes ringPulse { 0%,100%{opacity:.2;transform:scale(1)} 50%{opacity:.6;transform:scale(1.03)} }
        .concept-label { position: absolute; display: flex; align-items: center; gap: 8px; font-size: .78rem; color: var(--teal); letter-spacing: .08em; }
        .concept-label::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--teal); flex-shrink: 0; }
        .label-top { top: 24%; left: 50%; transform: translateX(-50%); } .label-left { top: 58%; left: 8%; } .label-right { top: 58%; right: 8%; }
        #compare { background: var(--dark); }
        #compare .section-eyebrow { color: var(--teal-light); }
        #compare .section-title { color: var(--white); }
        #compare .section-title em { color: var(--teal-light); font-style: normal; }
        .compare-header { text-align: center; }
        .compare-header .section-desc { margin: 0 auto; color: rgba(255,255,255,.55); }
        .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 820px; margin: 40px auto 0; }
        .compare-card { border-radius: 12px; padding: 32px 28px; }
        .compare-card.no { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); }
        .compare-card.yes { background: rgba(13,148,136,.12); border: 1px solid rgba(13,148,136,.4); }
        .compare-card h3 { font-size: .95rem; font-weight: 700; margin-bottom: 16px; }
        .compare-card.no h3 { color: rgba(255,255,255,.6); }
        .compare-card.yes h3 { color: var(--teal-light); }
        .compare-card ul { list-style: none; }
        .compare-card li { font-size: .85rem; padding: 8px 0; line-height: 1.6; }
        .compare-card.no li { color: rgba(255,255,255,.55); }
        .compare-card.yes li { color: rgba(255,255,255,.9); }
        #safety { background: #dfe9f4; }
        #safety .section-eyebrow { color: var(--teal); }
        #safety .section-title { color: var(--dark-text); }
        #safety .section-title em { color: var(--teal); }
        #how { background: #d4e4f2; }
        #how .section-eyebrow { color: var(--teal); }
        #how .section-title { color: var(--dark-text); }
        .steps-header { text-align: center; margin-bottom: 72px; }
        .steps-header .section-desc { margin: 0 auto; color: var(--muted); }
        .steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; position: relative; }
        .step { background: #ffffff; padding: 36px 28px 36px 32px; border-left: 3px solid var(--teal); transition: border-left-color .25s, box-shadow .25s, transform .2s; box-shadow: 0 2px 16px rgba(26,37,64,.1); }
        .step:hover { border-left-color: var(--teal-light); box-shadow: 0 6px 28px rgba(13,148,136,.15); transform: translateY(-3px); }
        .step-num { width: 44px; height: 44px; border-radius: 50%; background: var(--teal); display: flex; align-items: center; justify-content: center; font-family: "DM Serif Display", serif; font-size: 1.05rem; color: #fff; margin-bottom: 20px; }
        .step-title { font-size: .92rem; font-weight: 600; color: var(--dark-text); margin-bottom: 12px; }
        .step-desc { font-size: .82rem; color: var(--muted); line-height: 1.8; }
        .step-badge { display: inline-block; margin-top: 16px; font-size: .68rem; letter-spacing: .1em; color: var(--teal); border: 1px solid var(--teal-mid); padding: 4px 12px; border-radius: 2px; }
        #preview { background: var(--dark); }
        #preview .section-eyebrow { color: var(--teal-light); }
        #preview .section-title { color: var(--white); }
        #preview .section-title em { color: var(--teal-light); font-style: normal; }
        .preview-header { text-align: center; margin-bottom: 56px; }
        .preview-header .section-desc { margin: 0 auto; color: rgba(255,255,255,.55); }
        .browser-mock { max-width: 760px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,.35); border: 1px solid rgba(255,255,255,.08); }
        .browser-bar { background: #e8ecf1; padding: 10px 16px; display: flex; gap: 6px; }
        .browser-dot { width: 10px; height: 10px; border-radius: 50%; }
        .browser-dot.red { background: #ff5f57; } .browser-dot.yellow { background: #ffbd2e; } .browser-dot.green { background: #28c840; }
        .browser-body { background: #f7f8fa; padding: 28px; }
        .member-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .member-card { background: #fff; border-radius: 6px; padding: 18px; display: flex; align-items: center; gap: 14px; box-shadow: 0 2px 10px rgba(26,37,64,.08); }
        .member-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; font-size: .9rem; flex-shrink: 0; }
        .member-info-name { font-size: .85rem; font-weight: 600; color: var(--dark-text); }
        .member-info-meta { font-size: .72rem; color: var(--muted); margin-top: 2px; }
        .member-badge { margin-top: 6px; display: inline-block; font-size: .62rem; color: var(--teal); background: #e6f7f5; padding: 2px 8px; border-radius: 10px; }
        .preview-caption { text-align: center; margin-top: 20px; font-size: .72rem; color: rgba(255,255,255,.4); }
        #pricing { background: #c8dcee; }
        #pricing .section-eyebrow { color: var(--teal); }
        #pricing .section-title { color: var(--dark-text); }
        .pricing-header { text-align: center; margin-bottom: 64px; }
        .pricing-header .section-desc { margin: 0 auto; color: var(--muted); }
        .pricing-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; max-width: 900px; margin: 0 auto; }
        .price-card { background: var(--dark-2); border: 1px solid rgba(255,255,255,.1); border-radius: 4px; padding: 40px 32px; transition: border-color .25s, transform .2s, box-shadow .2s; position: relative; }
        .price-card:hover { border-color: var(--teal); transform: translateY(-4px); box-shadow: 0 8px 32px rgba(13,148,136,.15); }
        .price-card.featured { border-color: var(--teal); box-shadow: 0 4px 24px rgba(13,148,136,.2); }
        .price-card.featured::before { content: "おすすめ"; position: absolute; top: -1px; left: 50%; transform: translateX(-50%); background: var(--teal); color: #fff; font-size: .65rem; letter-spacing: .12em; padding: 4px 16px; border-radius: 0 0 4px 4px; white-space: nowrap; }
        .price-label { font-size: .72rem; letter-spacing: .16em; text-transform: uppercase; color: var(--teal-light); margin-bottom: 12px; }
        .price-name { font-size: 1.5rem; font-weight: 700; color: var(--white); margin-bottom: 24px; }
        .price-amount { font-size: 2.4rem; font-weight: 300; color: var(--white); letter-spacing: -.02em; line-height: 1; }
        .price-amount span { font-size: .85rem; color: rgba(255,255,255,.6); margin-left: 4px; }
        .price-note { font-size: .75rem; color: rgba(255,255,255,.55); margin-top: 6px; margin-bottom: 28px; }
        .price-tax-note { font-size: .7rem; color: rgba(255,255,255,.4); margin-top: 2px; }
        .price-features { list-style: none; }
        .price-features li { font-size: .82rem; color: rgba(255,255,255,.7); padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.08); display: flex; align-items: flex-start; gap: 10px; }
        .price-features li::before { content: "—"; color: var(--teal-light); flex-shrink: 0; }
        #values { background: #d4e4f2; }
        #values .section-eyebrow { color: var(--teal); }
        #values .section-title { color: var(--dark-text); }
        #values .section-title em { color: var(--teal); }
        .values-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 64px; }
        .value-card { padding: 36px 28px 36px 32px; border-left: 3px solid var(--teal); background: #ffffff; transition: border-left-color .25s, box-shadow .25s, transform .2s; box-shadow: 0 2px 16px rgba(26,37,64,.1); }
        .value-card:hover { border-left-color: var(--teal-light); box-shadow: 0 6px 28px rgba(13,148,136,.15); transform: translateY(-3px); }
        .value-icon { width: 48px; height: 48px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; background: #e6f7f5; border-radius: 50%; }
        .value-icon svg { width: 22px; height: 22px; stroke: var(--teal); fill: none; stroke-width: 1.5; }
        .value-title { font-size: 1rem; font-weight: 600; color: var(--dark-text); margin-bottom: 12px; }
        .value-desc { font-size: .83rem; color: var(--muted); line-height: 1.85; }
        #founder { background: var(--dark); }
        #founder .section-title em { color: var(--teal-light); font-style: normal; }
        .founder-mark { font-family: "DM Serif Display", serif; font-size: 3rem; color: var(--teal); line-height: 1; margin-bottom: 8px; }
        .founder-box { max-width: 720px; margin: 0 auto; text-align: center; }
        .founder-text { font-size: .95rem; color: rgba(255,255,255,.75); line-height: 2.1; }
        .founder-signature { margin-top: 32px; font-size: .78rem; letter-spacing: .1em; color: var(--teal-light); }
        #faq { background: #c8dcee; }
        #faq .section-eyebrow { color: var(--teal); }
        #faq .section-title { color: var(--dark-text); }
        .faq-header { text-align: center; margin-bottom: 56px; }
        .faq-list { max-width: 720px; margin: 0 auto; }
        .faq-item { border-bottom: 1px solid #a8c4d8; overflow: hidden; }
        .faq-q { width: 100%; background: none; border: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center; padding: 22px 0; color: var(--dark-text); font-family: inherit; font-size: .9rem; font-weight: 500; letter-spacing: .02em; text-align: left; transition: color .2s; }
        .faq-q:hover { color: var(--teal); }
        .faq-icon { width: 24px; height: 24px; border: 1px solid var(--light-border); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform .3s, border-color .2s; color: var(--teal); font-size: .9rem; }
        .faq-item.open .faq-icon { transform: rotate(45deg); border-color: var(--teal); }
        .faq-a { max-height: 0; overflow: hidden; transition: max-height .35s ease; }
        .faq-a-inner { padding-bottom: 22px; font-size: .85rem; color: var(--muted); line-height: 1.9; }
        .faq-item.open .faq-a { max-height: 200px; }
        #cta { background: var(--dark); text-align: center; padding: 120px 48px; }
        #cta .section-eyebrow { color: var(--teal-light); display: inline-block; margin-bottom: 16px; }
        #cta .section-title { color: #fff; margin: 0 auto 16px; max-width: 600px; }
        #cta .section-title em { color: var(--teal-light); font-style: normal; }
        #cta .section-desc { color: rgba(255,255,255,.65); margin: 0 auto 48px; text-align: center; }
        #cta .btn-primary { font-weight: 600; font-size: 1rem; padding: 18px 52px; }
        .cta-note { font-size: .78rem; color: rgba(255,255,255,.4); margin-top: 20px; }
        .cta-note a { color: rgba(255,255,255,.65); text-decoration: none; }
        footer { background: var(--dark); border-top: 1px solid rgba(255,255,255,.06); padding: 56px 48px 32px; }
        .footer-inner { max-width: 1080px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-start; gap: 48px; }
        .footer-brand .logo { font-size: 1.4rem; }
        .footer-brand p { margin-top: 10px; font-size: .78rem; color: rgba(255,255,255,.45); max-width: 240px; line-height: 1.8; }
        .footer-links h4 { font-size: .72rem; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.4); margin-bottom: 16px; }
        .footer-links ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .footer-links a { font-size: .82rem; color: rgba(255,255,255,.55); text-decoration: none; transition: color .2s; }
        .footer-links a:hover { color: var(--teal-light); }
        .footer-bottom { max-width: 1080px; margin: 40px auto 0; padding-top: 24px; border-top: 1px solid rgba(255,255,255,.06); display: flex; justify-content: space-between; align-items: center; font-size: .75rem; color: rgba(255,255,255,.35); }
        .reveal { opacity: 1 !important; transform: none !important; transition: opacity .65s ease, transform .65s ease; }
        .reveal.visible { opacity: 1 !important; transform: translateY(0) !important; }
        @media (max-width: 900px) {
          nav { padding: 18px 24px; } nav ul { display: none; } .nav-hamburger { display: block; }
          section { padding: 72px 24px; }
          .concept-grid { grid-template-columns: 1fr; gap: 40px; }
          .steps { grid-template-columns: 1fr 1fr; }
          .pricing-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
          .values-grid { grid-template-columns: 1fr 1fr; }
          .footer-inner { flex-direction: column; }
          .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
        }
        @media (max-width: 600px) {
          .steps { grid-template-columns: 1fr; } .values-grid { grid-template-columns: 1fr; } .member-grid { grid-template-columns: 1fr; } .compare-grid { grid-template-columns: 1fr; }
          .hero-actions { flex-direction: column; align-items: center; }
          #cta { padding: 80px 24px; } footer { padding: 40px 24px 24px; }
        }
        .prerelease-notice { position: relative; z-index: 3; text-align: center; padding: 12px 24px; font-size: .78rem; color: rgba(255,255,255,.85); letter-spacing: .02em; background: rgba(13,148,136,.16); border-bottom: 1px solid rgba(13,148,136,.35); }
        .top-notice-wrap { position: relative; z-index: 3; }
        .lp-campaign-wrap { padding: 16px 24px 0; }
        .lp-campaign-banner { max-width: 900px; margin: 0 auto; border-radius: 16px; padding: 20px 28px; background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); color: #fff; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .lp-campaign-emoji { font-size: 2.2rem; flex-shrink: 0; }
        .lp-campaign-badge { display: inline-block; background: #dc2626; color: #fff; font-size: .68rem; font-weight: 700; padding: 3px 10px; border-radius: 999px; margin-left: 10px; vertical-align: middle; }
        .lp-campaign-title { font-size: 1.05rem; font-weight: 700; }
        .lp-campaign-text { font-size: .85rem; line-height: 1.7; color: rgba(255,255,255,.92); margin-top: 6px; }
        .lp-campaign-cta { flex-shrink: 0; background: #fff; color: #ea580c; font-weight: 600; font-size: .82rem; padding: 10px 20px; border-radius: 10px; text-decoration: none; white-space: nowrap; }
        .price-campaign-badge { display: inline-block; margin-bottom: 12px; font-size: .68rem; font-weight: 700; color: #fff; background: linear-gradient(135deg, #fbbf24 0%, #f97316 100%); padding: 4px 12px; border-radius: 999px; }
        .lp-prelaunch-wrap { padding: 16px 24px 0; }
        .lp-prelaunch-banner { max-width: 900px; margin: 0 auto; border-radius: 16px; padding: 18px 28px; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #fff; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .lp-prelaunch-emoji { font-size: 2rem; flex-shrink: 0; }
        .lp-prelaunch-text { font-size: .88rem; line-height: 1.7; color: rgba(255,255,255,.95); }
        .lp-prelaunch-text strong { font-size: .95rem; }
      `}</style>

      <nav id="mainNav">
        <div className="logo" style={{display:'flex',alignItems:'center',gap:'8px'}}><div style={{width:'32px',height:'32px',background:'#0d9488',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div><span>ami<span style={{color:'var(--teal-light)'}}>sta</span></span></div>
        <ul>
          <li><a href="#concept">サービスについて</a></li>
          <li><a href="#how">ご利用の流れ</a></li>
          <li><a href="#pricing">料金</a></li>
          <li><a href="#faq">よくある質問</a></li>
          <li><a href="/signup" className="nav-cta">無料登録</a></li>
        </ul>
        <button className="nav-hamburger" onClick={() => setMobileMenuOpen(true)} aria-label="メニューを開く">
          <span /><span /><span />
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)} aria-label="メニューを閉じる">×</button>
          <a href="#concept" onClick={() => setMobileMenuOpen(false)}>サービスについて</a>
          <a href="#how" onClick={() => setMobileMenuOpen(false)}>ご利用の流れ</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>料金</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)}>よくある質問</a>
          <a href="/signup" className="nav-cta" onClick={() => setMobileMenuOpen(false)}>無料登録</a>
        </div>
      )}

      <div className="top-notice-wrap" style={{ paddingTop: 'calc(var(--banner-offset) + 4.5rem)' }}>
        {prelaunchActive && (
          <div className="lp-prelaunch-wrap">
            <div className="lp-prelaunch-banner">
              <div className="lp-prelaunch-emoji">🚀</div>
              <p className="lp-prelaunch-text">
                ただいまプレオープンに向けて準備中です。<strong>会員登録・ご利用開始は{prelaunchEndLabel || '近日'}を予定</strong>しております。今しばらくお待ちください。
              </p>
            </div>
          </div>
        )}
        {showCampaignBanner && (
          <div className="lp-campaign-wrap">
            <div className="lp-campaign-banner">
              <div className="lp-campaign-emoji">🎉</div>
              <div style={{flex:1}}>
                <span className="lp-campaign-title">オープン記念！初期限定キャンペーン</span>
                <span className="lp-campaign-badge">期間限定</span>
                <p className="lp-campaign-text">{campaignPeriodLabel}にAIおすすめ機能をお申し込みの方は、申込日から3ヶ月間無料！（先着{CAMPAIGN_SLOT_LIMIT}名まで）</p>
              </div>
              <a href="#pricing" className="lp-campaign-cta">料金を見る</a>
            </div>
          </div>
        )}
      </div>

      <section id="hero">
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
        <canvas id="particleCanvas" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:1,opacity:0.55}} />
        <div className="hero-content">
          <div className="hero-eyebrow">友情婚活マッチングサービス</div>
          <h1 className="hero-title">信頼できる<em>友人</em>から、<br />ライフパートナーへ。</h1>
          <p className="hero-tagline">恋愛感情より、価値観と人柄。<br />プレッシャーのない、あたらしいかたちの婚活。</p>
          <div className="hero-actions">
            <a href="/signup" className="btn-primary">無料で会員登録する</a>
            <a href="#concept" className="btn-ghost">サービスを詳しく見る</a>
          </div>
        </div>
        <div className="hero-scroll"><div className="scroll-line" /><span>Scroll</span></div>
      </section>

      <section id="concept">
        <div className="container">
          <div className="concept-grid">
            <div className="concept-text reveal">
              <div className="section-eyebrow">What is amista</div>
              <h2 className="section-title">「好き」より、<br /><em>「信頼できる」</em>を大切に</h2>
              <p>amistaは、恋愛感情を前提とせず、<strong>人柄・価値観・生き方の相性</strong>を軸にしたマッチングサービスです。</p>
              <p>ドキドキするかどうかではなく、「この人と人生を歩めるか」という視点で、ゆっくり相手を選ぶことができます。</p>
              <p>Google Meetを使ったオンラインお見合いで、<strong>全国どこからでも</strong>、自分のペースで活動できます。事務局が丁寧にサポートするので、婚活が初めての方も安心です。</p>
            </div>
            <div className="concept-visual reveal">
              <div className="connection-ring ring-1" /><div className="connection-ring ring-2" /><div className="connection-ring ring-3" />
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="30" stroke="#0d9488" strokeWidth="1"/><circle cx="40" cy="40" r="16" fill="#0d948830"/><path d="M40 28 C34 34 28 40 34 48 C38 54 46 54 50 48 C56 40 50 30 40 28Z" fill="#0d9488" opacity=".7"/></svg>
              <div className="concept-label label-top">価値観の共鳴</div>
              <div className="concept-label label-left">オンライン面談</div>
              <div className="concept-label label-right">事務局サポート</div>
            </div>
          </div>
        </div>
      </section>

      <section id="compare">
        <div className="container">
          <div className="compare-header reveal">
            <div className="section-eyebrow">Difference</div>
            <h2 className="section-title">一般的な婚活との<em>違い</em></h2>
            <p className="section-desc">恋愛から始まる婚活とは、少し違います</p>
          </div>
          <div className="compare-grid reveal">
            <div className="compare-card no">
              <h3>❌ 一般的な婚活</h3>
              <ul>
                <li>・ 第一印象や外見が重視される</li>
                <li>・ 恋愛感情が前提</li>
                <li>・ 「好き」という気持ちから始まる</li>
                <li>・ 早期に交際・プレッシャー</li>
              </ul>
            </div>
            <div className="compare-card yes">
              <h3>✅ amistaの友情婚活</h3>
              <ul>
                <li>・ 価値観・人柄・考え方を重視</li>
                <li>・ 友人として信頼関係を築く</li>
                <li>・ 「この人と人生を歩みたい」から始まる</li>
                <li>・ プレッシャーなく自分らしく</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="safety">
        <div className="container">
          <div className="reveal">
            <div className="section-eyebrow">Safety</div>
            <h2 className="section-title">安心・安全への<em>取り組み</em></h2>
          </div>
          <div className="values-grid">
            <div className="value-card reveal">
              <div className="value-icon"><svg viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3z"/><path d="m9 12 2 2 4-4"/></svg></div>
              <div className="value-title">全会員に本人確認審査</div>
              <p className="value-desc">運転免許証・マイナンバーカード・パスポートのいずれかをご提出いただき、事務局が本人確認を実施(通常1〜3営業日)。確認が完了した会員のみお見合いに進めます。</p>
            </div>
            <div className="value-card reveal">
              <div className="value-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/><line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/></svg></div>
              <div className="value-title">困ったときは事務局が対応</div>
              <p className="value-desc">マッチングはシステムに沿ってスムーズに進みます。万が一トラブルがあった場合も、通報機能から事務局にご連絡いただければ内容を確認し対応します。</p>
            </div>
            <div className="value-card reveal">
              <div className="value-icon"><svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
              <div className="value-title">個人情報の厳重な管理</div>
              <p className="value-desc">プライバシーポリシーに基づき、会員情報を厳重に管理しています。</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how">
        <div className="container">
          <div className="steps-header reveal">
            <div className="section-eyebrow">How it works</div>
            <h2 className="section-title">ご利用の流れ</h2>
            <p className="section-desc">会員登録から成婚まで、事務局がしっかりサポート。4つのステップで、あなたのペースで進められます。</p>
          </div>
          <div className="steps">
            <div className="step reveal"><div className="step-num">1</div><div className="step-title">無料会員登録</div><p className="step-desc">プロフィールを入力して会員登録。費用は完全無料です。</p><span className="step-badge">無料</span></div>
            <div className="step reveal"><div className="step-num">2</div><div className="step-title">プロフィール閲覧・申請</div><p className="step-desc">会員のプロフィールを閲覧し、気になる方にお見合いを申し込みます。</p></div>
            <div className="step reveal"><div className="step-num">3</div><div className="step-title">Google Meetお見合い</div><p className="step-desc">Google Meetで顔を見ながらお話し。事務局が事前に双方を確認・調整します。</p><span className="step-badge">3,500円（税込）/件</span></div>
            <div className="step reveal"><div className="step-num">4</div><div className="step-title">交際・成婚へ</div><p className="step-desc">相性が合えば連絡先交換。お互いのペースで関係を深めていきます。</p></div>
          </div>
        </div>
      </section>

      <section id="preview">
        <div className="container">
          <div className="preview-header reveal">
            <div className="section-eyebrow">Preview</div>
            <h2 className="section-title">実際の画面は<em>こんな感じ</em></h2>
            <p className="section-desc">シンプルで見やすい会員一覧画面。気になる方のプロフィールをじっくり見てから、お見合いを申し込めます。</p>
          </div>
          <div className="browser-mock reveal">
            <div className="browser-bar"><span className="browser-dot red" /><span className="browser-dot yellow" /><span className="browser-dot green" /></div>
            <div className="browser-body">
              <div className="member-grid">
                <div className="member-card">
                  <div className="member-avatar" style={{background:'#0d9488'}}>さ</div>
                  <div><div className="member-info-name">さくら</div><div className="member-info-meta">32歳・女性・東京都</div><span className="member-badge">本人確認済み</span></div>
                </div>
                <div className="member-card">
                  <div className="member-avatar" style={{background:'#1e3a5f'}}>た</div>
                  <div><div className="member-info-name">たくみ</div><div className="member-info-meta">38歳・男性・大阪府</div><span className="member-badge">本人確認済み</span></div>
                </div>
                <div className="member-card">
                  <div className="member-avatar" style={{background:'#14b8a6'}}>み</div>
                  <div><div className="member-info-name">みゆき</div><div className="member-info-meta">29歳・女性・神奈川県</div><span className="member-badge">本人確認済み</span></div>
                </div>
                <div className="member-card">
                  <div className="member-avatar" style={{background:'#2a3f6a'}}>け</div>
                  <div><div className="member-info-name">けんじ</div><div className="member-info-meta">45歳・男性・福岡県</div><span className="member-badge">本人確認済み</span></div>
                </div>
              </div>
            </div>
          </div>
          <p className="preview-caption">※画面はイメージです</p>
        </div>
      </section>

      <section id="pricing">
        <div className="container">
          <div className="pricing-header reveal">
            <div className="section-eyebrow">Pricing</div>
            <h2 className="section-title">シンプルな料金体系</h2>
            <p className="section-desc">高額な月会費不要。使った分だけ払う、わかりやすい料金設計です。</p>
          </div>
          <div className="pricing-grid">
            <div className="price-card reveal">
              <div className="price-label">Basic</div>
              <div className="price-name">会員登録</div>
              <div className="price-amount">¥0</div>
              <div className="price-note">完全無料</div>
              <ul className="price-features">
                <li>プロフィール作成・公開</li>
                <li>会員検索・閲覧</li>
                <li>お見合い申請の受付（1件 ¥3,500 税込）</li>
              </ul>
            </div>
            <div className="price-card reveal">
              <div className="price-label">Per Match</div>
              <div className="price-name">お見合い料</div>
              <div className="price-amount">¥3,500<span>（税込）/ 件</span></div>
              <div className="price-note">成立時のみ課金</div>
              <ul className="price-features">
                <li>Google Meetお見合い1回分</li>
                <li>事務局による事前確認</li>
                <li>日程調整サポート</li>
                <li>フィードバック受付</li>
              </ul>
            </div>
            <div className="price-card featured reveal">
              <div className="price-label">Option</div>
              {showCampaignBanner && <div className="price-campaign-badge">🎉 今なら申込日から3ヶ月無料（先着{CAMPAIGN_SLOT_LIMIT}名まで）</div>}
              <div className="price-name">AIおすすめプラン</div>
              <div className="price-amount">¥1,078<span>〜 / 月（税込）</span></div>
              <div className="price-tax-note">税別 ¥980〜 / 月</div>
              <div className="price-note">仕事や育児で忙しいあなたへ</div>
              <ul className="price-features">
                <li>お見合い申請（1件 ¥3,000 税込）</li>
                <li>AIがあなたに合う相手を自動で選定（1日3回まで）</li>
                <li>毎週おすすめメンバーをご提案</li>
                <li>AIがあなたの代わりに相手を探す</li>
                <li>優先サポート</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="values">
        <div className="container">
          <div className="reveal">
            <div className="section-eyebrow">Why amista</div>
            <h2 className="section-title">amistaが選ばれる<em>3つの理由</em></h2>
          </div>
          <div className="values-grid">
            <div className="value-card reveal">
              <div className="value-icon"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
              <div className="value-title">プレッシャーのない婚活</div>
              <p className="value-desc">「恋愛感情がないといけない」という呪縛から解放。友人として知り合い、信頼関係を育てるところから始められます。</p>
            </div>
            <div className="value-card reveal">
              <div className="value-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></div>
              <div className="value-title">全国どこからでもOK</div>
              <p className="value-desc">Google Meetを使ったオンラインお見合いで、北海道から沖縄まで活動エリアを問いません。移動時間ゼロで気軽に参加できます。</p>
            </div>
            <div className="value-card reveal">
              <div className="value-icon"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
              <div className="value-title">事務局が丁寧にサポート</div>
              <p className="value-desc">マッチングから面談調整・成婚まで、事務局スタッフが伴走。婚活が初めての方も、安心して活動を続けられます。</p>
            </div>
          </div>
        </div>
      </section>

      <section id="founder">
        <div className="container">
          <div className="reveal">
            <div className="section-eyebrow" style={{color:'var(--teal-light)'}}>Our Story</div>
            <h2 className="section-title" style={{color:'var(--white)', textAlign:'center'}}>運営者の<em>想い</em></h2>
          </div>
          <div className="founder-box reveal">
            <div className="founder-mark">"</div>
            <p className="founder-text">「恋愛感情がなければ結婚できない」――そんな空気に、息苦しさを感じたことはありませんか。amistaは、そんな声から生まれました。ドキドキよりも、信頼。一時の高揚感よりも、長く一緒にいられる安心感。そうした価値観を大切にする方々に、もっと自然体で出会える場所を届けたいという想いで、このサービスを立ち上げました。まだ始まったばかりのサービスですが、一人ひとりと丁寧に向き合いながら、育てていきたいと思っています。</p>
            <div className="founder-signature">amista 運営チーム</div>
          </div>
        </div>
      </section>

      <section id="faq">
        <div className="container">
          <div className="faq-header reveal">
            <div className="section-eyebrow">FAQ</div>
            <h2 className="section-title">よくあるご質問</h2>
          </div>
          <div className="faq-list">
            {[
              {q:'「友情婚活」とはどんな婚活ですか？',a:'恋愛感情（ドキドキ・トキメキ）ではなく、価値観や人柄・生き方の相性を重視して結婚相手を探す婚活スタイルです。友人として知り合うところから始め、信頼を積み重ねていきます。'},
              {q:'オンラインお見合いはどのように行いますか？',a:'Google Meetを使ったビデオ通話形式です。事前に事務局が双方のプロフィールを確認・調整し、日程調整をサポートします。'},
              {q:'婚活が初めてでも利用できますか？',a:'はい、大丈夫です。amistaはシステムが自動でマッチングをサポートする設計になっています。登録からお見合い申請・日程調整まで、画面の案内に沿って進めるだけでスムーズに活動できます。'},
              {q:'お見合い料はいつ発生しますか？',a:'お見合いが成立（双方が合意）した場合のみ、1件につき3,500円（税込）が発生します。申請しただけでは費用はかかりません。'},
              {q:'居住地に関係なく活動できますか？',a:'はい。オンラインお見合いのため、全国どこからでもご利用いただけます。遠距離での出会いも可能です。'},
            ].map((f,i)=>(
              <div key={i} className="faq-item">
                <button className="faq-q">
                  <span>{f.q}</span>
                  <div className="faq-icon">+</div>
                </button>
                <div className="faq-a"><div className="faq-a-inner">{f.a}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cta">
        <div className="container">
          <div className="section-eyebrow">Join amista</div>
          <h2 className="section-title reveal">まずは、<em>無料</em>で始めてみませんか？</h2>
          <p className="section-desc reveal">高額な月会費なし。自分のペースで、信頼できる人との出会いを。</p>
          <div className="reveal"><a href="/signup" className="btn-primary">無料で会員登録する</a></div>
          <p className="cta-note">登録無料・いつでも退会可能 ／ <a href="/terms">利用規約</a> ・ <a href="/privacy">プライバシーポリシー</a></p>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="logo" style={{display:'flex',alignItems:'center',gap:'8px'}}><div style={{width:'32px',height:'32px',background:'#0d9488',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div><span>ami<span style={{color:'var(--teal-light)'}}>sta</span></span></div>
            <p>友情婚活マッチングサービス。<br />信頼できる友人から、ライフパートナーへ。</p>
          </div>
          <div className="footer-links">
            <h4>サービス</h4>
            <ul>
              <li><a href="#concept">amistaについて</a></li>
              <li><a href="#how">ご利用の流れ</a></li>
              <li><a href="#pricing">料金プラン</a></li>
              <li><a href="#faq">よくある質問</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>サポート</h4>
            <ul>
              <li><a href="/contact">お問い合わせ</a></li>
              <li><a href="/terms">利用規約</a></li>
              <li><a href="/privacy">プライバシーポリシー</a></li>
              <li><a href="/tokusho">特定商取引法に基づく表記</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 amista. All rights reserved.</span>
          <span>友情婚活マッチングサービス</span>
        </div>
      </footer>
      <ScrollToTop />
    </>
  );
}
