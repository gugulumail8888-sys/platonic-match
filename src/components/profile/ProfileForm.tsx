"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { PREFECTURES, GENDER_LABELS } from "@/types";
import { CheckCircle, Check } from "lucide-react";

// ============================================================
// 選択肢（登録フォームと同じ内容）
// ============================================================

const BODY_TYPE_OPTIONS = ['がっちり', 'ぽっちゃり', 'ややぽっちゃり', '普通', '細身'];
const BLOOD_TYPE_OPTIONS = ['A型', 'B型', 'AB型', 'O型', '不明'];
const NUMBER_OF_CHILDREN_OPTIONS = ['なし', '1人', '2人', '3人', '4人', '5人以上'];
const INCOME_OPTIONS = [
  '100万未満', '100万〜200万未満', '200万〜300万未満', '300万〜400万未満',
  '400万〜500万未満', '500万〜600万未満', '600万〜700万未満', '700万〜800万未満',
  '800万〜900万未満', '900万〜1000万未満', '1000万以上',
];
const EDUCATION_OPTIONS = ['中学卒', '高校卒', '専門卒', '短大卒', '大学卒', '大学院卒'];
const MARRIAGE_TIMING_OPTIONS = ['すぐにでも', '1〜2年以内', '2〜3年以内', '未定'];
const SEXUALITY_OPTIONS = ['異性愛', '同性愛', 'バイセクシュアル', 'その他'];
const LIVING_ARRANGEMENT_OPTIONS = ['一人暮らし', '実家', '家族と同居', 'その他'];
const POST_MARRIAGE_LIVING_OPTIONS = ['同居', '別居', 'その他'];
const FINANCE_MANAGEMENT_OPTIONS = ['完全折半', '相談次第', 'その他'];
const FERTILITY_METHOD_OPTIONS = [
  '自然妊娠', '人工授精（AIH）', '体外受精（IVF）', '特別養子縁組', '里親', '未定', 'その他',
];

// ============================================================
// バリデーションスキーマ（登録フォームと同じ項目）
// ============================================================

const profileSchema = z.object({
  nickname: z.string().min(2, "2文字以上で入力してください").max(20, "20文字以内で入力してください"),
  birth_date: z.string().min(1, "生年月日を選択してください"),
  gender: z.enum(["male", "female", "other"]),
  prefecture: z.string().min(1, "都道府県を選択してください"),
  occupation: z.string().min(1, "職業を入力してください"),
  height: z.coerce.number().min(140).max(220).optional().or(z.literal("")),
  body_type: z.string().min(1, "体型を選択してください"),
  blood_type: z.string().min(1, "血液型を選択してください"),
  marital_history: z.string().min(1, "結婚歴を選択してください"),
  number_of_children: z.string().min(1, "お子様の人数を選択してください"),
  smoking: z.string().min(1, "喫煙の有無を選択してください"),
  income: z.string().min(1, "収入を選択してください"),
  siblings: z.string().optional(),
  education: z.string().min(1, "学歴を選択してください"),
  marriage_timing: z.string().min(1, "結婚希望時期を選択してください"),
  children_desire: z.string().min(1, "子供の有無（希望）を選択してください"),
  fertility_method: z.array(z.string()).optional(),
  fertility_method_other: z.string().optional(),
  sexual_activity: z.string().optional(),
  sexuality: z.string().min(1, "セクシュアリティを選択してください"),
  sexuality_other: z.string().optional(),
  living_arrangement: z.string().min(1, "現在の居住形態を選択してください"),
  living_arrangement_other: z.string().optional(),
  post_marriage_living: z.string().min(1, "結婚後の居住形態を選択してください"),
  post_marriage_living_other: z.string().optional(),
  external_partner: z.string().min(1, "外部パートナーの有無を選択してください"),
  finance_management: z.string().min(1, "家計の管理を選択してください"),
  finance_management_other: z.string().optional(),
  hobbies: z.string().max(1000, "1000文字以内で入力してください").optional(),
  pr: z.string().max(1000, "1000文字以内で入力してください").optional(),
  desired_conditions: z.string().max(1000, "1000文字以内で入力してください").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// プロフィール編集が対象とするDBの行（登録フォームが書き込む列に合わせる）
export interface ProfileEditData {
  id: string;
  nickname: string | null;
  birth_date: string | null;
  gender: string | null;
  prefecture: string | null;
  occupation: string | null;
  height: number | null;
  body_type: string | null;
  blood_type: string | null;
  marital_history: boolean | null;
  number_of_children: string | null;
  smoking: boolean | null;
  income: string | null;
  siblings: string | null;
  education: string | null;
  marriage_timing: string | null;
  children_desire: string | null;
  fertility_method: string[] | null;
  fertility_method_other: string | null;
  sexual_activity: string | null;
  sexuality: string | null;
  sexuality_other: string | null;
  living_arrangement: string | null;
  living_arrangement_other: string | null;
  post_marriage_living: string | null;
  post_marriage_living_other: string | null;
  external_partner: boolean | null;
  finance_management: string | null;
  finance_management_other: string | null;
  hobbies: string | null;
  pr: string | null;
  desired_conditions: string | null;
}

interface ProfileFormProps {
  initialData?: Partial<ProfileEditData>;
  isNew?: boolean;
}

const boolToYesNo = (v: boolean | string | null | undefined): string =>
  v === true || v === "true" ? "yes" : v === false || v === "false" ? "no" : "";

// ============================================================
// 共通サブコンポーネント
// ============================================================

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
      {children}
      {required && <span className="text-primary-400 ml-1">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1.5 text-sm text-red-400">{msg}</p> : null;
}

function YesNoRadio({
  label, name, register, error, required,
}: {
  label: string;
  name: keyof ProfileFormData;
  register: UseFormRegister<ProfileFormData>;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="flex gap-5 flex-wrap pt-0.5">
        {[{ value: "yes", label: "あり" }, { value: "no", label: "なし" }].map((o) => (
          <label key={o.value} className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
            <input type="radio" value={o.value} {...register(name)} className="w-4 h-4 accent-primary-500" />
            {o.label}
          </label>
        ))}
      </div>
      <FieldError msg={error} />
    </div>
  );
}

function RadioGroupField({
  label, name, register, options, error, required,
}: {
  label: string;
  name: keyof ProfileFormData;
  register: UseFormRegister<ProfileFormData>;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="flex gap-5 flex-wrap pt-0.5">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
            <input type="radio" value={o.value} {...register(name)} className="w-4 h-4 accent-primary-500" />
            {o.label}
          </label>
        ))}
      </div>
      <FieldError msg={error} />
    </div>
  );
}

