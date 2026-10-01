-- Verses DeepSeek added to a theme (Admin → Temas). Only references are
-- kept here: each one was checked against the Bible and its text fetched
-- from the Recovery Version (kept in verse_texts) before it was published.
create table if not exists theme_verses (
  theme_id text not null,
  verse_id text not null,
  ref text not null,
  created_at timestamptz not null default now(),
  primary key (theme_id, verse_id)
);

alter table theme_verses enable row level security;
revoke all on theme_verses from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on theme_verses from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on theme_verses from authenticated;
  end if;
end $$;
