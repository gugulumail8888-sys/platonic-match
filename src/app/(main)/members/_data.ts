// ============================================================
// メンバーダミーデータ（members/page.tsx と [id]/page.tsx で共有）
// TODO: Supabase連携時にこのファイルを削除し、DBから取得するよう変更する
// ============================================================

export interface MemberDetail {
  id: number;
  nickname: string;
  gender: 'male' | 'female';
  age: number;
  prefecture: string;
  occupation: string;
  bodyType: string;
  maritalHistory: string;
  numberOfChildren: string;
  hobbies: string;
  initials: string;
  avatarColor: string;
  // 詳細フィールド
  height: number;
  bloodType: string;
  education: string;
  siblings: string;
  smoking: string;
  income: string;
  livingArrangement: string;
  financeManagement: string;
  externalPartner: string;
  marriageTiming: string;
  childrenDesire: string;
  sexuality: string;
  pr: string;
  desiredConditions: string;
}

export const ALL_MEMBERS: MemberDetail[] = [
  // ========== 女性メンバー ==========
  {
    id: 1, nickname: 'さくら', gender: 'female', age: 30,
    prefecture: '東京都', occupation: 'OL', bodyType: '普通',
    maritalHistory: 'なし', numberOfChildren: 'なし',
    hobbies: '読書が大好きで、毎月5冊以上は読んでいます。カフェ巡りも趣味で、休日は気になったカフェを巡っています。映画も好きで、特にフランス映画が好みです。',
    initials: 'さ', avatarColor: '#0d9488',
    height: 158, bloodType: 'A型', education: '大学卒',
    siblings: '長女（2人姉妹）',
    smoking: 'なし', income: '300万〜400万未満',
    livingArrangement: '一人暮らし',
    financeManagement: '相談に応じて',
    externalPartner: 'なし',
    marriageTiming: '1〜2年以内',
    childrenDesire: 'ほしい',
    sexuality: 'ヘテロセクシュアル',
    pr: '明るくておっとりした性格です。仕事は真面目に取り組みながら、プライベートも大切にしています。料理は得意ではありませんが、一緒に作ることが好きです。日常の小さな幸せを大切にできるパートナーを探しています。',
    desiredConditions: '価値観が合う方を探しています。外見よりも中身を大切にしてくれる方、一緒にいて落ち着ける方が理想です。年齢は28〜38歳くらいの方。',
  },
  {
    id: 2, nickname: 'ゆり', gender: 'female', age: 27,
    prefecture: '大阪府', occupation: '看護師', bodyType: '細身',
    maritalHistory: 'なし', numberOfChildren: 'なし',
    hobbies: 'ヨガを週2回通っています。料理も好きで、特に和食を丁寧に作ることが楽しみです。旅行は国内外問わず行くのが好きで、特に温泉地が好きです。',
    initials: 'ゆ', avatarColor: '#0891b2',
    height: 162, bloodType: 'O型', education: '専門卒',
    siblings: '次女（2人姉妹）',
    smoking: 'なし', income: '300万〜400万未満',
    livingArrangement: '一人暮らし',
    financeManagement: '完全折半',
    externalPartner: 'なし',
    marriageTiming: '2〜3年以内',
    childrenDesire: 'ほしい',
    sexuality: 'ヘテロセクシュアル',
    pr: '看護師として働いており、人の役に立てることにやりがいを感じています。休日はヨガや料理でリフレッシュしています。穏やかで安定した生活を大切にしています。お互いを尊重し合える関係を築きたいです。',
    desiredConditions: '誠実で穏やかな方が好みです。仕事への姿勢がしっかりしている方。一緒に旅行や食事を楽しめる方。30〜36歳くらいの方を希望します。',
  },
  {
    id: 3, nickname: 'みらい', gender: 'female', age: 33,
    prefecture: '神奈川県', occupation: '教師', bodyType: 'ややぽっちゃり',
    maritalHistory: 'あり', numberOfChildren: '1人',
    hobbies: 'ハイキングが好きで、月に一度は山に行きます。写真撮影も趣味で、自然の風景を中心に撮っています。子供と一緒にできる活動も楽しんでいます。',
    initials: 'み', avatarColor: '#7c3aed',
    height: 160, bloodType: 'B型', education: '大学卒',
    siblings: '長女（3人きょうだい）',
    smoking: 'なし', income: '400万〜500万未満',
    livingArrangement: '家族と同居',
    financeManagement: '相談に応じて',
    externalPartner: 'なし',
    marriageTiming: 'すぐにでも',
    childrenDesire: 'ほしい',
    sexuality: 'ヘテロセクシュアル',
    pr: '小学校の教師として10年働いています。離婚を経験しましたが、前向きに新しい出会いを探しています。子供のことを一緒に考えてくれる方、家族を大切にできる方と出会いたいです。穏やかで誠実な性格です。',
    desiredConditions: '子供に対して理解がある方。子連れであることを受け入れてくれる方。一緒に家族を作っていける方を求めています。年齢は35〜45歳くらいを希望します。',
  },
  {
    id: 4, nickname: 'あかね', gender: 'female', age: 29,
    prefecture: '福岡県', occupation: 'ITエンジニア', bodyType: '普通',
    maritalHistory: 'なし', numberOfChildren: 'なし',
    hobbies: '映画鑑賞が大好きで、毎月映画館に行きます。旅行も好きで、特に海外旅行に年1回は行きたいと思っています。アウトドアも好きで、バーベキューやキャンプも楽しみます。',
    initials: 'あ', avatarColor: '#db2777',
    height: 165, bloodType: 'AB型', education: '大学卒',
    siblings: '一人っ子',
    smoking: 'なし', income: '400万〜500万未満',
    livingArrangement: '一人暮らし',
    financeManagement: '相談次第',
    externalPartner: 'なし',
    marriageTiming: '1〜2年以内',
    childrenDesire: '未定',
    sexuality: 'ヘテロセクシュアル',
    pr: 'ITエンジニアとして働いています。仕事は好きですが、プライベートも充実させたいと思っています。活発な性格で、新しいことに挑戦するのが好きです。一緒にいろんなことに挑戦できるパートナーを探しています。',
    desiredConditions: '好奇心旺盛で行動力のある方が好きです。一緒に旅行や映画を楽しめる方。仕事もプライベートも充実させている方。年齢は27〜38歳くらいの方を希望します。',
  },
  {
    id: 5, nickname: 'なな', gender: 'female', age: 35,
    prefecture: '宮崎県', occupation: '自営業（カフェ経営）', bodyType: '普通',
    maritalHistory: 'あり', numberOfChildren: 'なし',
    hobbies: '料理とガーデニングが趣味です。自分のカフェでオリジナルスイーツを作ることが楽しみです。温泉も好きで、宮崎の温泉地をよく巡っています。',
    initials: 'な', avatarColor: '#d97706',
    height: 156, bloodType: 'A型', education: '短大卒',
    siblings: '次女（2人姉妹）',
    smoking: 'なし', income: '200万〜300万未満',
    livingArrangement: '一人暮らし',
    financeManagement: '相談に応じて',
    externalPartner: 'なし',
    marriageTiming: '2〜3年以内',
    childrenDesire: 'ほしい',
    sexuality: 'ヘテロセクシュアル',
    pr: '地元宮崎でカフェを経営しています。離婚後に自分の夢だったカフェを開きました。地元を大切にしながら、穏やかな日常を過ごしています。笑顔を大切にできるパートナーと出会いたいです。',
    desiredConditions: '地元宮崎や南九州を好きになってくれる方。一緒に地域を楽しめる方。年齢は32〜42歳を希望します。穏やかで家庭的な方が好みです。',
  },
  // ========== 男性メンバー ==========
  {
    id: 6, nickname: 'けんじ', gender: 'male', age: 32,
    prefecture: '東京都', occupation: '会社員（営業）', bodyType: 'がっちり',
    maritalHistory: 'なし', numberOfChildren: 'なし',
    hobbies: 'サッカーを学生の頃からやっており、今も社会人チームで週末に活動しています。筋トレも週3回通っています。読書も好きで、ビジネス書や小説をよく読みます。',
    initials: 'け', avatarColor: '#0d9488',
    height: 178, bloodType: 'O型', education: '大学卒',
    siblings: '長男（2人兄弟）',
    smoking: 'なし', income: '500万〜600万未満',
    livingArrangement: '一人暮らし',
    financeManagement: '相談に応じて',
    externalPartner: 'なし',
    marriageTiming: '1〜2年以内',
    childrenDesire: 'ほしい',
    sexuality: 'ヘテロセクシュアル',
    pr: '営業職として働いており、人と話すことが好きです。体を動かすことも好きで、アクティブな生活を送っています。家族を大切にしたいと思っており、将来は温かい家庭を築きたいです。',
    desiredConditions: '一緒にスポーツや旅行を楽しめる方。笑顔が素敵な方。穏やかで家庭的な方を希望します。年齢は25〜35歳くらいの方。',
  },
  {
    id: 7, nickname: 'たける', gender: 'male', age: 28,
    prefecture: '大阪府', occupation: 'ソフトウェアエンジニア', bodyType: '普通',
    maritalHistory: 'なし', numberOfChildren: 'なし',
    hobbies: 'プログラミングが趣味でもあり仕事でもあります。ゲームは主にRPGが好きです。アニメも見ており、最近はジブリや新海誠作品をよく見ています。ドライブも好きです。',
    initials: 'た', avatarColor: '#2563eb',
    height: 172, bloodType: 'A型', education: '大学卒',
    siblings: '一人っ子',
    smoking: 'なし', income: '400万〜500万未満',
    livingArrangement: '一人暮らし',
    financeManagement: '完全折半',
    externalPartner: 'なし',
    marriageTiming: '2〜3年以内',
    childrenDesire: '未定',
    sexuality: 'ヘテロセクシュアル',
    pr: 'エンジニアとして働いていますが、オタク気質でもあります。内向的に見られますが、気心が知れると話が弾みます。穏やかで誠実な性格です。自分のペースを大切にしながら、相手のペースも尊重できると思っています。',
    desiredConditions: '共通の趣味がなくてもOKですが、お互いの趣味を尊重できる方。ゆっくりと関係を築ける方。年齢は23〜32歳くらいを希望します。',
  },
  {
    id: 8, nickname: 'りょうた', gender: 'male', age: 35,
    prefecture: '愛知県', occupation: '公務員（市役所）', bodyType: 'ぽっちゃり',
    maritalHistory: 'あり', numberOfChildren: '1人',
    hobbies: '釣りが趣味で、週末は愛知の海や川に行きます。料理も好きで、特に魚料理が得意です。子供と一緒にキャンプにも行くことがあります。',
    initials: 'り', avatarColor: '#059669',
    height: 170, bloodType: 'B型', education: '大学卒',
    siblings: '次男（3人兄弟）',
    smoking: 'なし', income: '500万〜600万未満',
    livingArrangement: '家族と同居',
    financeManagement: '相談に応じて',
    externalPartner: 'なし',
    marriageTiming: 'すぐにでも',
    childrenDesire: 'ほしい',
    sexuality: 'ヘテロセクシュアル',
    pr: '公務員として安定した仕事をしています。離婚後、子供と二人で生活しています。子供を大切にしながら、新しい出会いを探しています。穏やかで真面目な性格で、家族を大切にします。',
    desiredConditions: '子連れであることを理解してくれる方。子供と一緒に過ごせる方。愛知県近辺に住んでいるか移住できる方。年齢は30〜40歳くらいを希望します。',
  },
  {
    id: 9, nickname: 'はると', gender: 'male', age: 30,
    prefecture: '福岡県', occupation: '自営業（音楽スタジオ）', bodyType: '細身',
    maritalHistory: 'なし', numberOfChildren: 'なし',
    hobbies: '音楽が最大の趣味で、ギターとピアノを演奏します。旅行も好きで、音楽フェスのために各地に行きます。写真撮影も趣味で、ライブの雰囲気を撮るのが好きです。',
    initials: 'は', avatarColor: '#7c3aed',
    height: 175, bloodType: 'O型', education: '専門卒',
    siblings: '次男（2人兄弟）',
    smoking: 'なし', income: '200万〜300万未満',
    livingArrangement: '一人暮らし',
    financeManagement: '相談次第',
    externalPartner: 'なし',
    marriageTiming: '2〜3年以内',
    childrenDesire: '未定',
    sexuality: 'ヘテロセクシュアル',
    pr: '音楽スタジオを経営しています。収入は多くないですが、好きなことで生きています。音楽に理解がある方、または別の趣味を持っていて互いを尊重できる方と出会いたいです。人生を一緒に楽しめるパートナーを探しています。',
    desiredConditions: '音楽や芸術に理解がある方。収入よりも生き方を大切にできる方。一緒に楽しい日常を作れる方。年齢は25〜35歳くらいを希望します。',
  },
  {
    id: 10, nickname: 'だいき', gender: 'male', age: 38,
    prefecture: '鹿児島県', occupation: '医師（内科）', bodyType: '普通',
    maritalHistory: 'あり', numberOfChildren: '2人',
    hobbies: 'ゴルフは月2回コースに出ます。読書は医学書以外にも小説をよく読みます。料理も好きで、週末に子供と一緒に作ることがあります。',
    initials: 'だ', avatarColor: '#b45309',
    height: 176, bloodType: 'A型', education: '大学院卒',
    siblings: '長男（2人兄弟）',
    smoking: 'なし', income: '1000万以上',
    livingArrangement: '家族と同居',
    financeManagement: '相談に応じて',
    externalPartner: 'なし',
    marriageTiming: 'すぐにでも',
    childrenDesire: 'ほしい',
    sexuality: 'ヘテロセクシュアル',
    pr: '内科医として地域医療に携わっています。離婚後、2人の子供と生活しています。仕事が忙しいですが、家族の時間を大切にしています。鹿児島の自然や食が大好きで、地元を愛しています。誠実で温かい関係を築きたいです。',
    desiredConditions: '子供に理解がある方。鹿児島に住んでいる、または移住を考えられる方。穏やかで家庭的な方を希望します。年齢は28〜38歳くらいを希望します。',
  },
];

export const FEMALE_MEMBERS = ALL_MEMBERS.filter((m) => m.gender === 'female');
export const MALE_MEMBERS = ALL_MEMBERS.filter((m) => m.gender === 'male');

export function getMemberById(id: number): MemberDetail | undefined {
  return ALL_MEMBERS.find((m) => m.id === id);
}
