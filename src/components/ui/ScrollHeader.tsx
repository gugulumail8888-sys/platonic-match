"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function ScrollHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [showMeetInfo, setShowMeetInfo] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
    <header
      className={cn(
        "fixed top-[var(--banner-offset)] left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/60 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* ロゴ */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center shadow-sm">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-wide">
            ami<span className="text-primary-400">sta</span>
          </span>
        </div>

        {/* ナビゲーション */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-white">
          <Link href="#about" className="hover:text-primary-400 transition-colors">
            友情婚活とは
          </Link>
          <Link href="#features" className="hover:text-primary-400 transition-colors">
            特徴
          </Link>
          <Link href="#voice" className="hover:text-primary-400 transition-colors">
            コンセプト
          </Link>
          <Link href="/how-it-works" className="hover:text-primary-400 transition-colors">
            申請の流れ／AIおすすめプラン
          </Link>
          <button
            onClick={() => setShowMeetInfo(true)}
            className="hover:text-primary-400 transition-colors"
          >
            Google Meetとは
          </button>
        </nav>

            {/* ハンバーガーメニュー(モバイルのみ) */}
            <div className="relative md:hidden">
              <button
                onClick={() => setMobileNavOpen((v) => !v)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white"
                aria-label="メニュー"
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              {mobileNavOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden text-sm">
                  <Link href="#about" onClick={() => setMobileNavOpen(false)} className="block px-4 py-3 text-white hover:bg-zinc-800">
                    友情婚活とは
                  </Link>
                  <Link href="#features" onClick={() => setMobileNavOpen(false)} className="block px-4 py-3 text-white hover:bg-zinc-800">
                    特徴
                  </Link>
                  <Link href="#voice" onClick={() => setMobileNavOpen(false)} className="block px-4 py-3 text-white hover:bg-zinc-800">
                    コンセプト
                  </Link>
                  <Link href="/how-it-works" onClick={() => setMobileNavOpen(false)} className="block px-4 py-3 text-white hover:bg-zinc-800">
                    申請の流れ／AIおすすめプラン
                  </Link>
                  <button
                    onClick={() => { setMobileNavOpen(false); setShowMeetInfo(true); }}
                    className="block w-full text-left px-4 py-3 text-white hover:bg-zinc-800 border-t border-zinc-800"
                  >
                    Google Meetとは
                  </button>
                  <div className="border-t border-zinc-800 mt-1 pt-1">
                    <Link href="/login" onClick={() => setMobileNavOpen(false)} className="block px-4 py-3 text-white hover:bg-zinc-800">
                      ログイン
                    </Link>
                    <Link href="/signup" onClick={() => setMobileNavOpen(false)} className="block px-4 py-3 text-primary-400 font-medium hover:bg-zinc-800">
                      無料登録
                    </Link>
                  </div>
                </div>
              )}
            </div>

        {/* ボタン */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              ログイン
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">
              無料登録
            </Button>
          </Link>
        </div>
      </div>
    </header>

    {showMeetInfo && (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
        onClick={() => setShowMeetInfo(false)}
      >
        <div
          className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold mb-3">Google Meetとは</h3>
          <p className="text-sm text-zinc-300 leading-relaxed mb-4">
            amistaのお見合いは、Googleが提供するビデオ通話サービス「Google Meet」で行います。
            特別なアプリのインストールは不要で、ブラウザからそのまま参加できます。
          </p>
          <div className="flex items-center justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowMeetInfo(false)}>
              閉じる
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
