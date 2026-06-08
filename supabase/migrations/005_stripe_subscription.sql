-- Add Stripe subscription columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN stripe_customer_id text,
  ADD COLUMN stripe_subscription_id text,
  ADD COLUMN subscription_status text,
  ADD COLUMN subscription_plan text;
