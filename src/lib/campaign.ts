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

// タイムゾーンオフセットが付いていない日時文字列(datetime-local由来。例: "2026-07-21T05:00")を
// JST(+09:00)として明示的に解釈してDateへ変換する。実行環境のローカルタイムゾーンに解釈結果が
// 左右されないようにするため(オフセットなしの文字列はnew Date()に渡すと実行環境依存になる)。
// 既にZまたは±hh:mmのオフセットが付いている文字列はそのままnew Date()に渡す。
function parseAsJst(value: string | undefined): Date | null {
  if (!value) return null;
  const hasOffset = /(Z|[+-]\d{2}:\d{2})$/.test(value);
  let normalized = value;
  if (!hasOffset) {
    const hasSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value);
    if (!hasSeconds) normalized = `${value}:00`;
    normalized = `${normalized}+09:00`;
  }
  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// settingsテーブルからcampaign_start/campaign_endを取得する。未設定または不正な値の場合はデフォルト値を使う。
export async function getCampaignPeriod(supabase: { from: (table: string) => any }): Promise<{ start: Date; end: Date }> {
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['campaign_start', 'campaign_end']);
  const map = Object.fromEntries(((data ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value]));
  const parsedStart = parseAsJst(map.campaign_start);
  const parsedEnd = parseAsJst(map.campaign_end);
  const start = parsedStart ?? CAMPAIGN_START_DEFAULT;
  const end = parsedEnd ?? CAMPAIGN_END_DEFAULT;
  return { start, end };
}

// campaign_banner_enabled・期間内・先着CAMPAIGN_SLOT_LIMIT名以内のすべてを満たしているかどうかを判定する。
// バナー表示(campaign-banner/route.ts)とクーポン適用可否(create-checkout-session/route.ts)の
// 両方から共通で呼び出し、判定ロジックの重複を防ぐ。
// profilesのカウントはRLSを回避する必要があるため、settings/getCampaignPeriod用のsupabaseとは別に
// admin clientを受け取る。
export async function isCampaignActive(
  supabase: { from: (table: string) => any },
  admin: { from: (table: string) => any }
): Promise<boolean> {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'campaign_banner_enabled')
    .maybeSingle();
  if (data?.value !== 'true') return false;

  const { start, end } = await getCampaignPeriod(supabase);
  const now = new Date();
  if (now < start || now > end) return false;

  const { count } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('subscription_started_at', start.toISOString())
    .lte('subscription_started_at', end.toISOString());
  if ((count ?? 0) >= CAMPAIGN_SLOT_LIMIT) return false;

  return true;
}

// 日本時間(JST)基準で「◯月」を取得する(サーバーのタイムゾーン設定に左右されないようにするため)
function getMonthJST(date: Date): number {
  return Number(date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo', month: 'numeric' }));
}

// バナー等で使う「8月〜10月」のような期間表示文言を、start/endから生成する。
export function getCampaignPeriodLabel(start: Date, end: Date): string {
  return `${getMonthJST(start)}月〜${getMonthJST(end)}月`;
}
