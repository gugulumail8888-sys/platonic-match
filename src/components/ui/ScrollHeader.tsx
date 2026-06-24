"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function ScrollHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-10 left-0 right-0 z-50 transition-all duration-500",
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
        <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
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
            申請の流れ
          </Link>
        </nav>

        {/* ボタン */}
        <div className="flex items-center gap-3">
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
  );
}
