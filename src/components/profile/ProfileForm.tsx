"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import {
  PREFECTURES,
  GENDER_LABELS,
  ANNUAL_INCOME_LABELS,
  EDUCATION_LABELS,
  BODY_TYPE_LABELS,
  DRINKING_LABELS,
  SMOKING_LABELS,
  MARRIAGE_INTENTION_LABELS,
  type Profile,
} from "@/types";
import { CheckCircle } from "lucide-react";

const profileSchema = z.object({
  nickname: z
    .string()
    .min(2, "2文字以上で入力してください")
    .max(20, "20文字以内で入力してください"),
  birth_date: z.string().min(1, "生年月日を選択してください"),
  gender: z.enum(["male", "female", "other"]),
  prefecture: z.string().min(1, "都道府県を選択してください"),
  occupation: z.string().min(1, "職業を入力してください"),
  annual_income: z.string().optional(),
  education: z.string().optional(),
  height: z.coerce.number().min(140).max(220).optional().or(z.literal("")),
  body_type: z.string().optional(),
  alcohol: z.enum(["never", "sometimes", "often", "every_day"]),
  smoking: z.enum(["never", "sometimes", "often", "quit"]),
  marriage_intention: z.enum([
    "soon",
    "within_1_year",
    "within_3_years",
    "someday",
    "undecided",
  ]),
  about_me: z.string().max(500, "500文字以内で入力してください").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData?: Partial<Profile>;
  userId: string;
  isNew?: boolean;
}

export function ProfileForm({ initialData, userId, isNew = false }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: initialData?.nickname ?? "",
      birth_date: initialData?.birth_date ?? "",
      gender: initialData?.gender ?? "male",
      prefecture: initialData?.prefecture ?? "",
      occupation: initialData?.occupation ?? "",
      annual_income: initialData?.annual_income ?? "",
      education: initialData?.education ?? "",
      height: initialData?.height ?? undefined,
      body_type: initialData?.body_type ?? "",
      alcohol: initialData?.alcohol ?? "never",
      smoking: initialData?.smoking ?? "never",
      marriage_intention: initialData?.marriage_intention ?? "within_3_years",
      about_me: initialData?.about_me ?? "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setServerError(null);

    const profileData = {
      user_id: userId,
      nickname: data.nickname,
      birth_date: data.birth_date,
      gender: data.gender,
      prefecture: data.prefecture,
      occupation: data.occupation,
      annual_income: data.annual_income || null,
      education: data.education || null,
      height: data.height || null,
      body_type: data.body_type || null,
      alcohol: data.alcohol,
      smoking: data.smoking,
      marriage_intention: data.marriage_intention,
      about_me: data.about_me || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(profileData, { onConflict: "user_id" });

    if (error) {
      setServerError("プロフィールの保存に失敗しました。再度お試しください。");
      console.error(error);
      return;
    }

    setIsSaved(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  };

  const genderOptions = Object.entries(GENDER_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const prefectureOptions = PREFECTURES.map((pref) => ({
    value: pref,
    label: pref,
  }));

  const incomeOptions = Object.entries(ANNUAL_INCOME_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const educationOptions = Object.entries(EDUCATION_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const bodyTypeOptions = Object.entries(BODY_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const alcoholOptions = Object.entries(DRINKING_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const smokingOptions = Object.entries(SMOKING_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const marriageOptions = Object.entries(MARRIAGE_INTENTION_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  if (isSaved) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-950 border border-teal-800 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-teal-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          プロフィールを保存しました！
        </h2>
        <p className="text-zinc-400 text-sm">ホーム画面へ移動します...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-sm text-red-400">
          {serverError}
        </div>
      )}

      {/* 基本情報 */}
      <section>
        <h3 className="text-base font-bold text-zinc-300 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
            1
          </span>
          基本情報
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="ニックネーム"
            placeholder="例：さくら"
            error={errors.nickname?.message}
            required
            {...register("nickname")}
          />

          <Input
            label="生年月日"
            type="date"
            error={errors.birth_date?.message}
            required
            {...register("birth_date")}
          />

          <Select
            label="性別"
            options={genderOptions}
            error={errors.gender?.message}
            required
            {...register("gender")}
          />

          <Select
            label="都道府県"
            options={prefectureOptions}
            placeholder="選択してください"
            error={errors.prefecture?.message}
            required
            {...register("prefecture")}
          />

          <div className="md:col-span-2">
            <Input
              label="職業"
              placeholder="例：会社員、医師、教師..."
              error={errors.occupation?.message}
              required
              {...register("occupation")}
            />
          </div>
        </div>
      </section>

      {/* 詳細情報 */}
      <section>
        <h3 className="text-base font-bold text-zinc-300 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
            2
          </span>
          詳細情報
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Select
            label="年収"
            options={incomeOptions}
            placeholder="選択してください"
            error={errors.annual_income?.message}
            {...register("annual_income")}
          />

          <Select
            label="最終学歴"
            options={educationOptions}
            placeholder="選択してください"
            error={errors.education?.message}
            {...register("education")}
          />

          <Input
            label="身長 (cm)"
            type="number"
            placeholder="例：165"
            min={140}
            max={220}
            error={errors.height?.message}
            {...register("height")}
          />

          <Select
            label="体型"
            options={bodyTypeOptions}
            placeholder="選択してください"
            error={errors.body_type?.message}
            {...register("body_type")}
          />
        </div>
      </section>

      {/* ライフスタイル */}
      <section>
        <h3 className="text-base font-bold text-zinc-300 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
            3
          </span>
          ライフスタイル
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Select
            label="飲酒"
            options={alcoholOptions}
            error={errors.alcohol?.message}
            required
            {...register("alcohol")}
          />

          <Select
            label="喫煙"
            options={smokingOptions}
            error={errors.smoking?.message}
            required
            {...register("smoking")}
          />

          <Select
            label="結婚への意思"
            options={marriageOptions}
            error={errors.marriage_intention?.message}
            required
            {...register("marriage_intention")}
          />
        </div>
      </section>

      {/* 自己紹介 */}
      <section>
        <h3 className="text-base font-bold text-zinc-300 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
            4
          </span>
          自己紹介
        </h3>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            自己紹介文
          </label>
          <textarea
            placeholder="趣味や休日の過ごし方、どんな人と出会いたいかなどを自由に書いてください（500文字以内）"
            rows={5}
            maxLength={500}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent hover:border-zinc-600 resize-none"
            {...register("about_me")}
          />
          {errors.about_me && (
            <p className="mt-1.5 text-sm text-red-400">{errors.about_me.message}</p>
          )}
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
        {!isNew && (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            キャンセル
          </Button>
        )}
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          {isNew ? "プロフィールを作成する" : "変更を保存する"}
        </Button>
      </div>
    </form>
  );
}
