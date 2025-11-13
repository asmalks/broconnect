-- Ensure profiles exist for all users
INSERT INTO public.profiles (id, full_name, email, center)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'full_name','User'),
       u.email,
       COALESCE(u.raw_user_meta_data->>'center','Not Set')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Ensure a role exists for all users (default to student)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'student'::app_role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL;

-- Drop old constraints that point to auth.users (if present)
ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_user_id_fkey;
ALTER TABLE public.meetings DROP CONSTRAINT IF EXISTS meetings_student_id_fkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Add new FK constraints pointing to profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'complaints_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.complaints
    ADD CONSTRAINT complaints_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'meetings_student_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.meetings
    ADD CONSTRAINT meetings_student_id_profiles_fkey
    FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure profiles.id references auth.users (if not already)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_auth_fkey'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_auth_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_student_id ON public.meetings(student_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