function CheckboxGroupField({
  label, value, options, onToggle,
}: {
  label: string;
  value: string[];
  options: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap gap-x-5 gap-y-3 pt-0.5">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 cursor-pointer group">
            <div
              onClick={() => onToggle(o)}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${
                value.includes(o)
                  ? "border-primary-500 bg-primary-500"
                  : "border-zinc-600 group-hover:border-primary-700"
              }`}
            >
              {value.includes(o) && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-zinc-300 text-sm select-none" onClick={() => onToggle(o)}>
              {o}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function FormTextarea({
  label, name, register, placeholder, error, maxLength,
}: {
  label: string;
  name: keyof ProfileFormData;
  register: UseFormRegister<ProfileFormData>;
  placeholder?: string;
  error?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        placeholder={placeholder}
        rows={4}
        maxLength={maxLength}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-zinc-100 placeholder-zinc-600 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-zinc-600 resize-vertical"
        {...register(name)}
      />
      <FieldError msg={error} />
    </div>
  );
}

// ============================================================
// メインコンポーネント
// ============================================================

export function ProfileForm({ initialData, isNew = false }: ProfileFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: initialData?.nickname ?? "",
      birth_date: initialData?.birth_date ?? "",
      gender: (initialData?.gender as ProfileFormData["gender"]) ?? "male",
      prefecture: initialData?.prefecture ?? "",
      occupation: initialData?.occupation ?? "",
      height: initialData?.height ?? undefined,
      body_type: initialData?.body_type ?? "",
      blood_type: initialData?.blood_type ?? "",
      marital_history: boolToYesNo(initialData?.marital_history),
      number_of_children: initialData?.number_of_children ?? "",
      smoking: boolToYesNo(initialData?.smoking),
      income: initialData?.income ?? "",
      siblings: initialData?.siblings ?? "",
      education: initialData?.education ?? "",
      marriage_timing: initialData?.marriage_timing ?? "",
      children_desire: initialData?.children_desire ?? "",
      fertility_method: initialData?.fertility_method ?? [],
      fertility_method_other: initialData?.fertility_method_other ?? "",
      sexual_activity: initialData?.sexual_activity ?? "",
      sexuality: initialData?.sexuality ?? "",
      sexuality_other: initialData?.sexuality_other ?? "",
      living_arrangement: initialData?.living_arrangement ?? "",
      living_arrangement_other: initialData?.living_arrangement_other ?? "",
      post_marriage_living: initialData?.post_marriage_living ?? "",
      post_marriage_living_other: initialData?.post_marriage_living_other ?? "",
      external_partner: boolToYesNo(initialData?.external_partner),
      finance_management: initialData?.finance_management ?? "",
      finance_management_other: initialData?.finance_management_other ?? "",
      hobbies: initialData?.hobbies ?? "",
      pr: initialData?.pr ?? "",
      desired_conditions: initialData?.desired_conditions ?? "",
    },
  });

  const childrenDesire = watch("children_desire");
  const sexuality = watch("sexuality");
  const livingArrangement = watch("living_arrangement");
  const postMarriageLiving = watch("post_marriage_living");
  const financeManagement = watch("finance_management");
  const fertilityMethod = watch("fertility_method") ?? [];

  const toggleFertilityMethod = (v: string) => {
    const current = fertilityMethod;
    setValue(
      "fertility_method",
      current.includes(v) ? current.filter((x) => x !== v) : [...current, v]
    );
  };

  const onSubmit = async (data: ProfileFormData) => {
    setServerError(null);

    const profileData = {
      nickname: data.nickname,
      birth_date: data.birth_date,
      gender: data.gender,
      prefecture: data.prefecture,
      occupation: data.occupation,
      height: data.height || null,
      body_type: data.body_type || null,
      blood_type: data.blood_type || null,
      marital_history: data.marital_history ? data.marital_history === "yes" : null,
      number_of_children: data.number_of_children || null,
      smoking: data.smoking ? data.smoking === "yes" : null,
      income: data.income || null,
      siblings: data.siblings || null,
      education: data.education || null,
      marriage_timing: data.marriage_timing || null,
      children_desire: data.children_desire || null,
      fertility_method: data.fertility_method?.length ? data.fertility_method : null,
      fertility_method_other: data.fertility_method_other || null,
      sexual_activity: data.sexual_activity || null,
      sexuality: data.sexuality || null,
      sexuality_other: data.sexuality_other || null,
      living_arrangement: data.living_arrangement || null,
      living_arrangement_other: data.living_arrangement_other || null,
      post_marriage_living: data.post_marriage_living || null,
      post_marriage_living_other: data.post_marriage_living_other || null,
      external_partner: data.external_partner ? data.external_partner === "yes" : null,
      finance_management: data.finance_management || null,
      finance_management_other: data.finance_management_other || null,
      hobbies: data.hobbies || null,
      pr: data.pr || null,
      desired_conditions: data.desired_conditions || null,
      updated_at: new Date().toISOString(),
    };

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });

    if (!res.ok) {
      const json = await res.json();
      setServerError(json.error ?? "保存に失敗しました。再度お試しください。");
      console.error(json.error);
      return;
    }

    setIsSaved(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  };

  const genderOptions = Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }));
  const prefectureOptions = PREFECTURES.map((pref) => ({ value: pref, label: pref }));
  const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));

  if (isSaved) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-950 border border-primary-800 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-primary-400" />
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
          <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
          基本情報
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="ニックネーム" placeholder="例：さくら" error={errors.nickname?.message} required {...register("nickname")} />
          <Input label="生年月日" type="date" error={errors.birth_date?.message} required {...register("birth_date")} />
          <Select label="性別" options={genderOptions} error={errors.gender?.message} required {...register("gender")} />
          <Select label="都道府県" options={prefectureOptions} placeholder="選択してください" error={errors.prefecture?.message} required {...register("prefecture")} />
          <div className="md:col-span-2">
            <Input label="職業" placeholder="例：会社員、医師、教師..." error={errors.occupation?.message} required {...register("occupation")} />
          </div>
        </div>
      </section>

      {/* 詳細情報 */}
      <section>
        <h3 className="text-base font-bold text-zinc-300 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
          詳細情報
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="身長 (cm)" type="number" placeholder="例：165" min={140} max={220} error={errors.height?.message} required {...register("height")} />
          <Select label="体型" options={toOptions(BODY_TYPE_OPTIONS)} placeholder="選択してください" error={errors.body_type?.message} required {...register("body_type")} />
          <Select label="血液型" options={toOptions(BLOOD_TYPE_OPTIONS)} placeholder="選択してください" error={errors.blood_type?.message} required {...register("blood_type")} />
          <Select label="最終学歴" options={toOptions(EDUCATION_OPTIONS)} placeholder="選択してください" error={errors.education?.message} required {...register("education")} />
          <Select label="収入（年収）" options={toOptions(INCOME_OPTIONS)} placeholder="選択してください" error={errors.income?.message} required {...register("income")} />
          <Select label="お子様の人数" options={toOptions(NUMBER_OF_CHILDREN_OPTIONS)} placeholder="選択してください" error={errors.number_of_children?.message} required {...register("number_of_children")} />
          <Input label="兄弟姉妹" placeholder="例：長男、次女など" error={errors.siblings?.message} {...register("siblings")} />
          <YesNoRadio label="結婚歴" name="marital_history" register={register} error={errors.marital_history?.message} required />
          <YesNoRadio label="喫煙" name="smoking" register={register} error={errors.smoking?.message} required />
        </div>
      </section>

      {/* パートナー希望 */}
      <section>
        <h3 className="text-base font-bold text-zinc-300 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
          パートナー希望
        </h3>
        <div className="space-y-5">
          <Select label="結婚希望時期" options={toOptions(MARRIAGE_TIMING_OPTIONS)} placeholder="選択してください" error={errors.marriage_timing?.message} required {...register("marriage_timing")} />

          <RadioGroupField
            label="子供の有無（希望）"
            name="children_desire"
            register={register}
            options={[
              { value: "want", label: "ほしい" },
              { value: "notwant", label: "ほしくない" },
              { value: "undecided", label: "未定" },
            ]}
            error={errors.children_desire?.message}
            required
          />

          {childrenDesire === "want" && (
            <>
              <CheckboxGroupField
                label="妊活方法"
                value={fertilityMethod}
                options={FERTILITY_METHOD_OPTIONS}
                onToggle={toggleFertilityMethod}
              />
              {fertilityMethod.includes("その他") && (
                <Input placeholder="自由に記述してください" error={errors.fertility_method_other?.message} {...register("fertility_method_other")} />
              )}
              <YesNoRadio label="性交渉の有無" name="sexual_activity" register={register} error={errors.sexual_activity?.message} />
            </>
          )}

          <div>
            <Select label="セクシュアリティ" options={toOptions(SEXUALITY_OPTIONS)} placeholder="選択してください" error={errors.sexuality?.message} required {...register("sexuality")} />
            {sexuality === "その他" && (
              <div className="mt-2">
                <Input placeholder="自由に記述してください" error={errors.sexuality_other?.message} {...register("sexuality_other")} />
              </div>
            )}
          </div>

          <div>
            <Select label="現在の居住形態" options={toOptions(LIVING_ARRANGEMENT_OPTIONS)} placeholder="選択してください" error={errors.living_arrangement?.message} required {...register("living_arrangement")} />
            {livingArrangement === "その他" && (
              <div className="mt-2">
                <Input placeholder="自由に記述してください" error={errors.living_arrangement_other?.message} {...register("living_arrangement_other")} />
              </div>
            )}
          </div>

          <div>
            <Select label="結婚後の居住形態" options={toOptions(POST_MARRIAGE_LIVING_OPTIONS)} placeholder="選択してください" error={errors.post_marriage_living?.message} required {...register("post_marriage_living")} />
            {postMarriageLiving === "その他" && (
              <div className="mt-2">
                <Input placeholder="自由に記述してください" error={errors.post_marriage_living_other?.message} {...register("post_marriage_living_other")} />
              </div>
            )}
          </div>

          <YesNoRadio label="外部パートナー" name="external_partner" register={register} error={errors.external_partner?.message} required />

          <div>
            <Select label="家計の管理" options={toOptions(FINANCE_MANAGEMENT_OPTIONS)} placeholder="選択してください" error={errors.finance_management?.message} required {...register("finance_management")} />
            {financeManagement === "その他" && (
              <div className="mt-2">
                <Input placeholder="自由に記述してください" error={errors.finance_management_other?.message} {...register("finance_management_other")} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 自己紹介 */}
      <section>
        <h3 className="text-base font-bold text-zinc-300 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
          自己紹介
        </h3>
        <div className="space-y-5">
          <FormTextarea label="趣味" name="hobbies" register={register} placeholder="あなたの趣味や好きなことを自由に書いてください" maxLength={1000} error={errors.hobbies?.message} />
          <FormTextarea label="PR" name="pr" register={register} placeholder="自己PRをご自由にどうぞ" maxLength={1000} error={errors.pr?.message} />
          <FormTextarea label="希望条件" name="desired_conditions" register={register} placeholder="パートナーへの希望条件があれば記入してください" maxLength={1000} error={errors.desired_conditions?.message} />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
        {!isNew && (
          <Button type="button" variant="outline" onClick={() => router.back()}>
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
