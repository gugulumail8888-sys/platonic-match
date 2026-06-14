import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'キャンセルポリシー',
  description: 'amistaのキャンセル・返金ポリシーです。お見合いのキャンセルルールをご確認ください。',
};

export default function CancelPolicyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
