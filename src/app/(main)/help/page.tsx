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
    label: 'お見合い申請',
    emoji: '🤝',
    items: [
      {
        q: 'お見合い申請料はいくらですか？',
        a: '1件につき ¥3,000（税込）です。',
      },
      {
        q: '申請後にキャンセルできますか？',
        a: '原則キャンセル・返金はできません。ただし相手が承認しなかった場合は返金対応いたします。',
      },
      {
        q: 'ZOOMお見合いはどのように行いますか？',
        a: '申請が承認されたら日程調整を行い、事務局からZOOMリンクをお送りします。',
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
    ],
  },
  {
    id: 'other',
    label: '退会・その他',
    emoji: '⚙️',
    items: [
      {
        q: '退会方法を教えてください。',
        a: 'マイページ → 設定 → 退会するから手続きいただけます。退会後のデータは3年間保管後削除されます。',
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

      {/* ZOOMガイドリンク */}
      <div className="mt-3 bg-zinc-800 rounded-2xl border border-zinc-700 p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-blue-900/50 border border-blue-700/50 rounded-xl flex items-center justify-center flex-shrink-0 text-base">
            📱
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white mb-0.5">
              ZOOMお見合い準備ガイド
            </p>
            <p className="text-xs text-zinc-400">
              iPhone・AndroidでのZOOM参加手順をご確認ください
            </p>
          </div>
        </div>
        <Link
          href="/zoom-guide"
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-blue-300 text-sm font-medium rounded-xl transition-colors"
        >
          ZOOMお見合い準備ガイドを見る
          <ChevronRight className="w-4 h-4" />
        </Link>
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
