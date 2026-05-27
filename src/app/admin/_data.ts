// ============================================================
// 管理者画面 共通ダミーデータ
// TODO: Supabase連携後にDBから取得するよう変更する
// ============================================================

export type MemberStatus = 'approved' | 'pending' | 'suspended';
export type AppStatus    = 'pending' | 'scheduling' | 'completed';

// ── ステータスバッジ設定 ──────────────────────────────────────

export const MEMBER_STATUS_CONFIG: Record<
  MemberStatus,
  { label: string; className: string }
> = {
  approved:  { label: '承認済み', className: 'bg-green-900/50 text-green-300 border border-green-800' },
  pending:   { label: '審査中',   className: 'bg-amber-900/50 text-amber-300 border border-amber-800' },
  suspended: { label: '停止',     className: 'bg-red-900/50   text-red-300   border border-red-800'   },
};

export const APP_STATUS_CONFIG: Record<
  AppStatus,
  { label: string; className: string }
> = {
  pending:    { label: '申請中',     className: 'bg-amber-900/50 text-amber-300 border border-amber-800' },
  scheduling: { label: '日程調整中', className: 'bg-blue-900/50  text-blue-300  border border-blue-800'  },
  completed:  { label: '完了',       className: 'bg-green-900/50 text-green-300 border border-green-800' },
};

// ── 型定義 ────────────────────────────────────────────────────

export interface AdminMember {
  id: number;
  nickname: string;
  email: string;
  gender: 'male' | 'female';
  age: number;
  prefecture: string;
  occupation: string;
  bodyType: string;
  maritalHistory: string;
  numberOfChildren: string;
  height: number;
  bloodType: string;
  education: string;
  siblings: string;
  smoking: string;
  income: string;
  livingArrangement: string;
  marriageTiming: string;
  childrenDesire: string;
  sexuality: string;
  hobbies: string;
  pr: string;
  desiredConditions: string;
  initials: string;
  avatarColor: string;
  registeredAt: string;
  memberStatus: MemberStatus;
}

export interface AdminApplication {
  id: string;
  applicant: Pick<AdminMember,
    'id' | 'nickname' | 'age' | 'prefecture' | 'gender' | 'avatarColor' | 'initials' | 'occupation'
  >;
  target: Pick<AdminMember,
    'id' | 'nickname' | 'age' | 'prefecture' | 'gender' | 'avatarColor' | 'initials' | 'occupation'
  >;
  appliedAt: string;
  status: AppStatus;
  amount: number;
  aiScore: number;
  aiComment: string;
  adminNote: string;
}

// ── 会員ダミーデータ（10名） ──────────────────────────────────

