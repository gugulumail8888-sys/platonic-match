import type { Metadata } from 'next';
import Link from 'next/link';
import { Receipt, ChevronRight, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記',
  description: 'amistaの特定商取引法に基づく表記です。',
};

// ============================================================
// Sub-components
// ============================================================

/** セクションカード（利用規約・プライバシーポリシーと共通スタイル） */
function SectionCard({
  title,
  children,
  variant = 'default',
}: {
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'teal' | 'warning';
}) {
  const styles = {
    default: {
      card: 'bg-zinc-800 border-zinc-700',
      bar:  'bg-teal-500',
      text: 'text-teal-400',
    },
    teal: {
      card: 'bg-teal-900/20 border-teal-700/50',
      bar:  'bg-teal-500',
      text: 'text-teal-400',
    },
    warning: {
      card: 'bg-yellow-900/15 border-yellow-700/40',
      bar:  'bg-yellow-500',
      text: 'text-yellow-400',
    },
  }[variant];

  return (
    <section className={`rounded-2xl border p-5 ${styles.card}`}>
      <h2 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${styles.text}`}>
        <span className={`w-1 h-4 rounded-full inline-block ${styles.bar}`} />
        {title}
      </h2>
      {children}
    </section>
  );
}

/** dl/dt/dd 形式の情報テーブル */
function InfoTable({
  rows,
}: {
  rows: { label: string; value: React.ReactNode; note?: string }[];
}) {
  return (
    <dl className="divide-y divide-zinc-700/50">
      {rows.map(({ label, value, note }, i) => (
        <div key={i} className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-3 first:pt-0 last:pb-0">
          <dt className="sm:w-44 flex-shrink-0 text-zinc-400 text-xs font-medium sm:pt-0.5">
            {label}
          </dt>
          <dd className="text-zinc-300 text-sm leading-relaxed">
            {value}
            {note && (
              <span className="block mt-0.5 text-zinc-500 text-xs">{note}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** teal ドット付き箇条書き */
function BulletList({
  items,
  color = 'teal',
}: {
  items: React.ReactNode[];
  color?: 'teal' | 'yellow';
}) {
  const dot = color === 'yellow' ? 'bg-yellow-500' : 'bg-teal-500';
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300 leading-relaxed">
          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ============================================================
// Page
// ============================================================

export default function TokushoPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">

      {/* ページヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Receipt className="w-5 h-5 text-teal-400" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            特定商取引法に基づく表記
          </h1>
        </div>
        <p className="text-zinc-500 text-sm">制定日：2026年5月27日</p>
      </div>

      <div className="space-y-3">

        {/* ── 事業者情報 ── */}
        <SectionCard title="事業者情報">
          <InfoTable
            rows={[
              { label: '販売業者',         value: '福祉のユーメイド合同会社' },
              { label: '運営責任者',        value: '竹島　直伸' },
              {
                label: '所在地',
                value: '宮崎県宮崎市大坪西二丁目10-13',
              },
              {
                label: '電話番号',
                value: '0985-86-6782',
              },
              {
                label: 'メールアドレス',
                value: (
                  <a
                    href="mailto:fukushino.youmade@gmail.com"
                    className="text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
                  >
                    fukushino.youmade@gmail.com
                  </a>
                ),
              },
              { label: 'サービス名',        value: 'amista' },
              {
                label: 'サービスURL',
                value: (
                  <a
                    href="https://amista.jp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors break-all"
                  >
                    https://amista.jp
                  </a>
                ),
                note: '（後で修正）',
              },
            ]}
          />
        </SectionCard>

        {/* ── 料金（teal 強調） ── */}
        <SectionCard title="料金" variant="teal">
          <InfoTable
            rows={[
              {
                label: '会員登録',
                value: (
                  <span className="text-teal-300 font-semibold">無料</span>
                ),
              },
              {
                label: 'お見合い申請料',
                value: (
                  <span className="text-teal-300 font-semibold">
                    無料プラン ¥3,500（税込）・AIおすすめプラン ¥3,000（税込） / 件
                  </span>
                ),
              },
              {
                label: 'AIおすすめプラン',
                value: (
                  <span className="text-teal-300 font-semibold">
                    月額980円（税込1,078円）
                  </span>
                ),
              },
              {
                label: '決済手数料',
                value: (
                  <span className="text-teal-300 font-semibold">無料</span>
                ),
              },
            ]}
          />
        </SectionCard>

        {/* ── 支払方法 ── */}
        <SectionCard title="支払方法">
          <BulletList
            items={[
              'クレジットカード（VISA・Mastercard・JCB・AMEX）',
              'その他（追加予定）',
            ]}
          />
        </SectionCard>

        {/* ── 支払時期 ── */}
        <SectionCard title="支払時期">
          <BulletList
            items={[
              'お見合い申請時に即時決済',
              '月額プランは毎月自動決済',
            ]}
          />
        </SectionCard>

        {/* ── サービス提供時期 ── */}
        <SectionCard title="サービス提供時期">
          <BulletList
            items={[
              '会員登録：本人確認審査完了後',
              'お見合い申請：決済完了後即時',
              '月額プラン：決済完了後即時',
            ]}
          />
        </SectionCard>

        {/* ── キャンセル・返金（warning 強調） ── */}
        <SectionCard title="キャンセル・返金ポリシー" variant="warning">
          <div className="flex items-start gap-2 mb-3 p-3 rounded-xl bg-yellow-900/20 border border-yellow-700/30">
            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-300 text-xs leading-relaxed">
              お申し込み前に必ずご確認ください。
            </p>
          </div>
          <BulletList
            color="yellow"
            items={[
              'お見合い申請料は原則返金不可',
              'ただし相手が承認しなかった場合は返金対応',
              '月額プランは月末までに解約申請で翌月より停止',
            ]}
          />
        </SectionCard>

        {/* ── 動作環境 ── */}
        <SectionCard title="動作環境">
          <BulletList
            items={[
              '推奨ブラウザ：Chrome・Safari・Firefox 最新版',
              'スマートフォン対応',
            ]}
          />
        </SectionCard>

        {/* ── 特記事項 ── */}
        <SectionCard title="特記事項">
          <BulletList
            items={[
              '本サービスは友情婚活（プラトニックパートナー探し）を目的としたサービスです',
              '恋愛・性的関係を目的とした利用は禁止します',
              '18歳未満の方はご利用いただけません',
            ]}
          />
        </SectionCard>

      </div>

      {/* フッターリンク */}
      <div className="mt-6 pt-5 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-zinc-600 text-xs">© 2026 amista. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link
            href="/terms"
            className="flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            利用規約
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/privacy"
            className="flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            プライバシーポリシー
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

    </div>
  );
}
