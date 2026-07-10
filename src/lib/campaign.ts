// AIおすすめオプション キャンペーンの共通設定。
// 日付範囲・上限人数はここを1箇所だけ変更すれば、バナー表示(campaign-banner/route.ts)と
// 管理画面ダッシュボードの契約者数カウントの両方に反映される。
//
// 注意(2026/7/10時点): 本来の仕様は8月〜10月だが、現状は暫定的に7月〜9月のままにしている
// (日付が変更になる可能性があるため、確定してから修正する方針。タスク#23で追跡中)。

export const CAMPAIGN_START = new Date('2026-07-01T00:00:00+09:00');
export const CAMPAIGN_END = new Date('2026-09-30T23:59:59+09:00');
export const CAMPAIGN_SLOT_LIMIT = 200;
