-- The word of the day: one reflection per day and language, written by
-- DeepSeek on the verse of the day the first time someone opens the app,
-- then read by everyone that day.
create table if not exists daily_reflections (
  day date not null,
  locale text not null check (locale in ('es', 'en')),
  verse_id text not null,
  text text not null,
  created_at timestamptz not null default now(),
  primary key (day, locale)
);

alter table daily_reflections enable row level security;
revoke all on daily_reflections from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on daily_reflections from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on daily_reflections from authenticated;
  end if;
end $$;
