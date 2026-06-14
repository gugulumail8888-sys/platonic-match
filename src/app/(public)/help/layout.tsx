import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'よくある質問',
  description: 'amistaに関するよくある質問をまとめました。料金・お見合い・アカウントについてご確認いただけます。',
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
