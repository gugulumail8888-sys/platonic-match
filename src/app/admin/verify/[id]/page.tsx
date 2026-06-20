'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, ShieldCheck, ShieldX, Clock } from 'lucide-react';

// ============================================================
// Types
// ============================================================

type VerifyStatus = 'pending' | 'approved' | 'rejected';

interface VerifyDetail {
  id: string;
  nickname: string;
  age: number;
  gender: string | null;
  prefecture: string;
  createdAt: string;
  status: VerifyStatus;
  frontUrl: string | null;
  backUrl: string | null;
}

const STATUS_CONFIG: Record<VerifyStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending:  { label: '審査待ち', className: 'bg-amber-900/50 text-amber-300 border border-amber-800',  icon: Clock },
  approved: { label: '承認済み', className: 'bg-green-900/50 text-green-300 border border-green-800',  icon: ShieldCheck },
  rejected: { label: '否認',     className: 'bg-red-900/50 text-red-300 border border-red-800',        icon: ShieldX },
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-zinc-700/40 last:border-0">
      <span className="text-xs text-zinc-500 w-24 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-zinc-200">{value}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5">
      <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-1 h-3 bg-teal-500 rounded-full" />
        {title}
      </h3>
      {children}
    </div>
  );
}

// ============================================================
// Page
// ============================================================

export default function AdminVerifyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<VerifyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/verify/${params.id}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null) as { error?: string } | null;
          throw new Error(body?.error ?? '取得に失敗しました');
        }
        return res.json() as Promise<VerifyDetail>;
      })
      .then(setDetail)
      .catch((err) => setLoadError(err instanceof Error ? err.message : '取得に失敗しました'))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const handleDecision = async (status: 'approved' | 'rejected') => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/verify/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(body?.error ?? '更新に失敗しました');
      }
      router.push('/admin/verify');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-zinc-500">読み込み中...</div>;
  }

  if (loadError || !detail) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-400">{loadError ?? '対象が見つかりませんでした'}</p>
        <Link href="/admin/verify" className="text-teal-400 text-sm mt-2 inline-block hover:text-teal-300">
          ← 一覧に戻る
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[detail.status];

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-5">
      {/* 戻る */}
      <Link
        href="/admin/verify"
        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        一覧へ戻る
      </Link>

      {/* ===== ヘッダー ===== */}
      <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-6">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-white">{detail.nickname}</h1>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${statusCfg.className}`}>
            <statusCfg.icon className="w-3 h-3" />
            {statusCfg.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-zinc-400 mt-2">
          <span>{detail.age}歳</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-teal-500" />
            {detail.prefecture}
          </span>
          <span>·</span>
          <span>{detail.gender === 'male' ? '男性' : detail.gender === 'female' ? '女性' : '不明'}</span>
        </div>
        <p className="text-xs text-zinc-500 mt-1.5">
          登録日: {new Date(detail.createdAt).toLocaleDateString('ja-JP')} ／ ID: {detail.id}
        </p>
      </div>

      {/* ===== 本人確認書類 ===== */}
      <SectionCard title="本人確認書類">
        {detail.frontUrl || detail.backUrl ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {detail.frontUrl && (
              <div>
                <p className="text-xs text-zinc-500 mb-1.5">表面</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={detail.frontUrl} alt="本人確認書類（表面）" className="w-full rounded-xl border border-zinc-700" />
              </div>
            )}
            {detail.backUrl && (
              <div>
                <p className="text-xs text-zinc-500 mb-1.5">裏面</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={detail.backUrl} alt="本人確認書類（裏面）" className="w-full rounded-xl border border-zinc-700" />
              </div>
            )}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">書類が提出されていません</p>
        )}
      </SectionCard>

      {/* ===== 基本情報 ===== */}
      <SectionCard title="基本情報">
        <div className="space-y-0">
          <InfoRow label="ニックネーム" value={detail.nickname} />
          <InfoRow label="年齢"       value={`${detail.age}歳`} />
          <InfoRow label="性別"       value={detail.gender === 'male' ? '男性' : detail.gender === 'female' ? '女性' : '不明'} />
          <InfoRow label="居住地"     value={detail.prefecture} />
          <InfoRow label="登録日"     value={new Date(detail.createdAt).toLocaleDateString('ja-JP')} />
        </div>
      </SectionCard>

      {/* ===== 審査操作 ===== */}
      <SectionCard title="審査">
        {saveError && <p className="text-red-400 text-sm mb-3">{saveError}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleDecision('approved')}
            disabled={isSaving || detail.status === 'approved'}
            className="px-4 py-2 rounded-xl bg-green-900/40 border border-green-800 text-green-300 text-sm font-medium hover:bg-green-900/70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✓ 承認する
          </button>
          <button
            onClick={() => handleDecision('rejected')}
            disabled={isSaving || detail.status === 'rejected'}
            className="px-4 py-2 rounded-xl bg-red-900/30 border border-red-900 text-red-400 text-sm font-medium hover:bg-red-900/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            拒否する
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
