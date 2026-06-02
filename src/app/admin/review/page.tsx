export const dynamic = 'force-dynamic';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { CheckCircle, XCircle, User } from 'lucide-react';

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
};

function calcAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

async function updateStatus(formData: FormData) {
  'use server';
  const profileId = formData.get('profileId') as string;
  const status = formData.get('status') as string;
  const supabase = createAdminClient();
  await supabase
    .from('profiles')
    .update({ status })
    .eq('id', profileId);
  revalidatePath('/admin/review');
}

export default async function ReviewPage() {
  const adminSupabase = createAdminClient();

  // まず全件取得してみる（statusフィルターなし）
  const { data: allProfiles, error: allError } = await adminSupabase
    .from('profiles')
    .select('id, nickname, status, birth_date, gender, prefecture, occupation, created_at');

  console.log('ALL profiles:', JSON.stringify(allProfiles));
  console.log('ALL error:', JSON.stringify(allError));

  const pending = allProfiles?.filter((p) => p.status === 'pending') ?? [];
  const profiles = pending as Profile[];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">個別審査</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          審査待ち {profiles.length} 件
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-teal-500 mx-auto mb-3" />
          <p className="text-white font-medium">審査待ちのユーザーはいません</p>
          <p className="text-zinc-500 text-sm mt-1">すべての申請が処理済みです</p>
        </div>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >
              <div className="flex items-start gap-5">
                {/* アバター */}
                <div className="flex-shrink-0">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.nickname}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center">
                      <User className="w-8 h-8 text-zinc-400" />
                    </div>
                  )}
                </div>

                {/* 詳細 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-bold text-white">{profile.nickname}</h2>
                    <span className="text-xs bg-amber-900/50 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full">
                      審査待ち
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm mb-3">
                    <div>
                      <span className="text-zinc-500">年齢</span>
                      <span className="text-zinc-200 ml-2">{calcAge(profile.birth_date)}歳</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">性別</span>
                      <span className="text-zinc-200 ml-2">
                        {profile.gender === 'male' ? '男性' : profile.gender === 'female' ? '女性' : 'その他'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">居住地</span>
                      <span className="text-zinc-200 ml-2">{profile.prefecture}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">職業</span>
                      <span className="text-zinc-200 ml-2">{profile.occupation}</span>
                    </div>
                  </div>


                  <p className="text-xs text-zinc-600">
                    登録日: {new Date(profile.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>

                {/* 承認・否認ボタン */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <form action={updateStatus}>
                    <input type="hidden" name="profileId" value={profile.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-teal-700 hover:bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors w-full justify-center"
                    >
                      <CheckCircle className="w-4 h-4" />
                      承認
                    </button>
                  </form>
                  <form action={updateStatus}>
                    <input type="hidden" name="profileId" value={profile.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-red-900 hover:bg-red-800 text-red-200 text-sm font-medium px-4 py-2 rounded-xl transition-colors w-full justify-center"
                    >
                      <XCircle className="w-4 h-4" />
                      否認
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
