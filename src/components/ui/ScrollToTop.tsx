"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY >= 300);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="ページトップへ戻る"
      className="fixed bottom-24 right-4 lg:bottom-8 lg:right-6 z-50 w-11 h-11 rounded-full bg-teal-600 hover:bg-teal-500 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
