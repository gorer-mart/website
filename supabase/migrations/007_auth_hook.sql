-- ============================================================
-- GORER MART — AUTH HOOK: Auto-Create User Profile
-- ============================================================
-- This function is triggered when a new user signs up via
-- Supabase Auth (including Google Sign-In). It automatically
-- creates a row in the public.users table with the profile
-- data from the auth metadata.
--
-- To activate, go to Supabase Dashboard:
--   Database → Triggers → Create Trigger
--   Table: auth.users | Event: INSERT
--   Function: handle_new_user
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert (new signup)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Auto-creates public profile on signup (Google Sign-In compatible)';
