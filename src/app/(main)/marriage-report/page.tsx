'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Star, CheckCircle, ChevronRight } from 'lucide-react';

const MEETING_PERIOD_OPTIONS = [
  { value: '1month',   label: '1ヶ月以内' },
  { value: '3months',  label: '3ヶ月以内' },
  { value: '6months',  label: '6ヶ月以内' },
  { value: '1year',    label: '1年以内' },
  { value: 'over1year', label: '1年以上' },
] as const;

const TRIGGER_OPTIONS = [
  { value: 'ai',       label: 'AIおすすめで出会った' },
  { value: 'search',   label: '会員検索で見つけた' },
  { value: 'omiai',    label: 'お見合いを申請した' },
  { value: 'received', label: 'お見合いを受けた' },
  { value: 'other',    label: 'その他' },
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

export default function MarriageReportPage() {
  const router = useRouter();
  const [period, setPeriod] = useState('');
  const [trigger, setTrigger] = useState('');
  const [satisfaction, setSatisfaction] = useState(0);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!period || !trigger || !satisfaction) {
      alert('必須項目を入力してください');
      return;
    }
    try {
      const res = await fetch('/api/marriage-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period, trigger, satisfaction, message }),
      });
      if (!res.ok) throw new Error('送信失敗');
      setDone(true);
    } catch (e) {
      console.error(e);
      alert('送信に失敗しました。もう一度お試しください。');
    }
  };

  if (done) {
    return (
      <div className="p-6 md:p-8 max-w-xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-teal-900 border border-teal-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-teal-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">ご報告ありがとうございます</h2>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          末永くお幸せに！
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
    <div className="p-6 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-teal-900/40 border border-teal-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-teal-400 fill-teal-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">成婚報告アンケート</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          ご成婚おめでとうございます🎉<br />
          素晴らしいご縁に巡り合えたこと、スタッフ一同心よりお祝い申し上げます。<br />
          ぜひご報告とともに、簡単なアンケートにご協力ください。
        </p>
      </div>

      <div className="space-y-5">

        {/* お相手との出会い時期 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-4">お相手との出会いはいつですか？</h2>
          <div className="flex flex-wrap gap-2">
            {MEETING_PERIOD_OPTIONS.map(opt => (
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

        {/* 交際のきっかけ */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-4">交際のきっかけを教えてください</h2>
          <div className="flex flex-wrap gap-2">
            {TRIGGER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTrigger(opt.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  trigger === opt.value
                    ? 'bg-teal-800 border-teal-600 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* サービス満足度 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-4">サービス満足度</h2>
          <StarRating value={satisfaction} onChange={setSatisfaction} label="全体的な満足度を教えてください" />
        </div>

        {/* amistaへのメッセージ */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-1">
            amistaへのご感想・メッセージ
            <span className="text-zinc-500 font-normal ml-1">（任意）</span>
          </h2>
          <p className="text-zinc-500 text-xs mb-3">サービスへのご感想やスタッフへのメッセージをお気軽にどうぞ</p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={200}
            rows={4}
            placeholder="例：スタッフの対応が丁寧で安心して活動できました..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-teal-600 resize-none"
          />
          <p className={`text-xs text-right mt-1 ${message.length > 180 ? 'text-amber-400' : 'text-zinc-500'}`}>
            {message.length} / 200
          </p>
        </div>

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          className="w-full py-3.5 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
        >
          報告を送信する <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
