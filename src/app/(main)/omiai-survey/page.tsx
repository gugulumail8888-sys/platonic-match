'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClipboardCheck, Star, CheckCircle, AlertTriangle, Send, Loader2 } from 'lucide-react';

const IMPRESSION_OPTIONS = [
  { value: 'good',   label: '良い' },
  { value: 'normal', label: '普通' },
  { value: 'bad',    label: '合わなかった' },
] as const;

const MEET_AGAIN_OPTIONS = [
  { value: 'yes',         label: 'はい' },
  { value: 'no',          label: 'いいえ' },
  { value: 'considering', label: '検討中' },
] as const;

type ImpressionValue = typeof IMPRESSION_OPTIONS[number]['value'];
type MeetAgainValue = typeof MEET_AGAIN_OPTIONS[number]['value'];

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div>
      <p className="text-white font-bold text-sm mb-3">{label}</p>
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

function RadioGroup<T extends string>({
  options, value, onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T | '';
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <label
            key={opt.value}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
              selected
                ? 'border-teal-600 bg-teal-900/30 text-teal-300'
                : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800'
            }`}
          >
            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'border-teal-400' : 'border-zinc-600'}`}>
              {selected && <span className="w-2 h-2 rounded-full bg-teal-400 block" />}
            </span>
            <input
              type="radio"
              value={opt.value}
              checked={selected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

export default function OmiaiSurveyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchingId = searchParams.get('matchingId');

  const [omiaiSatisfaction, setOmiaiSatisfaction] = useState(0);
  const [partnerImpression, setPartnerImpression] = useState<ImpressionValue | ''>('');
  const [wantAgain, setWantAgain] = useState<MeetAgainValue | ''>('');
  const [serviceSatisfaction, setServiceSatisfaction] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const isValid =
    omiaiSatisfaction > 0 &&
    partnerImpression !== '' &&
    wantAgain !== '' &&
    serviceSatisfaction > 0;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/omiai-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchingId,
          omiaiSatisfaction,
          partnerImpression,
          wantToMeetAgain: wantAgain,
          serviceSatisfaction,
          comment,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error ?? 'アンケートの送信に失敗しました');
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'アンケートの送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 送信完了 ──
  if (done) {
    return (
      <div className="p-6 md:p-8 max-w-xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-teal-900 border border-teal-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-teal-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">ご回答ありがとうございました</h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          いただいたご意見は、今後のサービス向上に活用させていただきます。
        </p>
        <button
          onClick={() => router.push('/matching')}
          className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-medium transition-all"
        >
          マッチング一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-teal-900/40 border border-teal-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <ClipboardCheck className="w-8 h-8 text-teal-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">お見合い後アンケート</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          お見合いお疲れさまでした。<br />
          今後のマッチング向上のため、簡単なアンケートにご協力ください。
        </p>
      </div>

      <div className="space-y-5">
        {/* 1. お見合いの満足度 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <StarRating
            value={omiaiSatisfaction}
            onChange={setOmiaiSatisfaction}
            label="今回のお見合いに満足しましたか？"
          />
        </div>

        {/* 2. 相手への印象 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-3">お相手への印象はいかがでしたか？</h2>
          <RadioGroup options={IMPRESSION_OPTIONS} value={partnerImpression} onChange={setPartnerImpression} />
        </div>

        {/* 3. 再度お見合いしたいか */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-3">またお見合いしたいと思いますか？</h2>
          <RadioGroup options={MEET_AGAIN_OPTIONS} value={wantAgain} onChange={setWantAgain} />
        </div>

        {/* 4. サービスへの満足度 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <StarRating
            value={serviceSatisfaction}
            onChange={setServiceSatisfaction}
            label="amistaのサービスにご満足いただけましたか？"
          />
        </div>

        {/* 5. ご意見・ご感想 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-1">
            ご意見・ご感想
            <span className="text-zinc-500 font-normal ml-1">（任意）</span>
          </h2>
          <p className="text-zinc-500 text-xs mb-3">今後のサービス改善のため、ご意見・ご感想をお聞かせください</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="例：スタッフの対応が丁寧で、安心してお見合いに参加できました..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-teal-600 resize-none"
          />
          <p className={`text-xs text-right mt-1 ${comment.length > 450 ? 'text-amber-400' : 'text-zinc-500'}`}>
            {comment.length} / 500
          </p>
        </div>

        {/* エラー */}
        {error && (
          <div className="flex items-start gap-3 bg-red-950/50 border border-red-800 rounded-2xl p-4">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className={`w-full py-3.5 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all ${
            isValid && !submitting
              ? 'bg-teal-700 hover:bg-teal-600 text-white'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> 送信中...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> アンケートを送信する
            </>
          )}
        </button>
      </div>
    </div>
  );
}
