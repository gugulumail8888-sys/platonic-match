'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Star, CheckCircle, ChevronRight, SkipForward } from 'lucide-react';

const AI_OPTIONS = [
  { value: 'yes', label: 'はい' },
  { value: 'neutral', label: 'どちらでもない' },
  { value: 'no', label: 'いいえ' },
] as const;

const PERIOD_OPTIONS = [
  { value: '1month', label: '1ヶ月以内' },
  { value: '3months', label: '3ヶ月以内' },
  { value: '6months', label: '6ヶ月以内' },
  { value: '1year', label: '1年以内' },
  { value: 'over1year', label: '1年以上' },
] as const;

const DECIDING_FACTORS = [
  { id: 'values', label: '価値観' },
  { id: 'lifestyle', label: '生活スタイル' },
  { id: 'hobbies', label: '趣味' },
  { id: 'appearance', label: '外見' },
  { id: 'other', label: 'その他' },
] as const;

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div>
      <p className="text-zinc-400 text-xs mb-2">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hovered || value) ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'
              }`}
            />
          </button>
        ))}
        {value > 0 && <span className="text-amber-400 text-sm font-bold ml-2 self-center">{value} / 5</span>}
      </div>
    </div>
  );
}

export default function WithdrawalSurveyPage() {
  const router = useRouter();
  const [satisfaction, setSatisfaction] = useState(0);
  const [aiUseful, setAiUseful] = useState<string>('');
  const [period, setPeriod] = useState<string>('');
  const [factors, setFactors] = useState<string[]>([]);
  const [referral, setReferral] = useState(0);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  const toggleFactor = (id: string) => {
    setFactors(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    console.log('成婚アンケート:', {
      satisfaction,
      aiUseful,
      period,
      factors,
      referral,
      message,
    });
    setDone(true);
  };

  const handleSkip = () => {
    console.log('アンケートスキップして退会');
    setDone(true);
  };

  if (done) {
    return (
      <div className="p-6 md:p-8 max-w-xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-teal-900 border border-teal-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-teal-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">ご利用ありがとうございました</h2>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          退会処理が完了しました。<br />
          新しい生活が素晴らしいものになることを願っています。
        </p>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-2xl hover:bg-zinc-700 transition-all"
        >
          トップページへ
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-rose-900/40 border border-rose-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-rose-400 fill-rose-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">ご成婚おめでとうございます🎉</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          素晴らしいご縁に巡り合えたこと、スタッフ一同心よりお祝い申し上げます。<br />
          退会前に簡単なアンケートにご協力いただけると嬉しいです。
        </p>
      </div>

      <div className="space-y-5">

        {/* サービス満足度 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-4">サービス満足度</h2>
          <StarRating value={satisfaction} onChange={setSatisfaction} label="全体的な満足度を教えてください" />
        </div>

        {/* AI おすすめ機能 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-4">AIおすすめ機能は役に立ちましたか？</h2>
          <div className="flex gap-3">
            {AI_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setAiUseful(opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  aiUseful === opt.value
                    ? 'bg-teal-800 border-teal-600 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* マッチングまでの期間 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-4">マッチングまでにかかった期間</h2>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  period === opt.value
                    ? 'bg-teal-800 border-teal-600 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 決め手になったポイント */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-1">決め手になったポイント</h2>
          <p className="text-zinc-500 text-xs mb-4">複数選択可</p>
          <div className="flex flex-wrap gap-2">
            {DECIDING_FACTORS.map(f => {
              const selected = factors.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFactor(f.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    selected
                      ? 'bg-teal-800 border-teal-600 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {selected && <CheckCircle className="w-3.5 h-3.5 text-teal-300" />}
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 友人への紹介意向 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-4">友人への紹介意向</h2>
          <StarRating value={referral} onChange={setReferral} label="友人にこのサービスを勧めたいですか？" />
        </div>

        {/* 一言メッセージ */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-1">
            一言メッセージ
            <span className="text-zinc-500 font-normal ml-1">（任意）</span>
          </h2>
          <p className="text-zinc-500 text-xs mb-3">サービスへのご感想やスタッフへのメッセージをお気軽にどうぞ</p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={210}
            rows={4}
            placeholder="例：スタッフの対応が丁寧で安心して活動できました..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-teal-600 resize-none"
          />
          <p className={`text-xs text-right mt-1 ${message.length > 180 ? 'text-amber-400' : 'text-zinc-500'}`}>
            {message.length} / 200
          </p>
        </div>

        {/* ボタン */}
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
        >
          アンケートに答えて退会する <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={handleSkip}
          className="w-full py-3 bg-zinc-900 border border-zinc-700 text-zinc-400 rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all text-sm"
        >
          <SkipForward className="w-4 h-4" /> スキップして退会する
        </button>

        <p className="text-center text-xs text-zinc-600 pb-4">
          退会後はログインできなくなります。データはすべて削除されます。
        </p>
      </div>
    </div>
  );
}
