-- Add status/role columns to profiles (matches schema expected by backup.sql)
ALTER TABLE public.profiles
  ADD COLUMN status text DEFAULT 'pending'::text NOT NULL,
  ADD COLUMN role text DEFAULT 'user'::text NOT NULL;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['user'::text, 'admin'::text]));
