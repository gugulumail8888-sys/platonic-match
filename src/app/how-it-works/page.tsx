import { Metadata } from 'next';
import HowItWorksClient from './HowItWorksClient';

export const metadata: Metadata = {
  title: '申請の流れ',
  description: 'amistaでのお見合い申請から完了までの流れをご説明します。',
};

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}
