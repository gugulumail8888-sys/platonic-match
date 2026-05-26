import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { Users, Search, SlidersHorizontal } from "lucide-react";
import type { Profile } from "@/types";

export const metadata: Metadata = {
  title: "会員一覧",
};

interface SearchParams {
  gender?: string;
  prefecture?: string;
  age_min?: string;
  age_max?: string;
  page?: string;
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = Number(searchParams.page ?? 1);
  const perPage = 12;
  const offset = (page - 1) * perPage;

  // 会員一覧クエリ
  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .neq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (searchParams.gender) {
    query = query.eq("gender", searchParams.gender);
  }
  if (searchParams.prefecture) {
    query = query.eq("prefecture", searchParams.prefecture);
  }

  const { data: members, count } = await query;

  // 自分がいいねした会員IDリスト
  const { data: myLikes } = await supabase
    .from("likes")
    .select("receiver_id")
    .eq("sender_id", user!.id);

  const likedIds = new Set(myLikes?.map((l) => l.receiver_id) ?? []);
  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary-500" />
          会員一覧
        </h1>
        <p className="text-gray-500 text-sm">
          {count ?? 0}人の会員が登録しています
        </p>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white rounded-2xl p-4 shadow-card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ニックネームで検索..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
            />
          </div>

          <div className="flex gap-3">
            <select className="flex-1 sm:flex-none bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-600 outline-none border-0 cursor-pointer">
              <option value="">性別を選択</option>
              <option value="male">男性</option>
              <option value="female">女性</option>
            </select>

            <button className="flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-100 transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              絞り込み
            </button>
          </div>
        </div>
      </div>

      {/* 会員グリッド */}
      {members && members.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {(members as Profile[]).map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isLiked={likedIds.has(profile.user_id)}
                showLikeButton={true}
              />
            ))}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/members?page=${p}`}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                    p === page
                      ? "bg-gradient-primary text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-gray-50 shadow-card"
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl">
          <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">条件に合う会員が見つかりませんでした</p>
          <p className="text-sm text-gray-300 mt-2">条件を変えて検索してみてください</p>
        </div>
      )}
    </div>
  );
}
