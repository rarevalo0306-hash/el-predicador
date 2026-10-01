-- The blessing that greets a signed-in person on Hoy ("Hola, Ricardo. Que el
-- Señor…"): one line per day and language, written by DeepSeek the first
-- time someone asks that day, then read by everyone. The name is added by
-- the app, never sent to DeepSeek.
create table if not exists daily_blessings (
  day date not null,
  locale text not null check (locale in ('es', 'en')),
  text text not null,
  created_at timestamptz not null default now(),
  primary key (day, locale)
);

alter table daily_blessings enable row level security;
revoke all on daily_blessings from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on daily_blessings from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on daily_blessings from authenticated;
  end if;
end $$;
