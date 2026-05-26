import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | amista",
    default: "amista - 友情から始まる、本物のパートナーシップ",
  },
  description:
    "amistaは、友情・信頼・パートナーシップを大切にする友情婚活マッチングサービスです。恋愛感情より深い絆で結ばれた、本物のライフパートナーを見つけましょう。",
  keywords: ["友情婚活", "プラトニック", "パートナーシップ", "婚活", "マッチング", "amista", "信頼", "絆"],
  authors: [{ name: "amista" }],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "amista",
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
