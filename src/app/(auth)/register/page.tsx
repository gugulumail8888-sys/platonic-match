'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Check, Upload, X, ShieldCheck, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { ScrollHeader } from '@/components/ui/ScrollHeader';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

// ============================================================
// Constants
// ============================================================

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 65 }, (_, i) => CURRENT_YEAR - 18 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const INCOME_OPTIONS = [
  '100万未満', '100万〜200万未満', '200万〜300万未満', '300万〜400万未満',
  '400万〜500万未満', '500万〜600万未満', '600万〜700万未満', '700万〜800万未満',
  '800万〜900万未満', '900万〜1000万未満', '1000万以上',
];
const ALCOHOL_OPTIONS = [
  { value: 'never', label: '飲まない' },
  { value: 'sometimes', label: 'たまに' },
  { value: 'often', label: 'よく飲む' },
  { value: 'every_day', label: '毎日' },
];

// ============================================================
// Types
// ============================================================

interface FormData {
  // Step 1
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  nickname: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  gender: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirm: string;
  prefecture: string;
  addressDetail: string;
  // Step 2
  occupation: string;
  height: string;
  bodyType: string;
  bloodType: string;
  maritalHistory: string;
  numberOfChildren: string;
  smoking: string;
  alcohol: string;
  income: string;
  siblingsExist: string;
  siblingsDetail: string;
  siblingsPosition: string;
  education: string;
  marriageTiming: string;
  childrenDesire: string;
  sexualActivity: string;
  fertilityMethods: string[];
  sexuality: string;
  sexualityOther: string;
  livingArrangement: string;
  livingArrangementOther: string;
  postMarriageLiving: string;
  postMarriageLivingOther: string;
  externalPartner: string;
  financeManagement: string;
  financeManagementOther: string;
  hobbies: string;
  pr: string;
  desiredConditions: string;
}

type Errors = Partial<Record<keyof FormData, string>>;

type AnyChangeEvent = React.ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;

const INITIAL_FORM: FormData = {
  lastName: '', firstName: '', lastNameKana: '', firstNameKana: '',
  nickname: '', birthYear: '', birthMonth: '', birthDay: '',
  gender: '', phone: '', email: '', password: '', passwordConfirm: '',
  prefecture: '', addressDetail: '',
  occupation: '', height: '', bodyType: '', bloodType: '',
  maritalHistory: '', numberOfChildren: '', smoking: '', alcohol: '', income: '',
  siblingsExist: '', siblingsDetail: '', siblingsPosition: '', education: '', marriageTiming: '', childrenDesire: '',
  sexualActivity: '', fertilityMethods: [],
  sexuality: '', sexualityOther: '',
  livingArrangement: '', livingArrangementOther: '',
  postMarriageLiving: '', postMarriageLivingOther: '',
  externalPartner: '',
  financeManagement: '', financeManagementOther: '', hobbies: '', pr: '', desiredConditions: '',
};

const formatPhone = (value: string) => {
  const cleaned = value.replace(/[^\d-]/g, '');
  const digits = cleaned.replace(/-/g, '');

  if (/^(090|080|070)/.test(digits)) {
    const d = digits.slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  }

  // 固定電話：手動ハイフン許可、数字最大11桁、全体13文字まで
  let result = '';
  let digitCount = 0;
  for (const char of cleaned) {
    if (result.length >= 13) break;
    if (char === '-') {
      result += char;
    } else if (digitCount < 11) {
      result += char;
      digitCount++;
    }
  }
  return result;
};

// ============================================================
// UI Primitives
// ============================================================

const baseCls =
  'w-full bg-zinc-800 border rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-500 ' +
  'focus:outline-none focus:ring-1 transition-colors';
const fieldCls = (err?: string, disabled?: boolean) =>
  `${baseCls} ${disabled
    ? 'bg-zinc-900 text-zinc-400 cursor-not-allowed border-zinc-700 opacity-50'
    : err
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-zinc-700 focus:border-teal-600 focus:ring-teal-600'}`;

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="text-red-400 text-xs mt-1">{msg}</p> : null;
}

function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      {children}
      <FieldError msg={error} />
    </div>
  );
}

function FInput({
  name, value, onChange, type = 'text', placeholder, error, autoComplete, inputMode, lang, disabled,
}: {
  name: string; value: string; onChange: (e: AnyChangeEvent) => void;
  type?: string; placeholder?: string; error?: string;
  autoComplete?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; lang?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={inputMode}
      lang={lang}
      disabled={disabled}
      className={fieldCls(error, disabled)}
    />
  );
}

