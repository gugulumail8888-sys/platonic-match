import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "信頼できる友人から、ライフパートナーへ。友情婚活amista",
  description:
    "恋愛感情より、価値観と人柄。プレッシャーのない、あたらしいかたちの婚活「友情婚活」。全会員に本人確認審査、Google Meetでオンラインお見合い。まずは無料登録から。",
  openGraph: {
    title: "信頼できる友人から、ライフパートナーへ。| amista",
    description: "恋愛感情より、価値観と人柄。プレッシャーのない、あたらしいかたちの婚活。",
    type: "website",
    locale: "ja_JP",
    siteName: "amista",
    images: ['/og-image.png'],
  },
  twitter: {
    card: "summary_large_image",
    title: "信頼できる友人から、ライフパートナーへ。| amista",
    description: "恋愛感情より、価値観と人柄。プレッシャーのない、あたらしいかたちの婚活。",
    images: ['/og-image.png'],
  },
};

export default function LpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: 0 }}>
      {children}
    </div>
  );
}
