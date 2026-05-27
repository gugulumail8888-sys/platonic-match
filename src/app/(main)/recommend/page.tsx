'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bot, Sparkles, MapPin, Briefcase, ChevronRight, Loader2, AlertCircle, TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MALE_MEMBERS, MemberDetail } from '../members/_data';

// ============================================================
// ログインユーザー（さくら）のプロフィール
// TODO: Supabase連携後はセッションから取得する
// ============================================================

const MY_PROFILE = {
  nickname: 'さくら',
  age: 30,
  prefecture: '東京都',
  occupation: 'OL',
  hobbies:
    '読書が大好きで、毎月5冊以上は読んでいます。カフェ巡りも趣味で、休日は気になったカフェを巡っています。映画も好きで、特にフランス映画が好みです。',
  marriageTiming: '1〜2年以内',
  childrenDesire: 'ほしい',
  desiredConditions:
    '価値観が合う方を探しています。外見よりも中身を大切にしてくれる方、一緒にいて落ち着ける方が理想です。年齢は28〜38歳くらいの方。',
};

// ============================================================
// Types
// ============================================================

interface RecommendResult extends MemberDetail {
  score: number;
  reason: string;
}

// ============================================================
// Sub-components
// ============================================================

function ScoreBar({ score }: { score: number }) {
  const barColor =
    score >= 80
      ? 'bg-teal-500'
      : score >= 60
      ? 'bg-teal-600'
      : score >= 40
      ? 'bg-amber-500'
      : 'bg-zinc-500';
  const textColor =
    score >= 80
      ? 'text-teal-400'
      : score >= 60
      ? 'text-teal-500'
      : score >= 40
      ? 'text-amber-400'
      : 'text-zinc-400';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-zinc-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xl font-bold tabular-nums w-10 text-right ${textColor}`}>
        {score}
      </span>
    </div>
  );
}

function ResultCard({ member, rank }: { member: RecommendResult; rank: number }) {
  const rankBg =
    rank === 1
      ? 'bg-amber-500 text-amber-950'
      : rank === 2
      ? 'bg-zinc-400 text-zinc-900'
      : rank === 3
      ? 'bg-amber-700 text-amber-100'
      : 'bg-zinc-700 text-zinc-300';

  return (
    <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5 flex flex-col gap-4 hover:border-zinc-600 transition-all">
      {/* ヘッダー: アバター + 名前 + ランク */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl select-none"
            style={{ background: member.avatarColor }}
          >
            {member.initials}
          </div>
          <span
            className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${rankBg}`}
          >
            {rank}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-base mb-0.5">{member.nickname}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-teal-500" />
              {member.prefecture}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-teal-500" />
              {member.occupation}
            </span>
            <span>{member.age}歳</span>
          </div>
        </div>
      </div>

      {/* スコアバー */}
      <ScoreBar score={member.score} />

      {/* AIコメント */}
      <p className="text-zinc-300 text-sm leading-relaxed border-l-2 border-teal-700 pl-3">
        {member.reason}
      </p>

      {/* プロフィールボタン */}
      <Link
        href={`/members/${member.id}`}
        className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-600 text-zinc-300 text-sm hover:bg-zinc-700 hover:border-zinc-500 transition-colors"
      >
        プロフィールを見る
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function RecommendPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [results, setResults] = useState<RecommendResult[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  const handleAnalyze = async () => {
    setStatus('loading');
    setErrorMsg('');
    setIsDemo(false);

    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          myProfile: MY_PROFILE,
          candidates: MALE_MEMBERS,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json() as {
        candidates: { id: number; score: number; reason: string }[];
        isDemo?: boolean;
      };

      // スコアとメンバーデータをマージしてスコア降順でソート
      const merged: RecommendResult[] = data.candidates
        .map((c) => {
          const member = MALE_MEMBERS.find((m) => m.id === c.id);
          if (!member) return null;
          return { ...member, score: c.score, reason: c.reason };
        })
        .filter((m): m is RecommendResult => m !== null)
        .sort((a, b) => b.score - a.score);

      setResults(merged);
      setIsDemo(data.isDemo ?? false);
      setStatus('done');
    } catch (err) {
      console.error('Recommend error:', err);
      setErrorMsg('AI分析に失敗しました。しばらく待ってから再試行してください。');
      setStatus('error');
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* ページヘッダー */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-teal-900/50 border border-teal-800 rounded-xl flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">AIおすすめメンバー</h1>
          <p className="text-xs text-zinc-400">あなたのプロフィールを元にAIが最適なマッチを分析します</p>
        </div>
      </div>

      {/* 自分のプロフィールサマリー */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 mb-6 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: '#0d9488' }}
        >
          {MY_PROFILE.nickname[0]}
        </div>
        <div>
          <p className="text-white text-sm font-medium">
            {MY_PROFILE.nickname} さん（{MY_PROFILE.age}歳）
          </p>
          <p className="text-zinc-500 text-xs">
            {MY_PROFILE.prefecture} / {MY_PROFILE.occupation}
          </p>
        </div>
        <div className="ml-auto">
          <span className="text-xs bg-teal-900/50 text-teal-400 px-2 py-0.5 rounded-full border border-teal-800">
            分析対象
          </span>
        </div>
      </div>

      {/* ===== idle: 分析開始ボタン ===== */}
      {status === 'idle' && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-9 h-9 text-teal-500" />
          </div>
          <p className="text-zinc-400 text-sm mb-2">
            AIがあなたにぴったりのメンバーを分析します
          </p>
          <p className="text-zinc-600 text-xs mb-7">
            ※ 分析には少し時間がかかる場合があります（約30〜60秒）
          </p>
          <Button onClick={handleAnalyze} size="lg">
            <Bot className="w-5 h-5" />
            分析を開始する
          </Button>
        </div>
      )}

      {/* ===== loading: スピナー ===== */}
      {status === 'loading' && (
        <div className="text-center py-16">
          <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-white font-medium mb-1">AIが分析中...</p>
          <p className="text-zinc-500 text-sm">プロフィールを元に相性を計算しています</p>
        </div>
      )}

      {/* ===== error: エラー表示 ===== */}
      {status === 'error' && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-900/20 border border-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 font-medium mb-2">{errorMsg}</p>
          <Button onClick={handleAnalyze} variant="outline" className="mt-2">
            再試行する
          </Button>
        </div>
      )}

      {/* ===== done: 結果表示 ===== */}
      {status === 'done' && results.length > 0 && (
        <div>
          {/* デモモードバナー */}
          {isDemo && (
            <div className="flex items-start gap-2.5 bg-amber-950/50 border border-amber-800 rounded-xl px-4 py-3 mb-4">
              <TriangleAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300 text-sm leading-relaxed">
                <span className="font-semibold">※ 現在はデモ表示です。</span>
                {' '}本番環境ではAIが実際にプロフィールを分析してスコアを算出します。
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-zinc-400">
              <span className="text-teal-400 font-semibold">{results.length}名</span>
              {' '}の相性を分析しました（スコア高い順）
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
            >
              再分析する
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((m, i) => (
              <ResultCard key={m.id} member={m} rank={i + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
