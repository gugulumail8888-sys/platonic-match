import { redirect } from 'next/navigation';

// タスク#125対応:このページの実体は退会理由アンケートではなく成婚報告アンケートだったため、
// 正しい名前の /marriage-report に移設(2026/7/21)。既存のブックマーク・古いリンク向けに
// このURLへアクセスした場合は新しいページへ転送する。
export default function WithdrawalSurveyRedirectPage() {
  redirect('/marriage-report');
}
