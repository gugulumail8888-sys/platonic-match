import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | 友縁",
    default: "友縁（ゆうえん） - 友情から始まる、本物のパートナーシップ",
  },
  description:
    "友縁は、友情・信頼・パートナーシップを大切にする友情婚活マッチングサービスです。恋愛感情より深い絆で結ばれた、本物のライフパートナーを見つけましょう。",
  keywords: ["友情婚活", "プラトニック", "パートナーシップ", "婚活", "マッチング", "友縁", "信頼", "絆"],
  authors: [{ name: "友縁" }],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "友縁（ゆうえん）",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
