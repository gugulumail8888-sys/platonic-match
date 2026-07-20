// AIおすすめオプション キャンペーンの共通設定。
// 期間はデフォルト値をここに定義しつつ、管理画面(settingsテーブルのcampaign_start/campaign_end)で
// 上書き設定できる。settingsに値があればそちらを優先し、無ければデフォルト値を使う。
// 上限人数はここを1箇所だけ変更すれば、バナー表示(campaign-banner/route.ts)・
// 管理画面ダッシュボードの契約者数カウント・各画面のバナー文言(getCampaignPeriodLabel経由)の
// すべてに自動的に反映される。
//
// 2026/7/15: タスク#23の仕様確定を受け、期間を8月〜10月・先着200名に確定。
// 2026/7/20: タスク#117対応。期間を管理画面から変更できるよう、settingsテーブル
// (campaign_start/campaign_end)から動的に取得する方式に変更(未設定時は下記デフォルト値を使用)。
export const CAMPAIGN_START_DEFAULT = new Date('2026-08-01T00:00:00+09:00');
export const CAMPAIGN_END_DEFAULT = new Date('2026-10-31T23:59:59+09:00');
export const CAMPAIGN_SLOT_LIMIT = 200;

// settingsテーブルからcampaign_start/campaign_endを取得する。未設定または不正な値の場合はデフォルト値を使う。
export async function getCampaignPeriod(supabase: { from: (table: string) => any }): Promise<{ start: Date; end: Date }> {
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['campaign_start', 'campaign_end']);
  const map = Object.fromEntries(((data ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value]));
  const parsedStart = map.campaign_start ? new Date(map.campaign_start) : null;
  const parsedEnd = map.campaign_end ? new Date(map.campaign_end) : null;
  const start = parsedStart && !isNaN(parsedStart.getTime()) ? parsedStart : CAMPAIGN_START_DEFAULT;
  const end = parsedEnd && !isNaN(parsedEnd.getTime()) ? parsedEnd : CAMPAIGN_END_DEFAULT;
  return { start, end };
}

// 日本時間(JST)基準で「◯月」を取得する(サーバーのタイムゾーン設定に左右されないようにするため)
function getMonthJST(date: Date): number {
  return Number(date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo', month: 'numeric' }));
}

// バナー等で使う「8月〜10月」のような期間表示文言を、start/endから生成する。
export function getCampaignPeriodLabel(start: Date, end: Date): string {
  return `${getMonthJST(start)}月〜${getMonthJST(end)}月`;
}
