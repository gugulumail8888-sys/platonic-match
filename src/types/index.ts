// ==========================================
// 婚活プラットフォーム 型定義
// React Native共有可能な型定義
// ==========================================

// ユーザープロフィール
export type Profile = {
  id: string;
  user_id: string;
  nickname: string;
  birth_date: string;
  gender: Gender;
  prefecture: string;
  occupation: string;
  annual_income?: AnnualIncome;
  education?: Education;
  height?: number;
  body_type?: BodyType;
  alcohol: DrinkingHabit;
  smoking: SmokingHabit;
  marriage_intention: MarriageIntention;
  about_me?: string;
  hobbies?: string[];
  avatar_url?: string;
  is_premium: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

// 性別
export type Gender = "male" | "female";

// 年収
export type AnnualIncome =
  | "under_200"
  | "200_300"
  | "300_400"
  | "400_500"
  | "500_700"
  | "700_1000"
  | "over_1000";

// 最終学歴
export type Education =
  | "high_school"
  | "vocational"
  | "junior_college"
  | "university"
  | "graduate";

// 体型
export type BodyType = "slim" | "normal" | "chubby" | "muscular" | "curvy";

// 飲酒習慣
export type DrinkingHabit = "never" | "sometimes" | "often" | "every_day";

// 喫煙習慣
export type SmokingHabit = "never" | "sometimes" | "often" | "quit";

// 結婚への意思
export type MarriageIntention =
  | "soon"
  | "within_1_year"
  | "within_3_years"
  | "someday"
  | "undecided";

// いいね
export type Like = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message?: string;
  created_at: string;
};

// マッチング
export type Match = {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
  status: MatchStatus;
};

export type MatchStatus = "active" | "blocked" | "deleted";

// メッセージ
export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read_at?: string;
  created_at: string;
};

// チャットルーム（マッチング + 最新メッセージ）
export type ChatRoom = {
  match: Match;
  partner: Profile;
  last_message?: Message;
  unread_count: number;
};

// ==========================================
// API レスポンス型
// ==========================================
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
};

// ==========================================
// フォーム型
// ==========================================
export type LoginFormData = {
  email: string;
  password: string;
};

export type RegisterFormData = {
  email: string;
  password: string;
  password_confirm: string;
};

export type ProfileFormData = {
  nickname: string;
  birth_date: string;
  gender: Gender;
  prefecture: string;
  occupation: string;
  annual_income?: AnnualIncome;
  education?: Education;
  height?: number;
  body_type?: BodyType;
  alcohol: DrinkingHabit;
  smoking: SmokingHabit;
  marriage_intention: MarriageIntention;
  about_me?: string;
  hobbies?: string[];
};

// ==========================================
// 検索フィルター型
// ==========================================
export type MemberSearchFilter = {
  gender?: Gender;
  age_min?: number;
  age_max?: number;
  prefecture?: string;
  annual_income?: AnnualIncome[];
  education?: Education[];
  marriage_intention?: MarriageIntention[];
  sort_by?: "newest" | "online" | "nearest";
};

// ==========================================
// 都道府県一覧
// ==========================================
export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
] as const;

export type Prefecture = typeof PREFECTURES[number];

// ==========================================
// ラベルマッピング
// ==========================================
export const GENDER_LABELS: Record<Gender, string> = {
  male: "男性",
  female: "女性",
  
};

export const ANNUAL_INCOME_LABELS: Record<AnnualIncome, string> = {
  under_200: "200万円未満",
  "200_300": "200〜300万円",
  "300_400": "300〜400万円",
  "400_500": "400〜500万円",
  "500_700": "500〜700万円",
  "700_1000": "700〜1000万円",
  over_1000: "1000万円以上",
};

export const EDUCATION_LABELS: Record<Education, string> = {
  high_school: "高校卒",
  vocational: "専門学校卒",
  junior_college: "短大卒",
  university: "大学卒",
  graduate: "大学院卒",
};

export const BODY_TYPE_LABELS: Record<BodyType, string> = {
  slim: "スリム",
  normal: "普通",
  chubby: "ぽっちゃり",
  muscular: "筋肉質",
  curvy: "グラマー",
};

export const DRINKING_LABELS: Record<DrinkingHabit, string> = {
  never: "飲まない",
  sometimes: "たまに飲む",
  often: "よく飲む",
  every_day: "毎日飲む",
};

export const SMOKING_LABELS: Record<SmokingHabit, string> = {
  never: "吸わない",
  sometimes: "たまに吸う",
  often: "よく吸う",
  quit: "禁煙中",
};

export const MARRIAGE_INTENTION_LABELS: Record<MarriageIntention, string> = {
  soon: "すぐにでも",
  within_1_year: "1年以内に",
  within_3_years: "3年以内に",
  someday: "いずれは",
  undecided: "未定",
};
