'use client';

import { useState } from 'react';
import { Mail, CheckCircle, Clock, Info } from 'lucide-react';

// ============================================================
// Types & Constants
// ============================================================

const INQUIRY_TYPES = [
  '会員登録・本人確認について',
  'お見合い申請について',
  '料金・決済について',
  '退会について',
  '不具合・エラーについて',
  'フィードバック・ご意見',
  'バグ・不具合の報告',
  'その他',
] as const;

interface FormState {
  name: string;
  email: string;
  type: string;
  subject: string;
  body: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  type: '',
  subject: '',
  body: '',
};

// ============================================================
// Shared style
// ============================================================

const inputCls =
  'w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white text-sm ' +
  'placeholder-zinc-500 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 ' +
  'transition-colors';

const labelCls = 'block text-xs font-semibold text-zinc-400 mb-1.5';

function RequiredBadge() {
  return (
    <span className="ml-1.5 text-red-400 font-normal normal-case">※必須</span>
  );
}

// ============================================================
// Success Screen
// ============================================================

function SuccessMessage({ onReset }: { onReset: () => void }) {
  return (
    <div className="bg-zinc-800 rounded-2xl border border-teal-700/50 p-8 text-center">
      <div className="w-14 h-14 bg-teal-900/50 border border-teal-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-7 h-7 text-teal-400" />
      </div>
      <h2 className="text-lg font-bold text-white mb-2">送信完了</h2>
      <p className="text-zinc-300 text-sm leading-relaxed mb-1">
        お問い合わせを受け付けました。
      </p>
      <p className="text-zinc-400 text-sm leading-relaxed mb-6">
        3営業日以内にご返信いたします。
      </p>
      <button
        type="button"
        onClick={onReset}
        className="px-6 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors"
      >
        新しいお問い合わせをする
      </button>
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const isValid =
    form.name.trim() !== '' &&
    form.email.trim() !== '' &&
    form.type !== '' &&
    form.subject.trim() !== '' &&
    form.body.trim() !== '';

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || sending) return;
    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) {
        setSendError(data.error ?? '送信に失敗しました。時間をおいて再度お試しください。');
        return;
      }
      setSubmitted(true);
    } catch {
      setSendError('送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setSending(false);
    }
  }

  function handleReset() {
    setForm(INITIAL_FORM);
    setSubmitted(false);
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">

      {/* ページヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-5 h-5 text-teal-400" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            お問い合わせ
          </h1>
        </div>
        <p className="text-zinc-500 text-sm">
          ご不明な点やお困りのことがあればお気軽にご連絡ください。
        </p>
      </div>

      {submitted ? (
        <SuccessMessage onReset={handleReset} />
      ) : (
        <>
          {/* 注意事項 */}
          <div className="bg-zinc-800/60 border border-zinc-700 rounded-2xl p-4 mb-5 space-y-2">
            <div className="flex items-start gap-2 text-xs text-zinc-400">
              <Info className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
              <span>返信先はご登録のメールアドレスへ送信します。</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
              <span>営業時間：平日 10:00〜17:00（土日祝日・年末年始を除く）</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-zinc-400">
              <Info className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
              <span>本サイトにおける「営業日」とは、土日祝日および年末年始を除いた日をいいます。</span>
            </div>
          </div>

          {/* フォーム */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5 space-y-4"
          >
            {/* お名前 */}
            <div>
              <label className={labelCls}>
                お名前
                <RequiredBadge />
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="山田 太郎"
                autoComplete="name"
                className={inputCls}
              />
            </div>

            {/* メールアドレス */}
            <div>
              <label className={labelCls}>
                メールアドレス
                <RequiredBadge />
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="example@email.com"
                autoComplete="email"
                className={inputCls}
              />
            </div>

            {/* お問い合わせ種別 */}
            <div>
              <label className={labelCls}>
                お問い合わせ種別
                <RequiredBadge />
              </label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className={`${inputCls} appearance-none cursor-pointer`}
              >
                <option value="" disabled>選択してください</option>
                {INQUIRY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* 件名 */}
            <div>
              <label className={labelCls}>
                件名
                <RequiredBadge />
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => set('subject', e.target.value)}
                placeholder="お問い合わせの件名を入力してください"
                className={inputCls}
              />
            </div>

            {/* お問い合わせ内容 */}
            <div>
              <label className={labelCls}>
                お問い合わせ内容
                <RequiredBadge />
              </label>
              <textarea
                value={form.body}
                onChange={(e) => set('body', e.target.value)}
                rows={6}
                maxLength={1000}
                placeholder="お問い合わせの内容を詳しくご記入ください"
                className={`${inputCls} resize-none`}
              />
              <div className="text-right text-xs text-zinc-500 mt-1">
                残り {1000 - form.body.length}文字
              </div>
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={!isValid || sending}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                isValid && !sending
                  ? 'bg-teal-600 hover:bg-teal-500 text-white'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {sending ? '送信中...' : '送信する'}
            </button>

            {!isValid && (
              <p className="text-center text-xs text-zinc-500">
                すべての必須項目を入力してください
              </p>
            )}
            {sendError && (
              <p className="text-center text-xs text-red-400">{sendError}</p>
            )}
          </form>
        </>
      )}

    </div>
  );
}
