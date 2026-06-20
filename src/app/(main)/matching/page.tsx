'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, ClipboardList, Users, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

type ApplicationStatus = 'pending' | 'scheduling' | 'completed' | 'zoom_completed' | 'cancelled' | 'rejected';

interface PartnerProfile {
  id: string;
  nickname: string;
  birth_date: string;
  prefecture: string;
  occupation: string;
  avatar_url: string | null;
}

interface Matching {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  applicant_id: string;
  partner_id: string;
  applicant_dating_wish: boolean;
  partner: PartnerProfile;
  hasSlots: boolean;
}

function calcAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; className: string }> = {
  pending: {
    label: '申請中',
    className: 'bg-amber-900/50 text-amber-300 border border-amber-800',
  },
  scheduling: {
    label: '日程調整中',
    className: 'bg-blue-900/50 text-blue-300 border border-blue-800',
  },
  completed: {
    label: '完了',
    className: 'bg-green-900/50 text-green-300 border border-green-800',
  },
  zoom_completed: {
    label: 'Google Meet完了',
    className: 'bg-blue-900 text-blue-300',
  },
  cancelled: {
    label: 'キャンセル済み',
    className: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
  },
  rejected: {
    label: 'お断り',
    className: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
  },
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${className}`}>
      {label}
    </span>
  );
}

function MatchingCard({ matching, currentUserId }: { matching: Matching; currentUserId: string }) {
  const router = useRouter();
  const [wished, setWished] = useState(matching.applicant_dating_wish);
  const [responding, setResponding] = useState(false);

  async function handleDatingWish() {
    const supabase = createClient();
    const { error } = await supabase
      .from('matchings')
      .update({ applicant_dating_wish: true, dating_wish_at: new Date().toISOString() })
      .eq('id', matching.id);
    if (!error) setWished(true);
  }

  async function handleApprove() {
    setResponding(true);
    await fetch('/api/matching/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchingId: matching.id }),
    });
    window.location.reload();
  }

  async function handleReject() {
    if (!window.confirm('このお見合い申請をお断りしますか？')) return;
    setResponding(true);
    await fetch('/api/matching/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchingId: matching.id }),
    });
    window.location.reload();
  }

  const isReceiver = matching.partner_id === currentUserId;
  const { partner, status, created_at, id } = matching;

  return (
    <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5 hover:border-zinc-600 transition-all">
      {/* 上段: アバター + メンバー情報 + ステータス */}
      <div className="flex items-start gap-3">
        {partner.avatar_url ? (
          <img
            src={partner.avatar_url}
            alt={partner.nickname}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-teal-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 select-none">
            {partner.nickname.charAt(0)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-white font-semibold text-base">{partner.nickname}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-400 mt-0.5">
                <span>{calcAge(partner.birth_date)}歳</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-teal-500" />
                  {partner.prefecture}
                </span>
                <span>{partner.occupation}</span>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>
        </div>
      </div>

      {/* 区切り線 */}
      <div className="border-t border-zinc-700 my-4" />

      {/* 下段: 申請日・申請番号・料金 */}
      <div className={`grid gap-2 text-xs ${isReceiver ? 'grid-cols-2' : 'grid-cols-3'}`}>
        <div>
          <p className="text-zinc-500 mb-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            申請日
          </p>
          <p className="text-zinc-200 font-medium">
            {new Date(created_at).toLocaleDateString('ja-JP')}
          </p>
        </div>
        <div>
          <p className="text-zinc-500 mb-0.5 flex items-center gap-1">
            <ClipboardList className="w-3 h-3" />
            申請番号
          </p>
          <p className="text-zinc-200 font-mono font-medium">{id.slice(0, 8).toUpperCase()}</p>
        </div>
        {!isReceiver && (
          <div>
            <p className="text-zinc-500 mb-0.5">料金</p>
            <p className="text-zinc-200 font-medium">
              無料プラン ¥3,500・AIおすすめプラン ¥3,000
              <span className="text-zinc-500 font-normal">（税込）</span>
            </p>
          </div>
        )}
      </div>

      {/* ボタンエリア */}
      <div className="mt-4 flex flex-col gap-2">
        {/* 承認・拒否ボタン（申請中かつ自分がお相手の場合のみ） */}
        {status === 'pending' && isReceiver && (
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={responding}
              className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              承認する
            </button>
            <button
              onClick={handleReject}
              disabled={responding}
              className="flex-1 py-2.5 rounded-xl border border-red-900 text-red-400 text-sm font-semibold hover:bg-red-950/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              お断りする
            </button>
          </div>
        )}

        {/* 交際希望ボタン（Google Meet完了時のみ） */}
        {status === 'zoom_completed' && (
          <button
            onClick={handleDatingWish}
            disabled={wished}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all w-full ${
              wished
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                : 'bg-pink-700 hover:bg-pink-600 text-white'
            }`}
          >
            {wished ? '交際希望を送りました ✓' : '💑 交際希望を伝える'}
          </button>
        )}

        {/* 日程調整ボタン（日程調整中のみ・役割で分岐） */}
        {status === 'scheduling' && (
          isReceiver ? (
            matching.hasSlots ? (
              <Link
                href={`/schedule/select?id=${id}&name=${encodeURIComponent(partner.nickname)}`}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md hover:scale-[1.02]"
                style={{ background: 'linear-gradient(to right, #ec4899, #a855f7)' }}
              >
                📅 日程を選ぶ
              </Link>
            ) : (
              <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-700 text-zinc-400 cursor-not-allowed">
                ⏳ 相手が候補日を提案中
              </div>
            )
          ) : (
            matching.hasSlots ? (
              <div className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-700 text-zinc-400 cursor-not-allowed">
                ⏳ 相手の返答待ち
              </div>
            ) : (
              <Link
                href={`/schedule/request?id=${id}&name=${encodeURIComponent(partner.nickname)}`}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md hover:scale-[1.02]"
                style={{ background: 'linear-gradient(to right, #ec4899, #a855f7)' }}
              >
                📅 候補日を提案する
              </Link>
            )
          )
        )}

        {/* プロフィールリンク */}
        <Link
          href={`/members/${partner.id}`}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-600 text-zinc-400 text-xs hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
        >
          プロフィールを見る
        </Link>

        {/* キャンセル・変更ボタン */}
        {!isReceiver && (status === 'pending' || status === 'scheduling' || status === 'completed') && (
          <button
            onClick={() => router.push(`/cancel-report?applicationId=${matching.id}`)}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-900 text-red-500 text-xs hover:bg-red-950/50 hover:border-red-800 transition-colors w-full"
          >
            キャンセル・変更を申請する
          </button>
        )}
      </div>
    </div>
  );
}

