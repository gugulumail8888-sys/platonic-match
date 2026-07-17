'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HelpCircle, ChevronDown, ChevronRight, MessageCircle } from 'lucide-react';

// ============================================================
// Types & Data
// ============================================================

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

interface FaqCategory {
  id: string;
  label: string;
  emoji: string;
  items: FaqItem[];
}

const FAQ_DATA: FaqCategory[] = [
  {
    id: 'registration',
    label: '会員登録・本人確認',
    emoji: '📋',
    items: [
      {
        q: '登録に必要なものは？',
        a: 'メールアドレスと本人確認書類（運転免許証・マイナンバーカード・パスポートのいずれか）が必要です。',
      },
      {
        q: '本人確認審査にどれくらいかかりますか？',
        a: '通常1〜3営業日以内に審査結果をメールでお知らせします。AIによる自動審査で即時承認される場合もあります。',
      },
      {
        q: '18歳未満は登録できますか？',
        a: '18歳未満の方はご利用いただけません。',
      },
    ],
  },
  {
    id: 'matching',
    label: 'いいね・お見合い申請',
    emoji: '🤝',
    items: [
      {
        q: '「いいね」とは何ですか？',
        a: '気になる会員のプロフィールに「いいね」を送れる機能です。1日に送れる件数には上限があり、上限に達すると翌日まで送信できません。お相手も自分に「いいね」を送っていた場合は「相互いいね」としてダッシュボードでお知らせします。',
      },
      {
        q: '「いいね」を送るとお見合い申請したことになりますか？',
        a: 'いいえ、「いいね」はお見合い申請とは別の機能です。「いいね」を送っただけでは相手に申請は届かず、料金も発生しません。お見合いを希望する場合は、プロフィール画面の「お見合いを申請する」ボタンから別途申請してください。',
      },
      {
        q: 'お見合い申請料はいくらですか？',
        a: '無料プランは¥3,500（税込）、AIおすすめプランは¥3,000（税込）です。',
      },
      {
        q: '申請後にキャンセルできますか？',
        a: 'お見合い申請料は、日程確定後にお支払いいただく仕組みです。相手が申請を承認しなかった場合はお支払い自体が発生していないため、返金の必要もありません。日程確定後にお支払いいただいた後は、原則キャンセル・返金はできません。ただし、相手都合（無断キャンセル・当日不参加など、ご自身に非がない場合）でキャンセルとなった場合は、お支払い済みの申請料を全額返金いたします。',
      },
      {
        q: 'お見合い申請の返答期限はありますか？',
        a: '申請から7日以内にお相手からの返答（承認またはお断り）がない場合、自動的に不成立となります。',
      },
      {
        q: 'Google Meetお見合いはどのように行いますか？',
        a: '申請が承認されたら日程調整を行い、事務局からGoogle Meetリンクをお送りします。',
      },
    ],
  },
  {
    id: 'payment',
    label: '料金・決済',
    emoji: '💳',
    items: [
      {
        q: '月額プランとは何ですか？',
        a: 'AIがあなたに合う相手を自動で選定し、毎週おすすめメンバーをご提案するオプションプランです。',
      },
      {
        q: '支払い方法は？',
        a: 'クレジットカード（VISA・Mastercard・JCB・AMEX）がご利用いただけます。',
      },
      {
        q: '領収書は発行してもらえますか？',
        a: 'クレジットカード決済のため、法律上は領収書の発行義務はありません。お支払いの証明としては、カード会社の利用明細またはStripeからの自動送付メールをご確認ください。',
      },
    ],
  },
  {
    id: 'meeting-rules',
    label: 'お見合い中の注意事項',
    emoji: '⚠️',
    items: [
      { q: '連絡先やSNSアカウントを交換してもいいですか？', a: 'LINEや電話番号などの連絡先、Instagram・X・Facebookなどのアカウント交換は禁止しています。' },
      { q: '住所や職場など、個人が特定できる情報を伝えてもいいですか？', a: '住所・職場など個人が特定できる情報を伝えることは禁止しています。' },
      { q: '画面の録画やスクリーンショットはできますか？', a: '画面の録画・スクリーンショットの撮影、通話内容の録音は禁止しています。' },
      { q: '金銭や物品のやり取りをしてもいいですか？', a: '金銭・物品の要求や贈与は禁止しています。' },
      { q: '交際を希望する場合はどうすればいいですか？', a: '必ずサイト内の「交際希望」ボタンから申請してください。それ以外の方法での交際の申し込みはご遠慮いただいています。' },
      { q: 'わいせつ・性的な内容のやり取りはできますか？', a: 'わいせつ画像・性的コンテンツ・不適切な画像データの送受信や共有は禁止しています。' },
      { q: '暴言や誹謗中傷、ハラスメントに該当する言動をしてもいいですか？', a: '暴言・誹謗中傷・ハラスメントに該当する言動は禁止しています。' },
      { q: 'お見合い時間を延長してもいいですか？', a: 'お見合い時間（40分）を超えた延長の依頼はご遠慮いただいています。' },
      { q: '禁止事項に違反した場合はどうなりますか？', a: '違反が確認された場合はまず警告を行います。ただし、わいせつ・性的コンテンツ等の重大な違反、または悪質・繰り返しの違反があった場合は即時アカウント停止・以降のご利用禁止となります。' },
      {
        q: '相手の言動に問題があった場合、どうすればいいですか？',
        a: 'お見合い完了画面の「この相手を通報する」から通報いただけます。連絡先の強要・不適切な発言・なりすまし・無断キャンセルなどのカテゴリから選択し、詳細を任意でご記入のうえ送信すると、事務局が内容を確認し対応いたします。通報内容は相手には通知されません。',
      },
    ],
  },
  {
    id: 'other',
    label: '退会・その他',
    emoji: '⚙️',
    items: [
      {
        q: '退会方法を教えてください。',
        a: 'マイページ → 設定 → 退会するから手続きいただけます。退会後、本人確認書類等の画像データは1年間保管後削除、その他の登録内容は3年間保管後削除されます。',
      },
      {
        q: '個人情報は安全ですか？',
        a: (
          <>
            本人確認書類は暗号化して保管し、管理者のみアクセス可能です。詳しくは
            <Link
              href="/privacy"
              className="text-teal-400 hover:text-teal-300 underline underline-offset-2 mx-1 transition-colors"
            >
              プライバシーポリシー
            </Link>
            をご覧ください。
          </>
        ),
      },
      {
        q: '退会後にもう一度登録できますか？',
        a: '退会後の再登録に関する制限は設けていません。ただし、禁止事項への違反等により運営者が利用停止とした場合は、再登録をお断りすることがあります。',
      },
      {
        q: '長期間ログインしないとどうなりますか？',
        a: '12ヶ月以上ログインがない場合、休眠会員として扱われることがあります。資格を取り消す場合は、取消しの30日前までに登録メールアドレス宛にご連絡します。',
      },
      {
        q: 'メンテナンス中かどうかはどこで確認できますか？',
        a: 'メンテナンス中は自動的にメンテナンス案内ページが表示されます。事前に予定されているメンテナンスがある場合は、サイト上でお知らせします。',
      },
      {
        q: 'パスワードを忘れてしまいました。どうすればいいですか？',
        a: 'ログイン画面の「パスワードを忘れた方はこちら」からメールアドレスを入力していただくと、パスワード再設定用のメールをお送りします。メール内のリンクから新しいパスワード（8文字以上）を設定してください。',
      },
    ],
  },
];

