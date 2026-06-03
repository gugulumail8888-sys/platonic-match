'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bot, Sparkles, MapPin, Briefcase, ChevronRight, Loader2, AlertCircle, TriangleAlert, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';


interface RecommendResult {
  id: string;
  nickname: string;
  prefecture: string;
  occupation: string;
  age: number;
  avatarColor: string;
  initials: string;
  score: number;
  reason: string;
}

function getAuthFromCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)auth=([^;]*)/);
  if (!match) return null;
  try { return JSON.parse(decodeURIComponent(match[1])); } catch { return null; }
}

function ScoreBar({ score }: { score: number }) {
  const barColor = score >= 80 ? 'bg-teal-500' : score >= 60 ? 'bg-teal-600' : score >= 40 ? 'bg-amber-500' : 'bg-zinc-500';
  const textColor = score >= 80 ? 'text-teal-400' : score >= 60 ? 'text-teal-500' : score >= 40 ? 'text-amber-400' : 'text-zinc-400';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-zinc-700 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xl font-bold w-12 text-right ${textColor}`}>{score}</span>
    </div>
  );
}

function BestMatchCard({ member }: { member: RecommendResult }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.3)]" style={{ background: 'linear-gradient(135deg, #134e4a 0%, #18181b 50%, #422006 100%)' }}>
      {/* 帯 */}
      <div className="flex items-center justify-center py-2 font-black text-sm text-black tracking-widest" style={{ background: 'linear-gradient(90deg, #ca8a04, #fde047, #ca8a04)' }}>
        ✨ No.1 BEST MATCH ✨
      </div>
      <div className="p-6 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl select-none ring-4 ring-yellow-400" style={{ background: member.avatarColor }}>
              {member.initials}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-2xl mb-1">{member.nickname}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-400">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{member.prefecture}</span>
              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{member.occupation}</span>
              <span>{member.age}歳</span>
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400">相性スコア</span>
            <span className="text-5xl font-black text-yellow-400">{member.score}</span>
          </div>
          <div className="w-full bg-zinc-700/60 rounded-full h-3 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${member.score}%`, background: 'linear-gradient(90deg, #ca8a04, #fde047)' }} />
          </div>
        </div>
        <p className="text-zinc-200 text-sm leading-relaxed border-l-2 border-yellow-500 pl-3">{member.reason}</p>
        <Link href={`/members/${member.id}`} className="flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold transition-colors text-black" style={{ background: 'linear-gradient(90deg, #ca8a04, #fde047, #ca8a04)' }}>
          プロフィールを見る <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function ResultCard({ member, rank }: { member: RecommendResult; rank: number }) {
  const rankBg = rank === 1 ? 'bg-amber-500 text-amber-900' : rank === 2 ? 'bg-zinc-400 text-zinc-900' : rank === 3 ? 'bg-amber-700 text-amber-100' : 'bg-zinc-700 text-zinc-300';
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-5 flex flex-col gap-4 hover:border-zinc-600 transition-all">
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl select-none" style={{ background: member.avatarColor }}>
            {member.initials}
          </div>
          <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${rankBg}`}>{rank}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-base mb-0.5">{member.nickname}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-400">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{member.prefecture}</span>
            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{member.occupation}</span>
            <span>{member.age}歳</span>
          </div>
        </div>
      </div>
      <ScoreBar score={member.score} />
      <p className="text-zinc-300 text-sm border-l-2 border-teal-700 pl-3">{member.reason}</p>
      <Link href={`/members/${member.id}`} className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-600 text-zinc-300 text-sm hover:border-zinc-500 transition-colors">
        プロフィールを見る <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default function RecommendPage() {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [results, setResults] = useState<RecommendResult[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const auth = getAuthFromCookie();
    setHasAccess(auth?.hasAiOption === true);
  }, []);

  const handleAnalyze = async () => {
    setStatus('loading');
    setErrorMsg('');
    setIsDemo(false);
    try {
      const res = await fetch('/api/ai/recommend', { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { candidates: RecommendResult[]; isDemo?: boolean };
      setResults(data.candidates ?? []);
      setIsDemo(data.isDemo ?? false);
      setStatus('done');
    } catch (err) {
      console.error('Recommend error:', err);
      setErrorMsg('AI分析に失敗しました。しばらく待ってから再試行してください。');
      setStatus('error');
    }
  };

  if (hasAccess === null) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>;
  }

  if (!hasAccess) {
    return (
      <div className="p-6 md:p-8 max-w-xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-9 h-9 text-zinc-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">AIおすすめはオプション機能です</h1>
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
          AIおすすめメンバー機能は有料オプションに加入した方のみご利用いただけます。<br />
          AIがあなたのプロフィールを分析し、相性の良いメンバーをご提案します。
        </p>
        <Button onClick={() => router.push('/mypage')}>オプションの詳細を見る</Button>
        <p className="mt-4">
          <Link href="/members" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">会員一覧に戻る</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">

      {status === 'idle' && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-9 h-9 text-teal-400" />
          </div>
          <p className="text-zinc-300 font-medium mb-2">AIがあなたにぴったりのメンバーを分析します</p>
          <p className="text-zinc-600 text-xs mb-7">※ 分析には少し時間がかかる場合があります（約30〜60秒）</p>
          <Button onClick={handleAnalyze}><Bot className="w-5 h-5" />分析を開始する</Button>
        </div>
      )}
      {status === 'loading' && (
        <div className="text-center py-16">
          <Loader2 className="w-12 h-12 text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-white font-medium mb-1">AIが分析中...</p>
          <p className="text-zinc-500 text-sm">あなたのプロフィールを元に相性を計算しています</p>
        </div>
      )}
      {status === 'error' && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-red-900/20 border border-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-400 font-medium mb-2">{errorMsg}</p>
          <Button onClick={handleAnalyze} className="mt-2">再試行する</Button>
        </div>
      )}
      {status === 'done' && results.length > 0 && (
        <div className="flex flex-col gap-6">
          {isDemo && (
            <div className="flex items-start gap-2.5 bg-amber-950/50 border border-amber-800 rounded-xl px-4 py-3">
              <TriangleAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-300 text-xs leading-relaxed">
                <span className="font-semibold">※ 現在はデモ表示です。</span>{' '}本番環境ではAIがスコアを算出します。
              </p>
            </div>
          )}

          {/* 最高相性エリア */}
          <div>
            <p className="text-xl font-bold text-yellow-400 mb-3">👑 ベストマッチ</p>
            <BestMatchCard member={results[0]} />
          </div>

          {/* その他のおすすめエリア */}
          {results.length > 1 && (
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">その他のおすすめ</p>
              <div className="grid gap-4">
                {results.slice(1).map((member, i) => <ResultCard key={member.id} member={member} rank={i + 2} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
