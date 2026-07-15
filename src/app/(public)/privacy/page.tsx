import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ChevronRight, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: 'amistaの個人情報の取り扱いについて説明しています。',
};

// ============================================================
// Sub-components（利用規約ページと共通スタイル）
// ============================================================

function ArticleSection({
  number,
  title,
  children,
  variant = 'default',
}: {
  number: number;
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}) {
  const isDanger = variant === 'danger';

  return (
    <section
      className={`rounded-2xl border p-5 ${
        isDanger
          ? 'bg-red-950/20 border-red-800/50'
          : 'bg-zinc-800 border-zinc-700'
      }`}
    >
      {/* 条番号 + タイトル */}
      <div className="flex items-start gap-3 mb-4">
        <span
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
            isDanger
              ? 'bg-red-900/60 border border-red-700/50 text-red-400'
              : 'bg-teal-900/60 border border-teal-700/50 text-teal-400'
          }`}
        >
          {number}
        </span>
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <h2 className="text-base font-bold text-white">
            第{number}条　{title}
          </h2>
          {isDanger && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/50 border border-red-700/50 text-red-400 text-xs font-medium">
              <AlertTriangle className="w-3 h-3" />
              重要
            </span>
          )}
        </div>
      </div>

      <div className="pl-11 space-y-2 text-sm text-zinc-300 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function BulletList({
  items,
  color = 'teal',
}: {
  items: string[];
  color?: 'teal' | 'red';
}) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span
            className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              color === 'red' ? 'bg-red-500' : 'bg-teal-500'
            }`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function InfoTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="divide-y divide-zinc-700/50">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex gap-4 py-2.5 first:pt-0 last:pb-0">
          <dt className="w-24 flex-shrink-0 text-zinc-400 text-xs font-medium">
            {label}
          </dt>
          <dd className="text-zinc-300 text-sm">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ============================================================
// Page
// ============================================================

export default function PrivacyPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">

      {/* ページヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-teal-400" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            プライバシーポリシー
          </h1>
        </div>
        <p className="text-zinc-500 text-sm">最終改定日：2026年5月27日</p>
      </div>

      {/* 前文 */}
      <div className="bg-teal-900/20 border border-teal-700/40 rounded-2xl p-4 mb-5 text-sm text-zinc-300 leading-relaxed">
        amistaは、会員の個人情報保護を重要な責務と考え、
        個人情報保護法その他関連法令を遵守します。
      </div>

      {/* 各条文 */}
      <div className="space-y-3">

        {/* 第1条 */}
        <ArticleSection number={1} title="取得する個人情報">
          <BulletList items={[
            '氏名・フリガナ・生年月日・性別',
            '住所・電話番号・メールアドレス',
            '職業・年収・趣味などのプロフィール情報',
            '本人確認書類（運転免許証・マイナンバーカード・パスポート）の画像',
            'サービス利用履歴・マッチング履歴',
          ]} />
        </ArticleSection>

        {/* 第2条 */}
        <ArticleSection number={2} title="利用目的">
          <BulletList items={[
            '会員登録・本人確認のため',
            'お見合い相手のマッチングのため',
            'サービスの運営・改善のため',
            '重要なお知らせの送付のため',
            '不正利用の防止のため',
          ]} />
        </ArticleSection>

        {/* 第3条 — 重要（赤アクセント） */}
        <ArticleSection number={3} title="本人確認書類の取扱い" variant="danger">
          <BulletList
            color="red"
            items={[
              '書類画像はSupabase Storageに暗号化して保存',
              '閲覧できるのは管理者のみ',
              '第三者への提供は一切行わない',
              '在籍中は保管し、退会後1年間保管後に削除',
              '1年経過後は自動的に削除',
            ]}
          />
          <p className="mt-3 text-sm">
            なお、本人確認書類の画像以外の登録情報(氏名・生年月日・プロフィール内容等)については、
            退会後3年間保管の上、削除いたします。
          </p>
        </ArticleSection>

        {/* 第4条 */}
        <ArticleSection number={4} title="第三者提供">
          <p className="mb-2">
            以下の場合を除き第三者に提供しません：
          </p>
          <BulletList items={[
            '本人の同意がある場合',
            '法令に基づく場合',
            '人の生命・財産の保護に必要な場合',
          ]} />
        </ArticleSection>

        {/* 第5条 */}
        <ArticleSection number={5} title="安全管理措置">
          <BulletList items={[
            'データの暗号化',
            'アクセス権限の制限',
            '定期的なセキュリティ点検',
          ]} />
        </ArticleSection>

        {/* 第6条 */}
        <ArticleSection number={6} title="開示・訂正・削除">
          <div className="space-y-2">
            <p>
              本人からの請求により開示・訂正・削除に対応します。
            </p>
            <p>
              お問い合わせ先：
              <a
                href="mailto:amistasupport@gmail.com"
                className="text-teal-400 hover:text-teal-300 underline underline-offset-2 ml-1 transition-colors"
              >
                amistasupport@gmail.com
              </a>
            </p>
          </div>
        </ArticleSection>

        {/* 第7条 */}
        <ArticleSection number={7} title="Cookieの使用">
          <BulletList items={[
            'サービス改善のためCookieを使用',
            'ブラウザ設定で無効化可能',
          ]} />
        </ArticleSection>

        {/* 第8条 */}
        <ArticleSection number={8} title="プライバシーポリシーの変更">
          <BulletList items={[
            '変更時はサイト上でお知らせします',
            '変更後も利用継続した場合は同意とみなします',
          ]} />
        </ArticleSection>

        {/* 第9条 */}
        <ArticleSection number={9} title="外国にある第三者への提供・業務委託">
          <BulletList items={[
            '本サービスは、データベース(Supabase)、決済(Stripe)、メール配信(Resend)、ビデオ通話(Google Meet)等の提供のため、海外に所在するサービス事業者に個人データの取扱いを委託する場合があります',
            '委託にあたっては、委託先において個人情報保護法と同等水準の安全管理措置が講じられていることを確認したうえで委託します',
            '上記の委託は法令上の第三者提供には該当しませんが、委託先に対して適切な監督を行います',
          ]} />
        </ArticleSection>

        {/* 第10条 */}
        <ArticleSection number={10} title="保有個人データの開示等の手続き">
          <BulletList items={[
            '保有個人データの利用目的の通知、開示、訂正・追加・削除、利用停止等をご希望の場合は、第6条記載のお問い合わせ先までご連絡ください',
            '開示のご請求については、法令に基づき、書面の郵送費用相当額(1件につき500円)の手数料をいただく場合があります',
            'ご本人確認のため、必要書類の提出をお願いする場合があります',
          ]} />
        </ArticleSection>

        {/* 第11条 */}
        <ArticleSection number={11} title="未成年者の個人情報">
          <BulletList items={[
            '本サービスは18歳未満の方はご利用いただけないため、未成年者の個人情報を通常取得することを想定していません',
            '万一未成年者の登録が判明した場合、登録を取り消し、取得した個人情報は速やかに削除します',
          ]} />
        </ArticleSection>

      </div>

      {/* 運営者情報 */}
      <div className="mt-5 bg-zinc-800 rounded-2xl border border-zinc-700 p-5">
        <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-teal-500 rounded-full inline-block" />
          運営者情報
        </h2>
        <InfoTable
          rows={[
            { label: 'サービス名', value: 'amista' },
            { label: '運営者',    value: '福祉のユーメイド合同会社' },
            { label: 'メール',    value: 'fukushino.youmade@gmail.com' },
            { label: '制定日',    value: '2026年5月27日' },
          ]}
        />
      </div>

      {/* フッターリンク */}
      <div className="mt-6 pt-5 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-zinc-600 text-xs">© 2026 amista. All rights reserved.</p>
        <Link
          href="/terms"
          className="flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 transition-colors"
        >
          利用規約
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}