export const ADMIN_MEMBERS: AdminMember[] = [
  {
    id: 1, nickname: 'さくら', email: 'sakura@example.com',
    gender: 'female', age: 30, prefecture: '東京都', occupation: 'OL',
    bodyType: '普通', maritalHistory: 'なし', numberOfChildren: 'なし',
    height: 158, bloodType: 'A型', education: '大学卒', siblings: '長女（2人姉妹）',
    smoking: 'なし', income: '300万〜400万未満', livingArrangement: '一人暮らし',
    marriageTiming: '1〜2年以内', childrenDesire: 'ほしい', sexuality: 'ヘテロセクシュアル',
    hobbies: '読書・カフェ巡り・映画鑑賞（特にフランス映画）',
    pr: '明るくておっとりした性格です。仕事は真面目に、プライベートも充実させたいと思っています。',
    desiredConditions: '価値観が合う方。外見より中身を大切にしてくれる方。28〜38歳くらいの方。',
    initials: 'さ', avatarColor: '#0d9488',
    registeredAt: '2026-03-15', memberStatus: 'approved',
  },
  {
    id: 2, nickname: 'ゆり', email: 'yuri@example.com',
    gender: 'female', age: 27, prefecture: '大阪府', occupation: '看護師',
    bodyType: '細身', maritalHistory: 'なし', numberOfChildren: 'なし',
    height: 162, bloodType: 'O型', education: '専門卒', siblings: '次女（2人姉妹）',
    smoking: 'なし', income: '300万〜400万未満', livingArrangement: '一人暮らし',
    marriageTiming: '2〜3年以内', childrenDesire: 'ほしい', sexuality: 'ヘテロセクシュアル',
    hobbies: 'ヨガ・料理（和食）・旅行（温泉地）',
    pr: '看護師として働いており、人の役に立てることにやりがいを感じています。穏やかで誠実な関係を大切にしています。',
    desiredConditions: '誠実で穏やかな方。仕事への姿勢がしっかりしている方。30〜36歳を希望。',
    initials: 'ゆ', avatarColor: '#0891b2',
    registeredAt: '2026-03-22', memberStatus: 'approved',
  },
  {
    id: 3, nickname: 'みらい', email: 'mirai@example.com',
    gender: 'female', age: 33, prefecture: '神奈川県', occupation: '教師',
    bodyType: 'ややぽっちゃり', maritalHistory: 'あり', numberOfChildren: '1人',
    height: 160, bloodType: 'B型', education: '大学卒', siblings: '長女（3人きょうだい）',
    smoking: 'なし', income: '400万〜500万未満', livingArrangement: '家族と同居',
    marriageTiming: 'すぐにでも', childrenDesire: 'ほしい', sexuality: 'ヘテロセクシュアル',
    hobbies: 'ハイキング・写真撮影・子供と一緒のアクティビティ',
    pr: '小学校教師として10年。離婚経験あり。子供を一緒に育ててくれる方と出会いたいです。',
    desiredConditions: '子連れ理解のある方。35〜45歳を希望。',
    initials: 'み', avatarColor: '#7c3aed',
    registeredAt: '2026-04-01', memberStatus: 'approved',
  },
  {
    id: 4, nickname: 'あかね', email: 'akane@example.com',
    gender: 'female', age: 29, prefecture: '福岡県', occupation: 'ITエンジニア',
    bodyType: '普通', maritalHistory: 'なし', numberOfChildren: 'なし',
    height: 165, bloodType: 'AB型', education: '大学卒', siblings: '一人っ子',
    smoking: 'なし', income: '400万〜500万未満', livingArrangement: '一人暮らし',
    marriageTiming: '1〜2年以内', childrenDesire: '未定', sexuality: 'ヘテロセクシュアル',
    hobbies: '映画鑑賞・海外旅行・バーベキュー・キャンプ',
    pr: 'ITエンジニアとして働いています。活発な性格で、新しいことに挑戦するのが好きです。',
    desiredConditions: '好奇心旺盛で行動力のある方。27〜38歳を希望。',
    initials: 'あ', avatarColor: '#db2777',
    registeredAt: '2026-04-10', memberStatus: 'pending',
  },
  {
    id: 5, nickname: 'なな', email: 'nana@example.com',
    gender: 'female', age: 35, prefecture: '宮崎県', occupation: '自営業（カフェ経営）',
    bodyType: '普通', maritalHistory: 'あり', numberOfChildren: 'なし',
    height: 156, bloodType: 'A型', education: '短大卒', siblings: '次女（2人姉妹）',
    smoking: 'なし', income: '200万〜300万未満', livingArrangement: '一人暮らし',
    marriageTiming: '2〜3年以内', childrenDesire: 'ほしい', sexuality: 'ヘテロセクシュアル',
    hobbies: '料理・ガーデニング・温泉巡り',
    pr: '宮崎でカフェを経営。地元を愛する温かな性格です。笑顔を大切にできる方と出会いたいです。',
    desiredConditions: '地元宮崎を好きになってくれる方。32〜42歳を希望。',
    initials: 'な', avatarColor: '#d97706',
    registeredAt: '2026-04-18', memberStatus: 'pending',
  },
  {
    id: 6, nickname: 'けんじ', email: 'kenji@example.com',
    gender: 'male', age: 32, prefecture: '東京都', occupation: '会社員（営業）',
    bodyType: 'がっちり', maritalHistory: 'なし', numberOfChildren: 'なし',
    height: 178, bloodType: 'O型', education: '大学卒', siblings: '長男（2人兄弟）',
    smoking: 'なし', income: '500万〜600万未満', livingArrangement: '一人暮らし',
    marriageTiming: '1〜2年以内', childrenDesire: 'ほしい', sexuality: 'ヘテロセクシュアル',
    hobbies: 'サッカー・筋トレ・読書（ビジネス書）',
    pr: '営業職として働き、人と話すことが好きです。将来は温かな家庭を築きたいです。',
    desiredConditions: '笑顔が素敵な方。穏やかで家庭的な方。25〜35歳を希望。',
    initials: 'け', avatarColor: '#0d9488',
    registeredAt: '2026-03-10', memberStatus: 'approved',
  },
  {
    id: 7, nickname: 'たける', email: 'takeru@example.com',
    gender: 'male', age: 28, prefecture: '大阪府', occupation: 'ソフトウェアエンジニア',
    bodyType: '普通', maritalHistory: 'なし', numberOfChildren: 'なし',
    height: 172, bloodType: 'A型', education: '大学卒', siblings: '一人っ子',
    smoking: 'なし', income: '400万〜500万未満', livingArrangement: '一人暮らし',
    marriageTiming: '2〜3年以内', childrenDesire: '未定', sexuality: 'ヘテロセクシュアル',
    hobbies: 'プログラミング・RPGゲーム・アニメ・ドライブ',
    pr: 'エンジニアですがオタク気質。穏やかで誠実な性格です。相手のペースを尊重できます。',
    desiredConditions: '趣味を尊重し合える方。ゆっくり関係を築ける方。23〜32歳を希望。',
    initials: 'た', avatarColor: '#2563eb',
    registeredAt: '2026-03-28', memberStatus: 'approved',
  },
  {
    id: 8, nickname: 'りょうた', email: 'ryota@example.com',
    gender: 'male', age: 35, prefecture: '愛知県', occupation: '公務員（市役所）',
    bodyType: 'ぽっちゃり', maritalHistory: 'あり', numberOfChildren: '1人',
    height: 170, bloodType: 'B型', education: '大学卒', siblings: '次男（3人兄弟）',
    smoking: 'なし', income: '500万〜600万未満', livingArrangement: '家族と同居',
    marriageTiming: 'すぐにでも', childrenDesire: 'ほしい', sexuality: 'ヘテロセクシュアル',
    hobbies: '釣り・料理（魚料理）・キャンプ',
    pr: '公務員として安定した仕事。子供と二人暮らし。誠実で家族を大切にします。',
    desiredConditions: '子連れ理解のある方。愛知近辺の方。30〜40歳を希望。',
    initials: 'り', avatarColor: '#059669',
    registeredAt: '2026-04-05', memberStatus: 'approved',
  },
  {
    id: 9, nickname: 'はると', email: 'haruto@example.com',
    gender: 'male', age: 30, prefecture: '福岡県', occupation: '自営業（音楽スタジオ）',
    bodyType: '細身', maritalHistory: 'なし', numberOfChildren: 'なし',
    height: 175, bloodType: 'O型', education: '専門卒', siblings: '次男（2人兄弟）',
    smoking: 'なし', income: '200万〜300万未満', livingArrangement: '一人暮らし',
    marriageTiming: '2〜3年以内', childrenDesire: '未定', sexuality: 'ヘテロセクシュアル',
    hobbies: 'ギター・ピアノ・音楽フェス・写真撮影',
    pr: '音楽スタジオを経営。好きなことで生きています。人生を一緒に楽しめる方を探しています。',
    desiredConditions: '音楽・芸術に理解のある方。収入より生き方を大切にできる方。25〜35歳を希望。',
    initials: 'は', avatarColor: '#7c3aed',
    registeredAt: '2026-04-20', memberStatus: 'pending',
  },
  {
    id: 10, nickname: 'だいき', email: 'daiki@example.com',
    gender: 'male', age: 38, prefecture: '鹿児島県', occupation: '医師（内科）',
    bodyType: '普通', maritalHistory: 'あり', numberOfChildren: '2人',
    height: 176, bloodType: 'A型', education: '大学院卒', siblings: '長男（2人兄弟）',
    smoking: 'なし', income: '1000万以上', livingArrangement: '家族と同居',
    marriageTiming: 'すぐにでも', childrenDesire: 'ほしい', sexuality: 'ヘテロセクシュアル',
    hobbies: 'ゴルフ・読書・子供との料理',
    pr: '内科医として地域医療に携わっています。誠実で温かい関係を築きたいです。',
    desiredConditions: '子供に理解のある方。鹿児島在住または移住可能な方。28〜38歳を希望。',
    initials: 'だ', avatarColor: '#b45309',
    registeredAt: '2026-03-01', memberStatus: 'suspended',
  },
];