function FSelect({
  name, value, onChange, options, placeholder, error,
}: {
  name: string; value: string; onChange: (e: AnyChangeEvent) => void;
  options: string[] | { value: string; label: string }[];
  placeholder?: string; error?: string;
}) {
  const normalized = (options as (string | { value: string; label: string })[]).map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  );
  return (
    <select
      name={name}
      value={value}
      onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>}
      className={fieldCls(error)}
    >
      <option value="">{placeholder ?? '選択してください'}</option>
      {normalized.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function FRadioGroup({
  name, value, options, onChange, error,
}: {
  name: string; value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void; error?: string;
}) {
  return (
    <div>
      <div className="flex gap-5 flex-wrap pt-0.5">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 cursor-pointer group">
            <div
              onClick={() => onChange(o.value)}
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${
                value === o.value
                  ? 'border-teal-500 bg-teal-500'
                  : 'border-zinc-600 group-hover:border-teal-700'
              }`}
            >
              {value === o.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <span
              className="text-zinc-300 text-sm select-none"
              onClick={() => onChange(o.value)}
            >
              {o.label}
            </span>
          </label>
        ))}
      </div>
      <FieldError msg={error} />
    </div>
  );
}

function FCheckboxGroup({
  value, options, onChange,
}: {
  value: string[];
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-3 pt-0.5">
      {options.map((o) => (
        <label key={o.value} className="flex items-center gap-2 cursor-pointer group">
          <div
            onClick={() => onChange(o.value)}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${
              value.includes(o.value)
                ? 'border-teal-500 bg-teal-500'
                : 'border-zinc-600 group-hover:border-teal-700'
            }`}
          >
            {value.includes(o.value) && <Check className="w-3 h-3 text-white" />}
          </div>
          <span className="text-zinc-300 text-sm select-none" onClick={() => onChange(o.value)}>
            {o.label}
          </span>
        </label>
      ))}
    </div>
  );
}

function FTextarea({
  name, value, onChange, placeholder, maxLength, error,
}: {
  name: string; value: string; onChange: (e: AnyChangeEvent) => void;
  placeholder?: string; maxLength?: number; error?: string;
}) {
  return (
    <div>
      <textarea
        name={name}
        value={value}
        onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
        className={`${fieldCls(error)} resize-vertical`}
      />
      {maxLength && (
        <p className="text-zinc-500 text-xs mt-1 text-right">
          {value.length.toLocaleString()} / {maxLength.toLocaleString()}文字
        </p>
      )}
      <FieldError msg={error} />
    </div>
  );
}

// ============================================================
// Step Indicator（4段階）
// ============================================================