export default function MatchingPage() {
  const [matchings, setMatchings] = useState<Matching[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    async function fetchMatchings() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setCurrentUserId(user.id);

      const { data: rows, error } = await supabase
        .from('matchings')
        .select('id, status, created_at, applicant_id, partner_id, applicant_dating_wish')
        .or(`applicant_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      console.log('matchings:', rows, 'error:', error);

      if (!rows || rows.length === 0) { setLoading(false); return; }

      const partnerUserIds = rows.map((r) =>
        r.applicant_id === user.id ? r.partner_id : r.applicant_id
      );

      console.log('partnerUserIds:', partnerUserIds);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname, birth_date, prefecture, occupation, avatar_url')
        .in('id', partnerUserIds);

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      const combined: Matching[] = rows
        .map((r) => {
          const partnerUserId = r.applicant_id === user.id ? r.partner_id : r.applicant_id;
          const partner = profileMap.get(partnerUserId);
          if (!partner) return null;
          return { ...r, partner, hasSlots: false } as Matching;
        })
        .filter((r): r is Matching => r !== null);

      setMatchings(combined);
      setLoading(false);

      // 日程調整中のマッチングのみ、候補日程の有無を確認
      const schedulingIds = combined.filter((m) => m.status === 'scheduling').map((m) => m.id);
      if (schedulingIds.length === 0) return;

      const slotResults = await Promise.all(
        schedulingIds.map(async (matchingId) => {
          try {
            const res = await fetch(`/api/schedule/slots?matchingId=${matchingId}`);
            const slots = await res.json();
            return { matchingId, hasSlots: Array.isArray(slots) && slots.length > 0 };
          } catch {
            return { matchingId, hasSlots: false };
          }
        })
      );

      const hasSlotsMap = new Map(slotResults.map((r) => [r.matchingId, r.hasSlots]));
      setMatchings((prev) =>
        prev.map((m) => (hasSlotsMap.has(m.id) ? { ...m, hasSlots: hasSlotsMap.get(m.id)! } : m))
      );
    }

    fetchMatchings();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-teal-900/50 border border-teal-800 rounded-xl flex items-center justify-center flex-shrink-0">
          <HeartHandshake className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">お見合い申請履歴</h1>
          <p className="text-xs text-zinc-400">
            {loading ? '読み込み中...' : `${matchings.length}件の申請があります`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-500">読み込み中...</div>
      ) : matchings.length > 0 ? (
        <div className="space-y-4">
          {matchings.map((m) => (
            <MatchingCard key={m.id} matching={m} currentUserId={currentUserId} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center mx-auto mb-5">
            <HeartHandshake className="w-9 h-9 text-zinc-600" />
          </div>
          <h2 className="text-lg font-semibold text-zinc-300 mb-2">
            まだ申請がありません
          </h2>
          <p className="text-zinc-500 text-sm mb-6">
            会員一覧からお気に入りの方へ<br />
            お見合いを申請してみましょう！
          </p>
          <Link href="/members">
            <Button>
              <Users className="w-4 h-4" />
              会員一覧を見る
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