// ── 申請ダミーデータ（10件） ──────────────────────────────────

const _m = (id: number) => {
  const m = ADMIN_MEMBERS.find((x) => x.id === id)!;
  return { id: m.id, nickname: m.nickname, age: m.age, prefecture: m.prefecture,
           gender: m.gender, avatarColor: m.avatarColor, initials: m.initials, occupation: m.occupation };
};

export const ADMIN_APPLICATIONS: AdminApplication[] = [
  {
    id: 'APP-847', applicant: _m(1), target: _m(6),
    appliedAt: '2026-05-24', status: 'pending',   amount: 3000,
    aiScore: 82, aiComment: '居住地が近く価値観が合致。結婚希望時期も一致しており良好なマッチングが期待できます。',
    adminNote: '',
  },
  {
    id: 'APP-523', applicant: _m(1), target: _m(7),
    appliedAt: '2026-05-20', status: 'scheduling', amount: 3000,
    aiScore: 78, aiComment: '趣味の傾向が近く、穏やかな関係が築けそうです。距離感が少し離れている点は要確認。',
    adminNote: '2026-05-28にZOOM予定',
  },
  {
    id: 'APP-291', applicant: _m(1), target: _m(8),
    appliedAt: '2026-05-13', status: 'completed',  amount: 3000,
    aiScore: 71, aiComment: '子供希望が一致。生活スタイルの違いはあるが誠実さが共通点として光ります。',
    adminNote: '2026-05-20にZOOM実施済み。良好',
  },
  {
    id: 'APP-612', applicant: _m(2), target: _m(6),
    appliedAt: '2026-05-22', status: 'pending',    amount: 3000,
    aiScore: 85, aiComment: '価値観・生活スタイルが高い一致度。結婚希望時期の差は小さく成立可能性が高いです。',
    adminNote: '',
  },
  {
    id: 'APP-388', applicant: _m(2), target: _m(9),
    appliedAt: '2026-05-18', status: 'scheduling', amount: 3000,
    aiScore: 73, aiComment: '共に福岡在住で地理的相性は抜群。収入差があるため価値観のすり合わせが重要です。',
    adminNote: '6月第1週に調整中',
  },
  {
    id: 'APP-175', applicant: _m(3), target: _m(10),
    appliedAt: '2026-05-10', status: 'completed',  amount: 3000,
    aiScore: 88, aiComment: '子連れ同士で共通理解が深く、希望条件がよく合致しています。高スコアのマッチング。',
    adminNote: '双方満足。継続フォロー予定',
  },
  {
    id: 'APP-934', applicant: _m(4), target: _m(6),
    appliedAt: '2026-05-25', status: 'pending',    amount: 3000,
    aiScore: 76, aiComment: '行動力と積極性が共通項。東京〜福岡の距離は課題ですが価値観はよく合います。',
    adminNote: '',
  },
  {
    id: 'APP-741', applicant: _m(4), target: _m(8),
    appliedAt: '2026-05-21', status: 'scheduling', amount: 3000,
    aiScore: 80, aiComment: '結婚への本気度が共通。居住地の違いが最大の課題ですが子供希望は一致しています。',
    adminNote: '5/30にZOOM予定',
  },
  {
    id: 'APP-856', applicant: _m(5), target: _m(9),
    appliedAt: '2026-05-15', status: 'completed',  amount: 3000,
    aiScore: 69, aiComment: '同じ九州在住でライフスタイルが類似。自営業同士で相互理解がしやすい関係です。',
    adminNote: '2026-05-22実施。追加フォロー要',
  },
  {
    id: 'APP-293', applicant: _m(2), target: _m(8),
    appliedAt: '2026-05-26', status: 'pending',    amount: 3000,
    aiScore: 77, aiComment: '子供希望が一致し安定志向も共通。距離（大阪〜愛知）の調整が今後の鍵です。',
    adminNote: '',
  },
];

// ── ヘルパー関数 ──────────────────────────────────────────────

export function getAdminMemberById(id: number): AdminMember | undefined {
  return ADMIN_MEMBERS.find((m) => m.id === id);
}

export function getApplicationsByMemberId(memberId: number): AdminApplication[] {
  return ADMIN_APPLICATIONS.filter(
    (a) => a.applicant.id === memberId || a.target.id === memberId
  );
}
