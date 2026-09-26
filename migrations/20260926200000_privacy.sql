-- Registrations, accounts and everyone's saved state are read only by the
-- app's own server. Production already has row security on and no access for
-- Supabase's public roles; this writes it down so a new database starts the
-- same way. The server connects as the table owner, so nothing it does changes.
do $$
declare
  t text;
begin
  foreach t in array array['contacts', 'preacher_state', 'user', 'session', 'account', 'verification', '_migrations']
  loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('revoke all on public.%I from public', t);
      if exists (select 1 from pg_roles where rolname = 'anon') then
        execute format('revoke all on public.%I from anon', t);
      end if;
      if exists (select 1 from pg_roles where rolname = 'authenticated') then
        execute format('revoke all on public.%I from authenticated', t);
      end if;
    end if;
  end loop;
end $$;

-- How often the public "Quiero recibir la palabra" form is sent, so it
-- cannot be flooded. Keys are salted hashes, never an address or an email.
create table if not exists form_throttle (
  key text not null,
  at timestamptz not null default now()
);
create index if not exists form_throttle_key_at on form_throttle (key, at);

alter table form_throttle enable row level security;
revoke all on form_throttle from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on form_throttle from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on form_throttle from authenticated;
  end if;
end $$;
