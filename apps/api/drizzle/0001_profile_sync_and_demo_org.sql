-- Keep profiles mirrored from better-auth users (replaces the old auth.users trigger).
CREATE OR REPLACE FUNCTION public.sync_profile_from_user() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, nullif(NEW.email, ''), nullif(NEW.name, ''))
  ON CONFLICT (user_id) DO UPDATE SET email = excluded.email;
  RETURN NEW;
END; $$;
--> statement-breakpoint
CREATE TRIGGER user_profile_sync AFTER INSERT OR UPDATE OF email ON "user"
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_user();
--> statement-breakpoint
-- Demo workspace joined by "Try the demo" guests (data is seeded on join / by cron).
INSERT INTO public.orgs (name, slug) VALUES ('Rimba Ventures Sdn Bhd', 'rimba-ventures-demo')
ON CONFLICT (slug) DO NOTHING;
