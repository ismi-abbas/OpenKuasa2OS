-- One-off: copy Supabase Auth users into better-auth tables, keeping ids (as text) and
-- bcrypt password hashes (auth.ts verifies bcrypt). Run on a database that still has the
-- Supabase `auth` schema, after `pnpm db:migrate`. Anonymous (demo) users are skipped.
-- TOTP factors are NOT migrated: users with 2FA re-enrol (twoFactor plugin).
insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
select id::text,
       coalesce(nullif(raw_user_meta_data->>'full_name', ''), split_part(email, '@', 1)),
       email, email_confirmed_at is not null, created_at, coalesce(updated_at, created_at)
from auth.users
where email is not null and coalesce(is_anonymous, false) = false
on conflict (id) do nothing;

insert into account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
select gen_random_uuid()::text, id::text, 'credential', id::text, encrypted_password, created_at, coalesce(updated_at, created_at)
from auth.users
where email is not null and coalesce(is_anonymous, false) = false and encrypted_password <> ''
on conflict do nothing;
