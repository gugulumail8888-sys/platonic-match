'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Video, AlertTriangle, CheckCircle, Check } from 'lucide-react';

const RULES = [
  { id: 1, text: 'LINEや電話番号など、連絡先の交換をしない' },
  { id: 2, text: 'SNSアカウント（Instagram・X・Facebookなど）の交換をしない' },
  { id: 3, text: '住所・職場など個人が特定できる情報を伝えない' },
  { id: 4, text: '画面の録画・スクリーンショット・通話内容の録音をしない' },
  { id: 5, text: '金銭・物品の要求・贈与をしない' },
  { id: 6, text: '交際を希望する場合は必ずサイト内の「交際希望」ボタンから申請する' },
  { id: 7, text: 'わいせつ画像・性的コンテンツ・不適切な画像データの送受信や共有をしない' },
  { id: 9, text: '暴言・誹謗中傷・ハラスメントに該当する言動をしない' },
  { id: 10, text: 'お見合い時間（40分）を超えた延長の依頼はご遠慮ください' },
  { id: 8, text: '違反が確認された場合はまず警告を行います。ただし、わいせつ・性的コンテンツ等の重大な違反、または悪質・繰り返しの違反があった場合は即時アカウント停止・以降の利用禁止となることに同意する' },
];

interface MatchingJoinInfo {
  zoom_url: string | null;
  status: string;
  meeting_ended_at: string | null;
  nickname: string | null;
}

function MessageScreen({ message }: { message: string }) {
  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto text-center">
      <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
      <p className="text-zinc-300 text-sm">{message}</p>
    </div>
  );
}

export default function ZoomCheckClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const matchingId = searchParams.get('matchingId');

  const [checked, setChecked] = useState<number[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [matchingInfo, setMatchingInfo] = useState<MatchingJoinInfo | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!matchingId) {
      setLoadError('お見合い情報が見つかりません');
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/matching/join?matchingId=${matchingId}`);
        if (!res.ok) {
          setLoadError('このお見合いは見つかりません');
          return;
        }
        const data = await res.json() as MatchingJoinInfo;
        setMatchingInfo(data);
      } catch (e) {
        console.error('matching情報取得エラー:', e);
        setLoadError('このお見合いは見つかりません');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [matchingId]);

  const toggleCheck = (id: number) => {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const allChecked = checked.length === RULES.length;

  const handleJoin = async () => {
    if (!matchingId || !matchingInfo?.zoom_url) return;
    setIsJoining(true);
    setJoinError(null);
    try {
      const consentRes = await fetch('/api/zoom-check/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchingId }),
      });
      if (!consentRes.ok) {
        setJoinError('同意記録の保存に失敗しました');
        return;
      }

      const joinRes = await fetch('/api/matching/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchingId }),
      });
      if (!joinRes.ok) {
        setJoinError('入室記録の保存に失敗しました');
        return;
      }

      window.open(matchingInfo.zoom_url, '_blank');
      router.push('/matching');
    } catch (e) {
      console.error('join処理エラー:', e);
      setJoinError('処理に失敗しました。もう一度お試しください。');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-zinc-400 text-sm">読み込み中...</p>
      </div>
    );
  }

  if (loadError || !matchingInfo) {
    return <MessageScreen message={loadError ?? 'このお見合いは見つかりません'} />;
  }

  if (matchingInfo.meeting_ended_at !== null) {
    return <MessageScreen message="このお見合いは既に終了しています" />;
  }

  if (matchingInfo.status !== 'zoom_completed') {
    return <MessageScreen message="まだお見合いの準備が整っていません" />;
  }

  const partnerName = matchingInfo.nickname ?? 'お相手';

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-900 border border-blue-800 rounded-xl flex items-center justify-center">
          <Video className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">お見合い中の注意事項</h1>
          <p className="text-xs text-zinc-400">{partnerName}さんとのお見合い</p>
        </div>
      </div>

      {/* 警告バナー */}
      <div className="flex items-start gap-3 bg-amber-950/50 border border-amber-800 rounded-2xl p-4 mb-6">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-300 font-medium text-sm mb-1">参加前に必ずご確認ください</p>
          <p className="text-amber-400/80 text-xs leading-relaxed">
            amistaでは会員の安全を守るため、Google Meet中の直接連絡先交換を禁止しています。
            以下の注意事項をすべて確認し、同意した上でご参加ください。
          </p>
        </div>
      </div>

      {/* 注意事項チェックリスト */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          禁止事項・注意事項
        </h2>
        <div className="space-y-3">
          {RULES.map((rule) => {
            const isChecked = checked.includes(rule.id);
            return (
              <button
                key={rule.id}
                onClick={() => toggleCheck(rule.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left ${
                  isChecked
                    ? 'bg-teal-950/50 border-teal-800'
                    : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all ${
                  isChecked
                    ? 'bg-teal-500 border-teal-500'
                    : 'border-zinc-600'
                }`}>
                  {isChecked && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-sm leading-relaxed ${isChecked ? 'text-teal-300' : 'text-zinc-300'}`}>
                  {rule.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* 全チェック確認 */}
        <div className="mt-4 pt-4 border-t border-zinc-700">
          {allChecked ? (
            <div className="flex items-center gap-2 text-teal-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              すべての項目を確認しました
            </div>
          ) : (
            <p className="text-zinc-500 text-xs">
              ※ すべての項目にチェックを入れてください（{checked.length}/{RULES.length}）
            </p>
          )}
        </div>
      </div>

      {/* 最終同意 */}
      <button
        onClick={() => setAgreed(!agreed)}
        className={`w-full flex items-start gap-3 p-4 rounded-2xl border transition-all mb-3 text-left ${
          agreed
            ? 'bg-teal-950/50 border-teal-700'
            : 'bg-zinc-900 border-zinc-700 hover:border-zinc-600'
        }`}
      >
        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all ${
          agreed ? 'bg-teal-500 border-teal-500' : 'border-zinc-600'
        }`}>
          {agreed && <Check className="w-3 h-3 text-white" />}
        </div>
        <span className={`text-sm leading-relaxed ${agreed ? 'text-teal-300' : 'text-zinc-300'}`}>
          上記の注意事項をすべて読み、内容を理解した上で同意します。
          違反した場合はアカウント停止等の措置を受けることに同意します。
        </span>
      </button>

      <p className="text-xs text-zinc-500 mb-6">
        ※ この同意内容は日時とともに記録され、同意書としてお相手との間で
        問題が生じた際の確認資料となります。
      </p>

      {/* ボタン */}
      <div className="space-y-3">
        {joinError && (
          <p className="text-red-400 text-sm text-center">{joinError}</p>
        )}
        <button
          disabled={!allChecked || !agreed || isJoining}
          onClick={handleJoin}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-colors ${
            allChecked && agreed && !isJoining
              ? 'bg-teal-600 hover:bg-teal-500 text-white'
              : 'bg-teal-600 text-white opacity-40 cursor-not-allowed'
          }`}
        >
          <Video className="w-5 h-5" />
          同意してGoogle Meetに参加する
        </button>
        <button
          onClick={() => router.back()}
          className="w-full py-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          戻る
        </button>
      </div>

      {/* 注意書き */}
      <p className="text-center text-xs text-zinc-600 mt-6 leading-relaxed">
        連絡先交換は必ず運営を通じて行ってください。<br />
        交際希望の場合はサイト内の「交際希望」ボタンをご利用ください。
      </p>
    </div>
  );
}
