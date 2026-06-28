'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, CheckCircle, ChevronRight, ChevronLeft, Minus, Plus, Loader2 } from 'lucide-react';

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

const PRIORITY_ITEMS = [
  { id: 'values', label: '価値観' },
  { id: 'lifestyle', label: '生活スタイル' },
  { id: 'hobbies', label: '趣味' },
  { id: 'income', label: '収入' },
  { id: 'stability', label: '安定性' },
];

const NG_CONDITIONS = [
  { id: 'smoking', label: '喫煙者NG' },
  { id: 'transfer', label: '転勤ありNG' },
  { id: 'noChildren', label: '子供不要NG' },
  { id: 'pet', label: 'ペットNG' },
  { id: 'nightOwl', label: '夜型生活NG' },
  { id: 'longDistance', label: '遠距離NG' },
];

const STEPS = ['ヒアリング', '確認', '完了'];

interface FormData {
  ageMin: number;
  ageMax: number;
  prefectures: string[];
  priorities: string[];
  ngConditions: string[];
  message: string;
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const done = current > idx;
        const active = current === idx;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                done ? 'bg-teal-500 text-white' :
                active ? 'bg-teal-800 border-2 border-teal-400 text-teal-300' :
                'bg-zinc-800 border border-zinc-700 text-zinc-500'
              }`}>
                {done ? <CheckCircle className="w-4 h-4" /> : idx}
              </div>
              <span className={`text-xs ${active ? 'text-white font-medium' : done ? 'text-teal-400' : 'text-zinc-500'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${done ? 'bg-teal-600' : 'bg-zinc-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OptionApplyPage() {
  const router = useRouter();
  const [aiOptionEnabled, setAiOptionEnabled] = useState<boolean | null>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data: Record<string, string>) => {
        setAiOptionEnabled(data.ai_option_enabled !== 'false');
      })
      .catch(() => setAiOptionEnabled(true));
  }, []);
  const [form, setForm] = useState<FormData>({
    ageMin: 25,
    ageMax: 40,
    prefectures: [],
    priorities: [],
    ngConditions: [],
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (form.ageMin < 18 || form.ageMax > 70 || form.ageMin > form.ageMax) {
      errs.age = '年齢範囲が正しくありません（18〜70歳、最小≦最大）';
    }
    if (form.prefectures.length === 0) errs.prefectures = '1つ以上の都道府県を選択してください';
    if (form.priorities.length < 3) errs.priorities = '重視することを3つ以上選んでください';
    if (form.message.length > 200) errs.message = '200文字以内で入力してください';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate()) setStep(2);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setSubmitError(data.error ?? '決済セッションの作成に失敗しました');
        return;
      }
      window.location.href = data.url;
    } catch {
      setSubmitError('決済処理に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustAge = (field: 'ageMin' | 'ageMax', delta: number) => {
    setForm(prev => ({ ...prev, [field]: Math.min(70, Math.max(18, prev[field] + delta)) }));
  };

  const togglePrefecture = (pref: string) => {
    setForm(prev => ({
      ...prev,
      prefectures: prev.prefectures.includes(pref)
        ? prev.prefectures.filter(p => p !== pref)
        : [...prev.prefectures, pref],
    }));
  };

  const togglePriority = (id: string) => {
    setForm(prev => ({
      ...prev,
      priorities: prev.priorities.includes(id)
        ? prev.priorities.filter(p => p !== id)
        : [...prev.priorities, id],
    }));
  };

  const toggleNG = (id: string) => {
    setForm(prev => ({
      ...prev,
      ngConditions: prev.ngConditions.includes(id)
        ? prev.ngConditions.filter(n => n !== id)
        : [...prev.ngConditions, id],
    }));
  };

  if (aiOptionEnabled === null) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>;
  }

  if (!aiOptionEnabled) {
    return (
      <div className="p-6 md:p-8 max-w-xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <Bot className="w-9 h-9 text-zinc-500" />
        </div>
        <h1 className="text-xl font-bold text-white mb-3">現在AIおすすめオプションはご利用いただけません</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          ただいまサービスを一時停止しております。<br />
          運営からのお知らせをお待ちください。
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-teal-900 border border-teal-800 rounded-xl flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">AIおすすめオプション申し込み</h1>
          <p className="text-xs text-zinc-400">あなたの希望をもとにAIが最適なマッチを提案します</p>
        </div>
      </div>

      <StepIndicator current={step} />

      {/* ステップ1：ヒアリングフォーム */}
      {step === 1 && (
        <div className="space-y-5">

          {/* 年齢範囲 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-white font-bold text-sm mb-4">希望する相手の年齢範囲</h2>
            <div className="grid grid-cols-2 gap-3">
              {/* 最小年齢 */}
              <div>
                <p className="text-zinc-400 text-xs mb-2 text-center">最小年齢</p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => adjustAge('ageMin', -1)}
                    className="w-9 h-9 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min={18}
                    max={70}
                    value={form.ageMin}
                    onChange={e => setForm(prev => ({ ...prev, ageMin: Number(e.target.value) }))}
                    className="w-full min-w-0 text-center bg-zinc-800 border border-zinc-700 rounded-xl py-2 text-white text-xl font-bold focus:outline-none focus:border-teal-600"
                  />
                  <button
                    onClick={() => adjustAge('ageMin', 1)}
                    className="w-9 h-9 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* 最大年齢 */}
              <div>
                <p className="text-zinc-400 text-xs mb-2 text-center">最大年齢</p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => adjustAge('ageMax', -1)}
                    className="w-9 h-9 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min={18}
                    max={70}
                    value={form.ageMax}
                    onChange={e => setForm(prev => ({ ...prev, ageMax: Number(e.target.value) }))}
                    className="w-full min-w-0 text-center bg-zinc-800 border border-zinc-700 rounded-xl py-2 text-white text-xl font-bold focus:outline-none focus:border-teal-600"
                  />
                  <button
                    onClick={() => adjustAge('ageMax', 1)}
                    className="w-9 h-9 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-zinc-500 text-xs text-center mt-3">{form.ageMin}歳 〜 {form.ageMax}歳</p>
            {errors.age && <p className="text-red-400 text-xs mt-2">{errors.age}</p>}
          </div>

          {/* 希望居住エリア */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-sm">
                希望居住エリア
                <span className="text-zinc-500 font-normal ml-1">（複数選択可）</span>
              </h2>
              <span className="text-teal-400 text-xs bg-teal-900/40 px-2 py-0.5 rounded-full border border-teal-800">
                {form.prefectures.length}件選択中
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PREFECTURES.map(pref => {
                const selected = form.prefectures.includes(pref);
                return (
                  <button
                    key={pref}
                    onClick={() => togglePrefecture(pref)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selected
                        ? 'bg-teal-700 border border-teal-500 text-teal-100'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {pref}
                  </button>
                );
              })}
            </div>
            {errors.prefectures && <p className="text-red-400 text-xs mt-3">{errors.prefectures}</p>}
          </div>

          {/* 重視したいこと */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-white font-bold text-sm mb-1">
              重視したいこと
              <span className="text-zinc-500 font-normal ml-1">（優先度順にタップ）</span>
            </h2>
            <p className="text-zinc-500 text-xs mb-4">タップした順に優先度が設定されます。再タップで解除できます。</p>
            <div className="flex flex-wrap gap-3">
              {PRIORITY_ITEMS.map(item => {
                const rank = form.priorities.indexOf(item.id);
                const selected = rank !== -1;
                return (
                  <button
                    key={item.id}
                    onClick={() => togglePriority(item.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selected
                        ? 'bg-teal-800 border border-teal-600 text-white'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {selected && (
                      <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                        {rank + 1}
                      </span>
                    )}
                    {item.label}
                  </button>
                );
              })}
            </div>
            {errors.priorities && <p className="text-red-400 text-xs mt-3">{errors.priorities}</p>}
          </div>

          {/* NG条件 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-white font-bold text-sm mb-4">
              NG条件
              <span className="text-zinc-500 font-normal ml-1">（任意）</span>
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {NG_CONDITIONS.map(ng => {
                const checked = form.ngConditions.includes(ng.id);
                return (
                  <button
                    key={ng.id}
                    onClick={() => toggleNG(ng.id)}
                    className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm transition-all text-left ${
                      checked
                        ? 'bg-red-950/50 border border-red-800 text-red-300'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                      checked ? 'bg-red-700 border-red-600' : 'bg-zinc-700 border-zinc-600'
                    }`}>
                      {checked && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    {ng.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 一言メッセージ */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-white font-bold text-sm mb-1">
              一言メッセージ
              <span className="text-zinc-500 font-normal ml-1">（任意）</span>
            </h2>
            <p className="text-zinc-500 text-xs mb-3">特別な希望や補足があれば自由にお書きください</p>
            <textarea
              value={form.message}
              onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
              maxLength={210}
              rows={4}
              placeholder="例：共通の趣味がある方、穏やかな方が好みです..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-teal-600 resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              {errors.message
                ? <p className="text-red-400 text-xs">{errors.message}</p>
                : <span />
              }
              <p className={`text-xs ${form.message.length > 180 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {form.message.length} / 200
              </p>
            </div>
          </div>

          <button
            onClick={handleNext}
            className="w-full py-3.5 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            確認画面へ <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ステップ2：確認画面 */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5">
            <h2 className="text-white font-bold text-sm">入力内容の確認</h2>

            <div>
              <p className="text-zinc-500 text-xs mb-1.5">希望年齢範囲</p>
              <p className="text-white text-sm font-medium">{form.ageMin}歳 〜 {form.ageMax}歳</p>
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <p className="text-zinc-500 text-xs mb-2">希望居住エリア（{form.prefectures.length}件）</p>
              <div className="flex flex-wrap gap-1.5">
                {form.prefectures.map(p => (
                  <span key={p} className="px-2 py-0.5 bg-teal-900/40 border border-teal-800 rounded-md text-teal-300 text-xs">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <p className="text-zinc-500 text-xs mb-2">重視したいこと（優先度順）</p>
              <div className="flex flex-wrap gap-2">
                {form.priorities.map((id, i) => (
                  <span key={id} className="flex items-center gap-1.5 px-3 py-1 bg-teal-900/40 border border-teal-800 rounded-lg text-teal-300 text-xs">
                    <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    {PRIORITY_ITEMS.find(p => p.id === id)?.label}
                  </span>
                ))}
              </div>
            </div>

            {form.ngConditions.length > 0 && (
              <div className="border-t border-zinc-800 pt-4">
                <p className="text-zinc-500 text-xs mb-2">NG条件</p>
                <div className="flex flex-wrap gap-1.5">
                  {form.ngConditions.map(id => (
                    <span key={id} className="px-2 py-0.5 bg-red-950/40 border border-red-900 rounded-md text-red-300 text-xs">
                      {NG_CONDITIONS.find(n => n.id === id)?.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {form.message && (
              <div className="border-t border-zinc-800 pt-4">
                <p className="text-zinc-500 text-xs mb-1.5">一言メッセージ</p>
                <p className="text-zinc-300 text-sm leading-relaxed">{form.message}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-700 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> 修正する
            </button>
            <div className="flex-1 space-y-2">
              {submitError && <p className="text-red-400 text-sm text-center">{submitError}</p>}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '処理中...' : '決済へ進む'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ステップ3：完了画面 */}
      {step === 3 && (
        <div className="text-center py-10">
          <div className="w-20 h-20 bg-teal-900 border border-teal-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">申し込みが完了しました</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            ヒアリング内容を受け付けました。<br />
            審査後に運営よりご連絡いたします。<br />
            今しばらくお待ちください。
          </p>
          <div className="bg-amber-950/40 border border-amber-800 rounded-2xl p-4 mb-8 text-left">
            <p className="text-amber-300 text-xs leading-relaxed">
              <span className="font-semibold">審査について：</span>
              ご希望に合った候補者の確認とAIシステムの準備を行います。通常3〜5営業日以内にご連絡いたします。
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3.5 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-2xl transition-all"
          >
            ダッシュボードへ戻る
          </button>
        </div>
      )}
    </div>
  );
}
