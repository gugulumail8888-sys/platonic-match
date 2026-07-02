const TIMEZONE_SUFFIX_REGEX = /(Z|[+-]\d{2}:?\d{2})$/;

/**
 * datetime-local由来のタイムゾーンなし文字列（日本時間で入力された値）を
 * 日本時間として解釈してDateにパースする。
 * すでにタイムゾーン情報（Z や +09:00 など）が含まれる場合はそのまま使う。
 */
export function parseJstDateTime(value: string): Date {
  const iso = TIMEZONE_SUFFIX_REGEX.test(value) ? value : `${value}+09:00`;
  return new Date(iso);
}
