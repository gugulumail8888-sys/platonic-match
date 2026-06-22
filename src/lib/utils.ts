import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInYears, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { format } from "date-fns";

// Tailwind クラス結合ユーティリティ
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 年齢計算
export function calculateAge(birthDate: string): number {
  return differenceInYears(new Date(), parseISO(birthDate));
}

// 日付フォーマット（日本語）
export function formatDateJa(date: string | Date, formatStr = "yyyy年MM月dd日"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr, { locale: ja });
}

// 相対時間（日本語）
export function formatRelativeTimeJa(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "たった今";
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  return formatDateJa(d, "MM月dd日");
}

// アバターURLのフォールバック
export function getAvatarUrl(url?: string | null, name?: string): string {
  if (url) return url;
  // 名前の頭文字でデフォルトアバターを生成
  const initial = name?.[0] ?? "?";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=f43f5e&color=fff&size=200`;
}

// エラーメッセージの日本語変換
export function translateAuthError(error: string): string {
  const errorMap: Record<string, string> = {
    "Invalid login credentials": "メールアドレスまたはパスワードが正しくありません",
    "Email not confirmed": "メールアドレスの確認が完了していません",
    "User already registered": "このメールアドレスはすでに登録されています",
    "Password should be at least 6 characters": "パスワードは6文字以上で入力してください",
    "Unable to validate email address: invalid format": "メールアドレスの形式が正しくありません",
  };
  return errorMap[error] ?? "エラーが発生しました。しばらく経ってから再度お試しください。";
}

export const AVATAR_COLORS = [
  '#0d9488','#7c3aed','#db2777','#ea580c','#16a34a',
  '#2563eb','#d97706','#dc2626','#0891b2','#65a30d',
];

export function getAvatarColor(id: string, overrideColor?: string | null): string {
  if (overrideColor) return overrideColor;
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
