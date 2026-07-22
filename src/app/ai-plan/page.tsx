import { Metadata } from 'next';
import AiPlanClient from './AiPlanClient';

export const metadata: Metadata = {
  title: 'AIおすすめプランとは',
  description: '仕事や育児で忙しい方へ。AIが毎週あなたに合うお相手を自動でご提案するamistaのAIおすすめプランをご紹介します。',
};

export default function AiPlanPage() {
  return <AiPlanClient />;
}
