import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'お問い合わせ',
  description: 'amistaへのお問い合わせはこちらから。サービスに関するご質問・ご要望をお気軽にどうぞ。',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
