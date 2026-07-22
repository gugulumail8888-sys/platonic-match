-- テスト用・管理者用アカウントを、一般会員向けの会員一覧・検索・AIおすすめマッチング・
-- 管理画面の各種集計から除外するためのフラグ。
-- (2026/7/22、ユーザー依頼：本番公開後もテストIDを残して動作確認したいが、
--  一般会員の目に触れたり集計に混入したりしないようにしたい)

alter table public.profiles
  add column if not exists is_test_account boolean not null default false;

comment on column public.profiles.is_test_account is
  'true の場合、社内テスト・動作確認用のアカウント。会員一覧/検索/AIおすすめの候補者からは除外し、管理画面の集計対象からも除外する。';

create index if not exists idx_profiles_is_test_account
  on public.profiles (is_test_account)
  where is_test_account = true;
