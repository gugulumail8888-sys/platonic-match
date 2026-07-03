export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';
import { ArrowLeft, MapPin, Briefcase, User } from 'lucide-react';
import {
  GENDER_LABELS, ANNUAL_INCOME_LABELS, EDUCATION_LABELS, BODY_TYPE_LABELS,
  DRINKING_LABELS, SMOKING_LABELS, MARRIAGE_INTENTION_LABELS,
  type Gender, type AnnualIncome, type Education, type BodyType,
  type DrinkingHabit, type SmokingHabit, type MarriageIntention,
} from '@/types';

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
  height: number | null;
  body_type: string | null;
  education: string | null;
  annual_income: string | null;
  smoking: string | null;
  alcohol: string | null;
  marriage_intention: string | null;
  about_me: string | null;
  hobbies: string[] | null;
  siblings_exist: string | null;
  siblings_detail: string | null;
  siblings_position: string | null;
};

function calcAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-zinc-700/40 last:border-0">
      <span className="text-xs text-zinc-500 w-28 flex-shrink-0 pt-0.5">{label}</span>
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

async function saveNote(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const adminNotes = formData.get('adminNotes') as string;
  const supabase = createAdminClient();
  await supabase
    .from('profiles')
    .update({ admin_notes: adminNotes })
    .eq('id', id);
  revalidatePath('/admin/review');
  revalidatePath(`/admin/review/${id}`);
}

async function markReviewed(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const action = formData.get('action') as string;
  const supabase = createAdminClient();
  await supabase
    .from('profiles')
    .update({ profile_reviewed_at: action === 'unmark' ? null : new Date().toISOString() })
    .eq('id', id);
  revalidatePath('/admin/review');
  revalidatePath(`/admin/review/${id}`);
}

export default async function ProfileReviewDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const adminSupabase = createAdminClient();

  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-400">プロフィールが見つかりませんでした</p>
        <Link href="/admin/review" className="text-teal-400 text-sm mt-2 inline-block hover:text-teal-300">
          ← 一覧に戻る
        </Link>
      </div>
    );
  }

  const p = profile as Profile;
  const isReviewed = !!p.profile_reviewed_at;

  const siblingsText =
    [p.siblings_exist, p.siblings_position, p.siblings_detail].filter(Boolean).join(' / ') || '未回答';

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-5">
      {/* 戻る */}
      <Link
        href="/admin/review"
        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        一覧へ戻る
      </Link>

      {/* ===== ヘッダー ===== */}
      <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="flex-shrink-0">
          {p.avatar_url ? (
            <img
              src={p.avatar_url}
              alt={p.nickname}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center">
              <User className="w-10 h-10 text-zinc-400" />
            </div>
          )}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h1 className="text-2xl font-bold text-white">{p.nickname}</h1>
            {isReviewed ? (
              <span className="text-xs bg-teal-900/50 text-teal-400 border border-teal-800 px-2.5 py-0.5 rounded-full">
                確認済み（{new Date(p.profile_reviewed_at as string).toLocaleString('ja-JP')}）
              </span>
            ) : (
              <span className="text-xs bg-amber-900/50 text-amber-400 border border-amber-800 px-2.5 py-0.5 rounded-full">
                未確認
              </span>
            )}
          </div>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-teal-500" />
              {p.prefecture}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-teal-500" />
              {p.occupation}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1.5">
            {calcAge(p.birth_date)}歳 ／ {GENDER_LABELS[p.gender as Gender] ?? 'その他'} ／ 登録日:{' '}
            {new Date(p.created_at).toLocaleDateString('ja-JP')}
          </p>
        </div>
      </div>

      {/* ===== 手動確認 ===== */}
      <SectionCard title="手動確認">
        <p className="text-xs text-zinc-400 mb-3">
          現在の状態：
          <span className={`ml-1 font-semibold ${isReviewed ? 'text-teal-400' : 'text-amber-400'}`}>
            {isReviewed ? '確認済み' : '未確認'}
          </span>
        </p>
        <form action={markReviewed}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="action" value={isReviewed ? 'unmark' : 'mark'} />
          <button
            type="submit"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isReviewed
                ? 'bg-zinc-700/50 border border-zinc-600 text-zinc-300 hover:bg-zinc-700'
                : 'bg-teal-700 hover:bg-teal-600 text-white'
            }`}
          >
            {isReviewed ? '確認を取り消す' : '確認済みにする'}
          </button>
        </form>
      </SectionCard>

      {/* ===== プロフィール情報 ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="基本情報">
          <div className="space-y-0">
            <InfoRow label="年齢" value={`${calcAge(p.birth_date)}歳`} />
            <InfoRow label="性別" value={GENDER_LABELS[p.gender as Gender] ?? 'その他'} />
            <InfoRow label="身長" value={p.height ? `${p.height}cm` : '未回答'} />
            <InfoRow label="体型" value={p.body_type ? BODY_TYPE_LABELS[p.body_type as BodyType] ?? p.body_type : '未回答'} />
            <InfoRow label="学歴" value={p.education ? EDUCATION_LABELS[p.education as Education] ?? p.education : '未回答'} />
            <InfoRow label="兄弟姉妹" value={siblingsText} />
          </div>
        </SectionCard>

        <SectionCard title="ライフスタイル">
          <div className="space-y-0">
            <InfoRow label="居住地" value={p.prefecture} />
            <InfoRow label="職業" value={p.occupation} />
            <InfoRow
              label="年収"
              value={p.annual_income ? ANNUAL_INCOME_LABELS[p.annual_income as AnnualIncome] ?? p.annual_income : '未回答'}
            />
            <InfoRow label="喫煙" value={p.smoking ? SMOKING_LABELS[p.smoking as SmokingHabit] ?? p.smoking : '未回答'} />
            <InfoRow label="飲酒" value={p.alcohol ? DRINKING_LABELS[p.alcohol as DrinkingHabit] ?? p.alcohol : '未回答'} />
            <InfoRow
              label="結婚の意向"
              value={p.marriage_intention ? MARRIAGE_INTENTION_LABELS[p.marriage_intention as MarriageIntention] ?? p.marriage_intention : '未回答'}
            />
          </div>
        </SectionCard>
      </div>

      {/* 自己紹介・趣味 */}
      <SectionCard title="自己紹介・趣味">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1.5">自己紹介</p>
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{p.about_me || '未記入'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1.5">趣味</p>
            <p className="text-zinc-300 text-sm leading-relaxed">
              {p.hobbies && p.hobbies.length > 0 ? p.hobbies.join('、') : '未記入'}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ===== 管理者メモ ===== */}
      <SectionCard title="管理者メモ">
        <form action={saveNote}>
          <input type="hidden" name="id" value={p.id} />
          <textarea
            name="adminNotes"
            defaultValue={p.admin_notes ?? ''}
            placeholder="この会員に関する管理者メモを入力..."
            rows={4}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-colors resize-none"
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-500 transition-colors"
            >
              保存する
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
