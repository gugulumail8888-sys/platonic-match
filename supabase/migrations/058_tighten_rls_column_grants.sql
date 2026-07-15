-- profiles: アプリはAPI経由(サービスロール)でのみ更新しており、
-- クライアント側からの直接自己更新ポリシーは使用されていない。
-- 行所有者チェックのみで列の制限がなく、role・status・is_premium等の重要列も
-- 自己書き換え可能な状態だったため、セキュリティ点検により削除する(2026/7/15)。
DROP POLICY IF EXISTS "ユーザーは自分のプロフィールを更新できる" ON public.profiles;

-- matchings: 「交際希望を伝える」機能でのみクライアントから直接UPDATEが行われている
-- (applicant_dating_wish・dating_wish_atの2列のみ)。既存のRLSポリシー(行所有者チェック)は
-- 列を制限していないため、payment_intent_id等の重要列も書き換え可能な状態だった。
-- 列レベル権限で実際に必要な2列のみに制限する(2026/7/15)。
REVOKE UPDATE ON public.matchings FROM authenticated;
GRANT UPDATE (applicant_dating_wish, dating_wish_at) ON public.matchings TO authenticated;
