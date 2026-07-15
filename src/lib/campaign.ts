// AIおすすめオプション キャンペーンの共通設定。
// 日付範囲・上限人数はここを1箇所だけ変更すれば、バナー表示(campaign-banner/route.ts)・
// 管理画面ダッシュボードの契約者数カウント・各画面のバナー文言(getCampaignPeriodLabel経由)の
// すべてに自動的に反映される。
//
// 2026/7/15: タスク#23の仕様確定を受け、期間を8月〜10月・先着200名に確定。

export const CAMPAIGN_START = new Date('2026-08-01T00:00:00+09:00');
export const CAMPAIGN_END = new Date('2026-10-31T23:59:59+09:00');
export const CAMPAIGN_SLOT_LIMIT = 200;

// 日本時間(JST)基準で「◯月」を取得する(サーバーのタイムゾーン設定に左右されないようにするため)
function getMonthJST(date: Date): number {
  return Number(date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo', month: 'numeric' }));
}

// バナー等で使う「8月〜10月」のような期間表示文言を、CAMPAIGN_START/CAMPAIGN_ENDから自動生成する。
// 日付を変更した場合もこの関数を使っている箇所は文言が自動的に追従する。
export function getCampaignPeriodLabel(): string {
  return `${getMonthJST(CAMPAIGN_START)}月〜${getMonthJST(CAMPAIGN_END)}月`;
}
