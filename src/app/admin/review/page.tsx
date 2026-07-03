export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { User } from 'lucide-react';

type Profile = {
  id: string;
  nickname: string;
  birth_date: string;
  gender: string;
  prefecture: string;
  occupation: string;
  avatar_url: string | null;
  status: string;
  created_at: string;
  admin_notes: string | null;
  profile_reviewed_at: string | null;
};

function calcAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const adminSupabase = createAdminClient();

  const { data: allProfiles } = await adminSupabase
    .from('profiles')
    .select(
      'id, nickname, birth_date, gender, prefecture, occupation, avatar_url, status, created_at, admin_notes, profile_reviewed_at'
    );

  const profiles = (allProfiles ?? []) as Profile[];

  const unreviewed = profiles.filter((p) => p.profile_reviewed_at === null);
  const reviewed = profiles.filter((p) => p.profile_reviewed_at !== null);

  const tab = searchParams.tab === 'reviewed' ? 'reviewed' : 'unreviewed';
  const displayed = tab === 'reviewed' ? reviewed : unreviewed;

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">プロフィール管理</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          未確認 {unreviewed.length} 件 ／ 確認済み {reviewed.length} 件
        </p>
      </div>

      {/* タブ */}
      <div className="flex gap-2 border-b border-zinc-800">
        <Link
          href="/admin/review?tab=unreviewed"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'unreviewed'
              ? 'border-teal-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          未確認 ({unreviewed.length})
        </Link>
        <Link
          href="/admin/review?tab=reviewed"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'reviewed'
              ? 'border-teal-500 text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          確認済み ({reviewed.length})
        </Link>
      </div>

      {/* テーブル */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="border-b border-zinc-800">
              <tr>
                {['会員', '年齢', '性別', '居住地', '職業', '登録日', '手動確認状況', '操作'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs text-zinc-400 font-medium uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                    該当する会員が見つかりませんでした
                  </td>
                </tr>
              ) : (
                displayed.map((profile) => (
                  <tr key={profile.id} className="hover:bg-zinc-800/50 transition-colors">
                    {/* 会員（アバター+ニックネーム） */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/review/${profile.id}`}
                        className="flex items-center gap-2.5 group"
                      >
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.nickname}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-zinc-400" />
                          </div>
                        )}
                        <span className="text-zinc-100 font-medium group-hover:text-teal-400 transition-colors">
                          {profile.nickname}
                        </span>
                      </Link>
                    </td>

                    {/* 年齢 */}
                    <td className="px-4 py-3 text-zinc-400 text-xs">{calcAge(profile.birth_date)}歳</td>

                    {/* 性別 */}
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {profile.gender === 'male' ? '男性' : profile.gender === 'female' ? '女性' : 'その他'}
                    </td>

                    {/* 居住地 */}
                    <td className="px-4 py-3 text-zinc-400 text-xs">{profile.prefecture}</td>

                    {/* 職業 */}
                    <td className="px-4 py-3 text-zinc-400 text-xs">{profile.occupation}</td>

                    {/* 登録日 */}
                    <td className="px-4 py-3 text-zinc-400 text-xs">
                      {new Date(profile.created_at).toLocaleDateString('ja-JP')}
                    </td>

                    {/* 手動確認状況 */}
                    <td className="px-4 py-3">
                      {profile.profile_reviewed_at ? (
                        <span className="text-xs bg-teal-900/50 text-teal-400 border border-teal-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                          確認済み（{new Date(profile.profile_reviewed_at).toLocaleDateString('ja-JP')}）
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-900/50 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full">
                          未確認
                        </span>
                      )}
                    </td>

                    {/* 操作 */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/review/${profile.id}`}
                        className="text-xs px-2.5 py-1 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors inline-block"
                      >
                        詳細
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