function StepIndicator({ step }: { step: number }) {
  const steps = [
    { n: 1, label: '基本情報' },
    { n: 2, label: 'プロフィール' },
    { n: 3, label: '本人確認' },
    { n: 4, label: '完了' },
  ];
  return (
    <div className="flex items-start justify-center mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-start">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > s.n
                  ? 'bg-teal-600 text-white'
                  : step === s.n
                  ? 'bg-teal-600 text-white ring-4 ring-teal-950'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
              }`}
            >
              {step > s.n ? <Check className="w-4 h-4" /> : s.n}
            </div>
            <span
              className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                step >= s.n ? 'text-teal-400' : 'text-zinc-600'
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-10 md:w-16 h-0.5 mx-1.5 mt-[18px] transition-colors ${
                step > s.n ? 'bg-teal-600' : 'bg-zinc-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Step 1: Basic Info
// ============================================================

function Step1({
  data, onChange, onPhoneChange, onRadio, errors, isGoogleUser,
}: {
  data: FormData;
  onChange: (e: AnyChangeEvent) => void;
  onPhoneChange: (e: AnyChangeEvent) => void;
  onRadio: (name: keyof FormData, val: string) => void;
  errors: Errors;
  isGoogleUser: boolean;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-white border-b border-zinc-700 pb-3 mb-5">
        基本情報
      </h2>

      {/* 氏名 */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="お名前（姓）" required error={errors.lastName}>
          <FInput name="lastName" value={data.lastName} onChange={onChange}
            placeholder="例：山田" error={errors.lastName} />
        </Field>
        <Field label="お名前（名）" required error={errors.firstName}>
          <FInput name="firstName" value={data.firstName} onChange={onChange}
            placeholder="例：太郎" error={errors.firstName} />
        </Field>
      </div>

      {/* フリガナ */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="フリガナ（姓）※カタカナまたはローマ字" required error={errors.lastNameKana}>
          <FInput name="lastNameKana" value={data.lastNameKana} onChange={onChange}
            placeholder="カタカナまたはローマ字" error={errors.lastNameKana} />
        </Field>
        <Field label="フリガナ（名）※カタカナまたはローマ字" required error={errors.firstNameKana}>
          <FInput name="firstNameKana" value={data.firstNameKana} onChange={onChange}
            placeholder="カタカナまたはローマ字" error={errors.firstNameKana} />
        </Field>
      </div>

      {/* ニックネーム */}
      <Field label="ニックネーム" required error={errors.nickname}>
        <FInput name="nickname" value={data.nickname} onChange={onChange}
          placeholder="例：たろちゃん" error={errors.nickname} />
      </Field>

      {/* 生年月日 */}
      <div>
        <FieldLabel required>生年月日</FieldLabel>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <FSelect
              name="birthYear" value={data.birthYear} onChange={onChange}
              options={BIRTH_YEARS.map((y) => ({ value: String(y), label: `${y}年` }))}
              placeholder="年" error={errors.birthYear}
            />
            <FieldError msg={errors.birthYear} />
          </div>
          <div>
            <FSelect
              name="birthMonth" value={data.birthMonth} onChange={onChange}
              options={MONTHS.map((m) => ({ value: String(m), label: `${m}月` }))}
              placeholder="月" error={errors.birthMonth}
            />
            <FieldError msg={errors.birthMonth} />
          </div>
          <div>
            <FSelect
              name="birthDay" value={data.birthDay} onChange={onChange}
              options={DAYS.map((d) => ({ value: String(d), label: `${d}日` }))}
              placeholder="日" error={errors.birthDay}
            />
            <FieldError msg={errors.birthDay} />
          </div>
        </div>
      </div>

      {/* 性別 */}
      <Field label="性別" required error={errors.gender}>
        <FRadioGroup
          name="gender" value={data.gender}
          options={[{ value: 'female', label: '女性' }, { value: 'male', label: '男性' }]}
          onChange={(v) => onRadio('gender', v)} error={errors.gender}
        />
      </Field>

      {/* 電話番号 */}
      <Field label="電話番号" required error={errors.phone}>
        <FInput name="phone" value={data.phone} onChange={onPhoneChange}
          placeholder="090-0000-0000" type="tel" error={errors.phone} />
      </Field>

      {/* メールアドレス */}
      <Field
        label={isGoogleUser ? 'メールアドレス（Googleの情報を自動記載の為、入力不可）' : 'メールアドレス'}
        required error={errors.email}
      >
        <FInput name="email" value={data.email} onChange={onChange}
          placeholder="例：example@email.com" type="email" error={errors.email}
          disabled={isGoogleUser} />
      </Field>

      {/* パスワード */}
      <Field
        label={isGoogleUser ? 'パスワード（Googleの情報を自動記載の為、入力不可）' : 'パスワード'}
        required error={errors.password}
      >
        <FInput name="password" value={data.password} onChange={onChange}
          placeholder="8文字以上" type="password" error={errors.password}
          disabled={isGoogleUser} />
      </Field>

      {/* パスワード確認 */}
      <Field
        label={isGoogleUser ? 'パスワード（確認）（Googleの情報を自動記載の為、入力不可）' : 'パスワード（確認）'}
        required
        error={errors.passwordConfirm}
      >
        <FInput
          name="passwordConfirm"
          value={data.passwordConfirm}
          onChange={onChange}
          placeholder="もう一度入力してください"
          type="password"
          error={errors.passwordConfirm}
          disabled={isGoogleUser}
        />
      </Field>

      {/* 都道府県 */}
      <Field label="住所（都道府県）" required error={errors.prefecture}>
        <FSelect name="prefecture" value={data.prefecture} onChange={onChange}
          options={PREFECTURES} error={errors.prefecture} />
      </Field>

      {/* 住所詳細 */}
      <Field label="住所（詳細）" required error={errors.addressDetail}>
        <FInput name="addressDetail" value={data.addressDetail} onChange={onChange}
          placeholder="例：南町1-2-3 アミスタマンション101"
          lang="ja" autoComplete="address-line2" inputMode="search" error={errors.addressDetail} />
      </Field>
    </div>
  );
}

// ============================================================
// Step 2: Profile
// ============================================================

function Step2({
  data, onChange, onRadio, onFertilityMethodToggle, errors,
}: {
  data: FormData;
  onChange: (e: AnyChangeEvent) => void;
  onRadio: (name: keyof FormData, val: string) => void;
  onFertilityMethodToggle: (val: string) => void;
  errors: Errors;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-white border-b border-zinc-700 pb-3 mb-5">
        プロフィール
      </h2>

      {/* 職業 */}
      <Field label="職業" required error={errors.occupation}>
        <FInput name="occupation" value={data.occupation} onChange={onChange}
          placeholder="例：会社員、自営業" error={errors.occupation} />
      </Field>

      {/* 身長 */}
      <Field label="身長（cm）" required error={errors.height}>
        <div className="flex items-center gap-2">
          <FInput name="height" value={data.height} onChange={onChange}
            type="number" placeholder="例：170" error={errors.height} />
          <span className="text-zinc-400 text-sm whitespace-nowrap">cm</span>
        </div>
      </Field>

      {/* 体型 */}
      <Field label="体型" required error={errors.bodyType}>
        <FSelect name="bodyType" value={data.bodyType} onChange={onChange}
          options={['がっちり', 'ぽっちゃり', 'ややぽっちゃり', '普通', '細身']}
          error={errors.bodyType} />
      </Field>

      {/* 血液型 */}
      <Field label="血液型" required error={errors.bloodType}>
        <FSelect name="bloodType" value={data.bloodType} onChange={onChange}
          options={['A型', 'B型', 'AB型', 'O型', '不明']}
          error={errors.bloodType} />
      </Field>

      {/* 結婚歴 */}
      <Field label="結婚歴" required error={errors.maritalHistory}>
        <FRadioGroup
          name="maritalHistory" value={data.maritalHistory}
          options={[{ value: 'yes', label: 'あり' }, { value: 'no', label: 'なし' }]}
          onChange={(v) => onRadio('maritalHistory', v)} error={errors.maritalHistory}
        />
      </Field>

      {/* お子様の人数 */}
      <Field label="お子様の人数" required error={errors.numberOfChildren}>
        <FSelect name="numberOfChildren" value={data.numberOfChildren} onChange={onChange}
          options={['なし', '1人', '2人', '3人', '4人', '5人以上']}
          error={errors.numberOfChildren} />
      </Field>

      {/* 喫煙 */}
      <Field label="喫煙" required error={errors.smoking}>
        <FRadioGroup
          name="smoking" value={data.smoking}
          options={[{ value: 'yes', label: 'あり' }, { value: 'no', label: 'なし' }]}
          onChange={(v) => onRadio('smoking', v)} error={errors.smoking}
        />
      </Field>

      {/* 飲酒 */}
      <Field label="飲酒" required error={errors.alcohol}>
        <FSelect name="alcohol" value={data.alcohol} onChange={onChange}
          options={ALCOHOL_OPTIONS} error={errors.alcohol} />
      </Field>

      {/* 収入 */}
      <Field label="収入（年収）" required error={errors.income}>
        <FSelect name="income" value={data.income} onChange={onChange}
          options={INCOME_OPTIONS} error={errors.income} />
      </Field>

      {/* 兄弟姉妹の有無 */}
      <Field label="兄弟姉妹の有無">
        <FSelect name="siblingsExist" value={data.siblingsExist} onChange={onChange}
          options={['なし', 'あり']} />
      </Field>
      {data.siblingsExist === 'あり' && (
        <Field label="兄弟姉妹の詳細">
          <input
            type="text"
            name="siblingsDetail"
            value={data.siblingsDetail ?? ''}
            onChange={onChange}
            placeholder="例：兄1人・妹2人など"
            className="w-full bg-zinc-800 border border-zinc-600 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-400"
          />
        </Field>
      )}
      {/* 自分の続柄 */}
      <Field label="自分の続柄">
        <FSelect name="siblingsPosition" value={data.siblingsPosition} onChange={onChange}
          options={['長男', '次男', '三男以降', '長女', '次女', '三女以降', '一人っ子']} />
      </Field>
      {/* 学歴 */}
      <Field label="最終学歴" required error={errors.education}>
        <FSelect name="education" value={data.education} onChange={onChange}
          options={['中学卒', '高校卒', '専門卒', '短大卒', '大学卒', '大学院卒']}
          error={errors.education} />
      </Field>

      {/* 結婚希望時期 */}
      <Field label="結婚希望時期" required error={errors.marriageTiming}>
        <FSelect name="marriageTiming" value={data.marriageTiming} onChange={onChange}
          options={['すぐにでも', '1〜2年以内', '2〜3年以内', '未定']}
          error={errors.marriageTiming} />
      </Field>

      {/* 子供の希望 */}
      <Field label="子供の有無（希望）" required error={errors.childrenDesire}>
        <FRadioGroup
          name="childrenDesire" value={data.childrenDesire}
          options={[
            { value: 'want', label: 'ほしい' },
            { value: 'notwant', label: 'ほしくない' },
            { value: 'undecided', label: '未定' },
          ]}
          onChange={(v) => onRadio('childrenDesire', v)} error={errors.childrenDesire}
        />
      </Field>

      {/* 性交渉の有無 */}
      <Field label="性交渉の有無" required error={errors.sexualActivity}>
        <FRadioGroup
          name="sexualActivity" value={data.sexualActivity}
          options={[
            { value: 'あり',     label: 'あり' },
            { value: 'なし',     label: 'なし' },
            { value: 'その他・未定', label: 'その他・未定' },
          ]}
          onChange={(v) => onRadio('sexualActivity', v)} error={errors.sexualActivity}
        />
      </Field>

      {/* 妊活方法（「ほしい」選択時のみ表示） */}
      {data.childrenDesire === 'want' && (
        <Field label="妊活方法" required error={errors.fertilityMethods}>
          <FCheckboxGroup
            value={data.fertilityMethods}
            options={[
              { value: '人工授精',     label: '人工授精' },
              { value: '体外受精',     label: '体外受精' },
              { value: '養子縁組',     label: '養子縁組' },
              { value: '里親',         label: '里親' },
              { value: 'その他・未定', label: 'その他・未定' },
            ]}
            onChange={onFertilityMethodToggle}
          />
        </Field>
      )}

      {/* セクシュアリティ */}
      <Field label="セクシュアリティ" required error={errors.sexuality}>
        <FSelect name="sexuality" value={data.sexuality} onChange={onChange}
          options={['異性愛', '同性愛', 'バイセクシュアル', 'その他']}
          error={errors.sexuality} />
        {data.sexuality === 'その他' && (
          <div className="mt-2">
            <FInput
              name="sexualityOther"
              value={data.sexualityOther}
              onChange={onChange}
              placeholder="自由に記述してください"
            />
          </div>
        )}
      </Field>

      {/* 居住形態 */}
      <Field label="現在の居住形態" required error={errors.livingArrangement}>
        <FSelect name="livingArrangement" value={data.livingArrangement} onChange={onChange}
          options={['一人暮らし', '実家', '家族と同居', 'その他']}
          error={errors.livingArrangement} />
        {data.livingArrangement === 'その他' && (
          <div className="mt-2">
            <FInput
              name="livingArrangementOther"
              value={data.livingArrangementOther}
              onChange={onChange}
              placeholder="自由に記述してください"
            />
          </div>
        )}
      </Field>

      {/* 結婚後の居住形態 */}
      <Field label="結婚後の居住形態" required error={errors.postMarriageLiving}>
        <FSelect name="postMarriageLiving" value={data.postMarriageLiving} onChange={onChange}
          options={['同居', '別居', 'その他']}
          error={errors.postMarriageLiving} />
        {data.postMarriageLiving === 'その他' && (
          <div className="mt-2">
            <FInput
              name="postMarriageLivingOther"
              value={data.postMarriageLivingOther}
              onChange={onChange}
              placeholder="自由に記述してください"
            />
          </div>
        )}
      </Field>

      {/* 外部パートナー */}
      <Field label="外部パートナー" required error={errors.externalPartner}>
        <FRadioGroup
          name="externalPartner" value={data.externalPartner}
          options={[{ value: 'yes', label: 'あり' }, { value: 'no', label: 'なし' }]}
          onChange={(v) => onRadio('externalPartner', v)} error={errors.externalPartner}
        />
      </Field>

      {/* 家計の管理 */}
      <Field label="家計の管理" required error={errors.financeManagement}>
        <FSelect name="financeManagement" value={data.financeManagement} onChange={onChange}
          options={['完全折半', '相談次第', 'その他']}
          error={errors.financeManagement} />
        {data.financeManagement === 'その他' && (
          <div className="mt-2">
            <FInput
              name="financeManagementOther"
              value={data.financeManagementOther}
              onChange={onChange}
              placeholder="自由に記述してください"
            />
          </div>
        )}
      </Field>

      {/* 趣味 */}
      <Field label="趣味">
        <FTextarea name="hobbies" value={data.hobbies} onChange={onChange}
          placeholder="あなたの趣味や好きなことを自由に書いてください"
          maxLength={1000} />
      </Field>

      {/* PR */}
      <Field label="PR">
        <FTextarea name="pr" value={data.pr} onChange={onChange}
          placeholder="自己PRをご自由にどうぞ"
          maxLength={1000} />
      </Field>

      {/* 希望条件 */}
      <Field label="希望条件">
        <FTextarea name="desiredConditions" value={data.desiredConditions} onChange={onChange}
          placeholder="パートナーへの希望条件があれば記入してください"
          maxLength={1000} />
      </Field>
    </div>
  );
}

// ============================================================
// Step 3: 本人確認書類アップロード
// ============================================================

type DocType = 'license' | 'mynumber' | 'passport' | '';

const DOC_OPTIONS: { value: DocType; label: string; note?: string }[] = [
  { value: 'license',  label: '運転免許証',        note: '推奨' },
  { value: 'mynumber', label: 'マイナンバーカード' },
  { value: 'passport', label: 'パスポート',          note: '上記2つをお持ちでない方' },
];

function UploadArea({
  label,
  preview,
  onFile,
  onClear,
}: {
  label: string;
  preview: string | null;
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) onFile(file);
  };

  return (
    <div>
      <p className="text-sm font-medium text-zinc-300 mb-2">{label}</p>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-zinc-600 bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="w-full h-40 object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 w-7 h-7 bg-zinc-900/80 rounded-full flex items-center justify-center text-zinc-300 hover:bg-red-900/80 hover:text-red-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-0 inset-x-0 bg-teal-900/80 py-1 text-center text-xs text-teal-300">
            ✓ アップロード済み
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-zinc-600 rounded-xl p-6 text-center cursor-pointer hover:border-teal-600 hover:bg-teal-950/20 transition-all"
        >
          <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
          <p className="text-zinc-400 text-sm">クリックまたはドラッグ&amp;ドロップ</p>
          <p className="text-zinc-600 text-xs mt-1">JPG・PNG・HEIC（最大10MB）</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}

function Step3({
  docType, setDocType, frontPreview, backPreview,
  onFrontFile, onBackFile, onFrontClear, onBackClear,
  isSameFile,
}: {
  docType: DocType;
  setDocType: (v: DocType) => void;
  frontPreview: string | null;
  backPreview: string | null;
  onFrontFile: (f: File) => void;
  onBackFile: (f: File) => void;
  onFrontClear: () => void;
  onBackClear: () => void;
  isSameFile: boolean;
}) {
  const isPassport = docType === 'passport';
  const frontLabel = isPassport ? '顔写真ページ' : '表面';
  const backLabel  = isPassport ? '個人情報ページ' : '裏面';

  return (
    <div className="space-y-6">
      <h2 className="text-base font-bold text-white border-b border-zinc-700 pb-3">
        本人確認書類のアップロード
      </h2>

      <p className="text-zinc-400 text-sm leading-relaxed">
        以下の書類のいずれかを選択し、{isPassport ? '顔写真ページ・個人情報ページ' : '表面・裏面'}をアップロードしてください。
      </p>

      {/* 書類選択 */}
      <div>
        <p className="text-sm font-medium text-zinc-300 mb-3">書類の種類を選択</p>
        <div className="space-y-2">
          {DOC_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setDocType(opt.value); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                docType === opt.value
                  ? 'border-teal-500 bg-teal-950/40'
                  : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  docType === opt.value ? 'border-teal-500 bg-teal-500' : 'border-zinc-500'
                }`}>
                  {docType === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className={`text-sm font-medium ${docType === opt.value ? 'text-teal-300' : 'text-zinc-300'}`}>
                  {opt.label}
                </span>
              </div>
              {opt.note && (
                <span className="text-xs text-zinc-500">{opt.note}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* アップロードエリア（書類選択後に表示） */}
      {docType && (
        <div className="space-y-4">
          <UploadArea
            label={frontLabel}
            preview={frontPreview}
            onFile={onFrontFile}
            onClear={onFrontClear}
          />
          <UploadArea
            label={backLabel}
            preview={backPreview}
            onFile={onBackFile}
            onClear={onBackClear}
          />
          {/* 同一画像エラー */}
          {isSameFile && (
            <div className="flex items-start gap-2 bg-red-950/50 border border-red-800 rounded-xl px-3 py-2.5 mt-1">
              <span className="text-red-400 flex-shrink-0 mt-0.5">⚠</span>
              <p className="text-red-400 text-xs leading-relaxed">
                表面と裏面に同じ画像が選択されています。別々の画像をアップロードしてください。
              </p>
            </div>
          )}
        </div>
      )}

      {/* 注意事項 */}
      <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">注意事項</p>
        <ul className="space-y-2">
          {[
            '画像は鮮明に撮影してください',
            '有効期限内の書類をご使用ください',
            '四隅が全て写るようにしてください',
            '光の反射にご注意ください',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs text-zinc-400">
              <span className="text-teal-500 flex-shrink-0 mt-0.5">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================================
// Step 4: Complete（審査待ち）
// ============================================================

function Step4() {
  return (
    <div className="text-center py-8">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{
          background: 'rgba(13,148,136,0.15)',
          border: '2px solid rgba(13,148,136,0.3)',
        }}
      >
        <ShieldCheck className="w-10 h-10 text-teal-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">書類を受け付けました！</h2>
      <p className="text-zinc-300 mb-1">審査完了までお待ちください。</p>
      <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
        通常1〜3営業日以内に審査結果をメールでお送りします。<br />
        承認後、すべての機能をご利用いただけます。
      </p>

      {/* 審査の流れ */}
      <div className="bg-zinc-800 rounded-2xl border border-zinc-700 p-5 text-left mb-6">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">審査の流れ</p>
        <div className="space-y-4">
          {[
            { icon: ShieldCheck, label: '書類確認中',  desc: '提出いただいた書類を確認しています',         done: true },
            { icon: Mail,        label: '承認メール',  desc: '審査完了後、登録メールアドレスにご連絡します', done: false },
            { icon: CheckCircle2, label: '利用開始',  desc: '承認後、すべての機能をご利用いただけます',    done: false },
          ].map(({ icon: Icon, label, desc, done }, i) => (
            <div key={i} className="flex gap-4">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                done ? 'bg-teal-900/60 border border-teal-700' : 'bg-zinc-700 border border-zinc-600'
              }`}>
                <Icon className={`w-4 h-4 ${done ? 'text-teal-400' : 'text-zinc-500'}`} />
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className={`text-sm font-semibold ${done ? 'text-teal-300' : 'text-zinc-400'}`}>
                  {label}
                  {done && <span className="ml-2 text-xs text-teal-500">（処理中）</span>}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-zinc-600 text-xs">
        メールが届かない場合は迷惑メールフォルダをご確認ください。
      </p>
    </div>
  );
}

// ============================================================
// Main Page
// ============================================================

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [googleUser, setGoogleUser] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isGoogle = params.get('google') === '1';
    const emailParam = decodeURIComponent(params.get('email') ?? '');

    if (isGoogle && emailParam) {
      setIsGoogleUser(true);
      setData((prev) => ({ ...prev, email: emailParam, password: '', passwordConfirm: '' }));

      // @supabase/ssr のクライアントでセッション取得
      const client = createClient();
      client.auth.getSession().then(({ data: { session } }) => {
        const user = session?.user;
        if (user) {
          setGoogleUser({ id: user.id, email: emailParam });
        }
      });
    }
  }, []);

  // Step3 用
  const [docType, setDocType]           = useState<DocType>('');
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview]   = useState<string | null>(null);
  const [frontFile, setFrontFile]       = useState<File | null>(null);
  const [backFile, setBackFile]         = useState<File | null>(null);

  const isSameFile = !!(
    frontFile && backFile &&
    frontFile.name         === backFile.name &&
    frontFile.size         === backFile.size &&
    frontFile.lastModified === backFile.lastModified
  );

  const onChange = (e: AnyChangeEvent) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const onPhoneChange = (e: AnyChangeEvent) => {
    const formatted = formatPhone(e.target.value);
    setData((prev) => ({ ...prev, phone: formatted }));
    setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  const onRadio = (name: keyof FormData, val: string) => {
    setData((prev) => ({ ...prev, [name]: val }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // 妊活方法：「その他・未定」は他の選択肢と排他
  const onFertilityMethodToggle = (val: string) => {
    setData((prev) => {
      const current = prev.fertilityMethods;
      if (current.includes(val)) {
        return { ...prev, fertilityMethods: current.filter((x) => x !== val) };
      }
      const updated = val === 'その他・未定' ? [val] : [...current.filter((x) => x !== 'その他・未定'), val];
      return { ...prev, fertilityMethods: updated };
    });
    setErrors((prev) => ({ ...prev, fertilityMethods: undefined }));
  };

  const handleFile = (side: 'front' | 'back') => (file: File) => {
    const url = URL.createObjectURL(file);
    if (side === 'front') { setFrontPreview(url); setFrontFile(file); }
    else                  { setBackPreview(url);  setBackFile(file); }
  };

  const handleClear = (side: 'front' | 'back') => () => {
    if (side === 'front') { setFrontPreview(null); setFrontFile(null); }
    else                  { setBackPreview(null);  setBackFile(null); }
  };

  const validateStep1 = (): boolean => {
    const e: Errors = {};
    if (!data.lastName.trim())      e.lastName      = '氏を入力してください';
    if (!data.firstName.trim())     e.firstName     = '名を入力してください';
    if (!data.lastNameKana.trim())  e.lastNameKana  = 'フリガナ（氏）を入力してください';
    else if (!/^[ァ-ヶーa-zA-Z\s]+$/.test(data.lastNameKana))
      e.lastNameKana = 'カタカナまたはローマ字で入力してください';
    if (!data.firstNameKana.trim()) e.firstNameKana = 'フリガナ（名）を入力してください';
    else if (!/^[ァ-ヶーa-zA-Z\s]+$/.test(data.firstNameKana))
      e.firstNameKana = 'カタカナまたはローマ字で入力してください';
    if (!data.nickname.trim())      e.nickname      = 'ニックネームを入力してください';
    if (!data.birthYear)            e.birthYear     = '年を選択してください';
    if (!data.birthMonth)           e.birthMonth    = '月を選択してください';
    if (!data.birthDay)             e.birthDay      = '日を選択してください';
    if (!data.gender)               e.gender        = '性別を選択してください';
    if (!data.phone.trim())         e.phone         = '電話番号を入力してください';
    if (!data.email.trim())         e.email         = 'メールアドレスを入力してください';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      e.email = '正しいメールアドレスを入力してください';
    if (!isGoogleUser) {
      if (!data.password)             e.password      = 'パスワードを入力してください';
      else if (data.password.length < 8)
        e.password = '8文字以上で入力してください';
      if (!data.passwordConfirm)      e.passwordConfirm = 'パスワード（確認）を入力してください';
      else if (data.passwordConfirm !== data.password)
        e.passwordConfirm = 'パスワードが一致しません';
    }
    if (!data.prefecture)           e.prefecture    = '都道府県を選択してください';
    if (!data.addressDetail.trim()) e.addressDetail = '住所詳細を入力してください';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: Errors = {};
    if (!data.occupation.trim())     e.occupation        = '職業を入力してください';
    if (!data.height)                e.height            = '身長を入力してください';
    else if (Number(data.height) < 100 || Number(data.height) > 250)
      e.height = '正しい身長を入力してください（100〜250cm）';
    if (!data.bodyType)              e.bodyType          = '体型を選択してください';
    if (!data.bloodType)             e.bloodType         = '血液型を選択してください';
    if (!data.maritalHistory)        e.maritalHistory    = '結婚歴を選択してください';
    if (!data.numberOfChildren)      e.numberOfChildren  = 'お子様の人数を選択してください';
    if (!data.smoking)               e.smoking           = '喫煙を選択してください';
    if (!data.alcohol)               e.alcohol           = '飲酒を選択してください';
    if (!data.income)                e.income            = '収入を選択してください';
    if (!data.education)             e.education         = '学歴を選択してください';
    if (!data.marriageTiming)        e.marriageTiming    = '結婚希望時期を選択してください';
    if (!data.childrenDesire)        e.childrenDesire    = '子供の希望を選択してください';
    if (!data.sexualActivity)        e.sexualActivity    = '性交渉の有無を選択してください';
    if (data.childrenDesire === 'want' && data.fertilityMethods.length === 0)
      e.fertilityMethods = '妊活方法を選択してください';
    if (!data.sexuality)             e.sexuality         = 'セクシュアリティを選択してください';
    if (!data.livingArrangement)     e.livingArrangement = '居住形態を選択してください';
    if (!data.postMarriageLiving)    e.postMarriageLiving = '結婚後の居住形態を選択してください';
    if (!data.externalPartner)       e.externalPartner   = '外部パートナーを選択してください';
    if (!data.financeManagement)     e.financeManagement = '家計の管理を選択してください';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Step3: 書類選択 + 両面アップロード済み + 同一画像でないことで有効
  const step3Valid = !!docType && !!frontPreview && !!backPreview && !isSameFile;

  const handleNext = async () => {
    if (step === 1) {
      if (!validateStep1()) {
        setTimeout(() => {
          const el = document.querySelector('.border-red-500');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
        return;
      }
    } else if (step === 2) {
      if (!validateStep2()) {
        setTimeout(() => {
          const el = document.querySelector('.border-red-500');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
        return;
      }
    } else if (step === 3) {
      if (!step3Valid) return;
      setIsLoading(true);
      setSubmitError(null);
      try {
        const client = createClient();
        let userId: string | undefined;

        if (isGoogleUser) {
          userId = googleUser?.id;
          if (!userId) {
            setSubmitError('ユーザー情報の取得に失敗しました');
            return;
          }
        } else {
          const { data: authData, error: signUpError } = await client.auth.signUp({
            email: data.email,
            password: data.password,
          });
          if (signUpError) {
            setSubmitError(signUpError.message);
            return;
          }
          userId = authData.user?.id;
          if (!userId) {
            setSubmitError('ユーザーIDの取得に失敗しました');
            return;
          }
        }

        const birthDate = `${data.birthYear}-${String(data.birthMonth).padStart(2, '0')}-${String(data.birthDay).padStart(2, '0')}`;
        const ageRes = await fetch('/api/auth/validate-age', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ birth_date: birthDate }),
        });
        if (!ageRes.ok) {
          const ageBody = await ageRes.json().catch(() => null) as { error?: string } | null;
          setSubmitError(ageBody?.error ?? '年齢の確認に失敗しました');
          return;
        }

        const { error: insertError } = await client.from('profiles').insert({
          id: userId,
          last_name: data.lastName,
          first_name: data.firstName,
          last_name_kana: data.lastNameKana,
          first_name_kana: data.firstNameKana,
          nickname: data.nickname,
          birth_date: birthDate,
          gender: data.gender,
          phone: data.phone,
          prefecture: data.prefecture,
          address_detail: data.addressDetail,
          occupation: data.occupation,
          height: Number(data.height),
          body_type: data.bodyType,
          blood_type: data.bloodType,
          marital_history: data.maritalHistory === 'yes',
          number_of_children: data.numberOfChildren,
          smoking: data.smoking === 'yes',
          alcohol: data.alcohol,
          income: data.income,
          siblings_exist: data.siblingsExist, siblings_detail: data.siblingsExist === 'あり' ? data.siblingsDetail : null, siblings_position:
          data.siblingsPosition || null,
          education: data.education,
          marriage_timing: data.marriageTiming,
          children_desire: data.childrenDesire,
          sexual_activity: data.sexualActivity,
          fertility_methods: data.childrenDesire === 'want' ? data.fertilityMethods : null,
          sexuality: data.sexuality,
          sexuality_other: data.sexualityOther,
          living_arrangement: data.livingArrangement,
          living_arrangement_other: data.livingArrangementOther,
          post_marriage_living: data.postMarriageLiving,
          post_marriage_living_other: data.postMarriageLivingOther,
          external_partner: data.externalPartner === 'yes',
          finance_management: data.financeManagement,
          finance_management_other: data.financeManagementOther,
          hobbies: data.hobbies,
          pr: data.pr,
          desired_conditions: data.desiredConditions,
          status: 'approved',
        });
        if (insertError) {
          setSubmitError(insertError.message);
          return;
        }

        // 本人確認書類のアップロード（front・back両方必須）
        const uploadDocument = async (file: File, side: 'front' | 'back') => {
          const docForm = new FormData();
          docForm.append('file', file);
          docForm.append('side', side);
          const res = await fetch('/api/upload/document', { method: 'POST', body: docForm });
          if (!res.ok) {
            const body = await res.json().catch(() => null) as { error?: string } | null;
            throw new Error(body?.error ?? '書類のアップロードに失敗しました');
          }
        };

        try {
          if (!frontFile || !backFile) throw new Error('書類が選択されていません');
          await uploadDocument(frontFile, 'front');
          await uploadDocument(backFile, 'back');
        } catch (uploadErr) {
          setSubmitError(uploadErr instanceof Error ? uploadErr.message : '書類のアップロードに失敗しました');
          return;
        }

        setStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } finally {
        setIsLoading(false);
      }
      return;
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep((s) => s - 1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextLabel =
    step === 2 ? 'プロフィールを保存 →' :
    step === 3 ? '書類を提出する' :
    '次へ →';

  return (
    <div className="min-h-screen bg-zinc-950">
      <ScrollHeader />

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        {/* トップへ戻るリンク */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-teal-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            トップページへ
          </Link>
        </div>

        {/* ページタイトル */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">会員登録</h1>
          <p className="text-zinc-400 text-sm">
            amistaへようこそ。以下のフォームをご入力ください。
          </p>
        </div>

        {/* ステップインジケーター */}
        <StepIndicator step={step} />

        {/* フォームカード */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 md:p-8">
          {step === 1 && (
            <Step1 data={data} onChange={onChange} onPhoneChange={onPhoneChange} onRadio={onRadio} errors={errors} isGoogleUser={isGoogleUser} />
          )}
          {step === 2 && (
            <Step2 data={data} onChange={onChange} onRadio={onRadio} onFertilityMethodToggle={onFertilityMethodToggle} errors={errors} />
          )}
          {step === 3 && (
            <Step3
              docType={docType}
              setDocType={setDocType}
              frontPreview={frontPreview}
              backPreview={backPreview}
              onFrontFile={handleFile('front')}
              onBackFile={handleFile('back')}
              onFrontClear={handleClear('front')}
              onBackClear={handleClear('back')}
              isSameFile={isSameFile}
            />
          )}
          {step === 4 && <Step4 />}

          {/* ナビゲーションボタン */}
          {step < 4 && (
            <div className="mt-8 pt-6 border-t border-zinc-800 space-y-3">
              {submitError && (
                <p className="text-red-400 text-sm text-center">{submitError}</p>
              )}
              <div className={`flex ${step > 1 ? 'justify-between' : 'justify-end'}`}>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-5 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors"
                  >
                    ← 戻る
                  </button>
                )}
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={(step === 3 && !step3Valid) || isLoading}
                  isLoading={step === 3 && isLoading}
                >
                  {nextLabel}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ログインリンク */}
        {step < 4 && (
          <p className="text-center text-zinc-500 text-sm mt-6">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/login" className="text-teal-400 hover:text-teal-300 transition-colors">
              ログイン
            </Link>
          </p>
        )}
      </div>
      <ScrollToTop />
    </div>
  );
}