// ============================================================
// Accordion components
// ============================================================

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-xl border transition-colors duration-150 ${
        isOpen
          ? 'border-teal-600/60 bg-teal-900/10'
          : 'border-zinc-700 bg-zinc-800/60 hover:border-zinc-600'
      }`}
    >
      {/* 質問 */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
      >
        <span
          className={`flex-shrink-0 text-xs font-bold mt-0.5 w-5 ${
            isOpen ? 'text-teal-400' : 'text-zinc-500'
          }`}
        >
          Q
        </span>
        <span
          className={`flex-1 text-sm font-medium leading-relaxed ${
            isOpen ? 'text-teal-300' : 'text-zinc-200'
          }`}
        >
          {item.q}
        </span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-teal-400' : 'text-zinc-500'
          }`}
        />
      </button>

      {/* 回答 */}
      {isOpen && (
        <div className="px-4 pb-4 flex items-start gap-3">
          <span className="flex-shrink-0 text-xs font-bold text-teal-500 mt-0.5 w-5">
            A
          </span>
          <p className="flex-1 text-sm text-zinc-300 leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
}

function CategorySection({ category }: { category: FaqCategory }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i));
  }

  return (
    <section className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5">
      {/* カテゴリヘッダー */}
      <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-teal-500 rounded-full inline-block" />
        <span className="text-base mr-0.5">{category.emoji}</span>
        {category.label}
      </h2>

      {/* FAQ リスト */}
      <div className="space-y-2">
        {category.items.map((item, i) => (
          <AccordionItem
            key={i}
            item={item}
            isOpen={openIndex === i}
            onToggle={() => toggle(i)}
          />
        ))}
      </div>
    </section>
  );
}

// ============================================================
// Page
// ============================================================

export default function HelpPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">

      {/* ページヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle className="w-5 h-5 text-teal-400" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            ヘルプ・よくある質問
          </h1>
        </div>
        <p className="text-zinc-500 text-sm">
          よくお寄せいただくご質問をまとめました。
        </p>
      </div>

      {/* カテゴリ別 FAQ */}
      <div className="space-y-3">
        {FAQ_DATA.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
      </div>

      {/* フッター：お問い合わせへ誘導 */}
      <div className="mt-6 bg-zinc-800 rounded-2xl border border-zinc-700 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-teal-900/50 border border-teal-700/50 rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-0.5">
              解決しない場合はお問い合わせください
            </p>
            <p className="text-xs text-zinc-400">
              平日10:00〜18:00に対応しています
            </p>
          </div>
        </div>
        <Link
          href="/contact"
          className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors flex-shrink-0"
        >
          お問い合わせ
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* モバイル下部ナビ用スペーサー */}
      <div className="h-24 lg:hidden" aria-hidden="true" />

    </div>
  );
}
