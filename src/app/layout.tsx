import type { Metadata, Viewport } from "next";
import { BetaBanner } from "@/components/layout/BetaBanner";
import FeedbackWidget from "@/components/feedback/FeedbackWidget";
import { BannerOffsetSync } from "@/components/layout/BannerOffsetSync";
import { getBannerOffset } from "@/lib/bannerOffset";
import { MaintenanceNoticeBanner } from "@/components/layout/MaintenanceNoticeBanner";
import { IncidentBanner } from "@/components/layout/IncidentBanner";
import { PrereleaseNoticeBanner } from "@/components/layout/PrereleaseNoticeBanner";
import { AiOptionPausedBanner } from "@/components/layout/AiOptionPausedBanner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://amista.net'),
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
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0d9488",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { offset } = await getBannerOffset();

  return (
    <html lang="ja" data-scroll-behavior="smooth">
      <body className="min-h-screen" style={{ '--banner-offset': `${offset}px` } as React.CSSProperties}>
        <BannerOffsetSync>
          <IncidentBanner />
          <MaintenanceNoticeBanner />
          <AiOptionPausedBanner />
          <PrereleaseNoticeBanner />
          <BetaBanner />
        </BannerOffsetSync>
        {children}
        <FeedbackWidget />
      </body>
    </html>
  );
}
