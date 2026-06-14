import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: '利用規約',
};

// ============================================================
// Sub-components
// ============================================================

function ArticleSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5">
      {/* 条番号 + タイトル */}
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-900/60 border border-teal-700/50 flex items-center justify-center text-teal-400 text-xs font-bold">
          {number}
        </span>
        <h2 className="text-base font-bold text-white pt-1">第{number}条　{title}</h2>
      </div>
      <div className="pl-11 space-y-2 text-sm text-zinc-300 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
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
          <dt className="w-24 flex-shrink-0 text-zinc-400 text-xs font-medium">{label}</dt>
          <dd className="text-zinc-300 text-sm">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ============================================================
// Page
// ============================================================

export default function TermsPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">

      {/* ページヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-teal-400" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">利用規約</h1>
        </div>
        <p className="text-zinc-500 text-sm">最終改定日：2026年5月27日</p>
      </div>

      {/* 前文 */}
      <div className="bg-teal-900/20 border border-teal-700/40 rounded-2xl p-4 mb-5 text-sm text-zinc-300 leading-relaxed">
        amista（以下「本サービス」）をご利用いただく前に、この利用規約をよくお読みください。
        会員登録を完了した時点で、本規約に同意したものとみなします。
      </div>

      {/* 各条文 */}
      <div className="space-y-3">

        {/* 第1条 */}
        <ArticleSection number={1} title="適用">
          <p>
            本規約はamista（以下「本サービス」）の利用条件を定めるものです。
            会員登録した時点で本規約に同意したものとみなします。
          </p>
        </ArticleSection>

        {/* 第2条 */}
        <ArticleSection number={2} title="会員登録">
          <BulletList items={[
            '18歳以上の方のみ登録可能',
            '本人確認書類の提出が必要',
            '虚偽情報での登録禁止',
            '1人につき1アカウントのみ',
          ]} />
        </ArticleSection>

        {/* 第3条 */}
        <ArticleSection number={3} title="サービス内容">
          <BulletList items={[
            'メンバー検索・プロフィール閲覧',
            'お見合い申請（無料プラン¥3,500（税込）・AIおすすめプラン¥3,000（税込））',
            'Google Meetによるお見合い',
            'AIおすすめプラン（月額・別途料金）',
          ]} />
        </ArticleSection>

        {/* 第4条 */}
        <ArticleSection number={4} title="禁止事項">
          <BulletList items={[
            'なりすまし・虚偽情報の登録',
            '営業・勧誘目的での利用',
            '他会員への嫌がらせ・ハラスメント',
            '個人情報の無断収集',
            '反社会的勢力の利用',
            'その他法令に違反する行為',
          ]} />
        </ArticleSection>

        {/* 第5条 */}
        <ArticleSection number={5} title="お見合い申請料">
          <BulletList items={[
            '申請料は、無料プラン ¥3,500（税込）、AIおすすめプラン ¥3,000（税込）',
            '申請後のキャンセル・返金不可',
            '相手が承認した場合のみ Google Meet 日程調整へ進む',
          ]} />
        </ArticleSection>

        {/* 第6条 */}
        <ArticleSection number={6} title="月額オプション">
          <BulletList items={[
            'AIおすすめプランは月額料金が発生',
            '料金は別途定める（変更予定）',
            '解約は月末までに申請',
          ]} />
        </ArticleSection>

        {/* 第7条 */}
        <ArticleSection number={7} title="退会">
          <BulletList items={[
            'いつでも退会可能',
            '退会後のデータは3年間保管後削除',
            '退会後の返金不可',
          ]} />
        </ArticleSection>

        {/* 第8条 */}
        <ArticleSection number={8} title="免責事項">
          <div className="space-y-2">
            <p>
              当サービスは出会いの機会を提供するものであり、成婚・交際を保証するものではありません。
            </p>
            <BulletList items={[
              '会員同士のトラブルについて当社は責任を負いません',
              'Google Meetお見合い後の連絡先交換は自己責任',
            ]} />
          </div>
        </ArticleSection>

        {/* 第9条 */}
        <ArticleSection number={9} title="個人情報">
          <p>
            個人情報の取扱いは別途
            <Link
              href="/privacy"
              className="text-teal-400 hover:text-teal-300 underline underline-offset-2 mx-1 transition-colors"
            >
              プライバシーポリシー
            </Link>
            に定めます。
          </p>
        </ArticleSection>

        {/* 第10条 */}
        <ArticleSection number={10} title="規約の変更">
          <BulletList items={[
            '本規約は予告なく変更する場合があります',
            '変更後も利用継続した場合は同意とみなします',
          ]} />
        </ArticleSection>

        {/* 第11条 */}
        <ArticleSection number={11} title="準拠法・管轄">
          <BulletList items={[
            '本規約は日本法に準拠',
            '紛争は〇〇地方裁判所を第一審の専属管轄',
          ]} />
        </ArticleSection>

      </div>

      {/* 運営者情報 */}
      <div className="mt-5 bg-zinc-800 rounded-2xl border border-zinc-700 p-5">
        <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-teal-500 rounded-full inline-block" />
          運営者情報
        </h2>
        <InfoTable rows={[
          { label: 'サービス名', value: 'amista' },
          { label: '運営者',    value: '〇〇〇〇（後で修正）' },
          { label: '所在地',    value: '〇〇県〇〇市（後で修正）' },
          { label: 'メール',    value: 'info@amista.jp（後で修正）' },
          { label: '制定日',    value: '2026年5月27日' },
        ]} />
      </div>

      {/* フッターリンク */}
      <div className="mt-6 pt-5 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-zinc-600 text-xs">© 2026 amista. All rights reserved.</p>
        <Link
          href="/privacy"
          className="flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 transition-colors"
        >
          プライバシーポリシー
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}
