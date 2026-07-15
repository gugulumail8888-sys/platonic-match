import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "信頼できる友人から、ライフパートナーへ。友情婚活amista",
  description:
    "amistaは、友情・信頼・パートナーシップを大切にする友情婚活マッチングサービスです。恋愛感情より深い絆で結ばれた、本物のライフパートナーを見つけましょう。全会員に本人確認審査、Google Meetでオンラインお見合い。まずは無料登録から。",
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

export default function Page() {
  return <HomeClient />;
}
