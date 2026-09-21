-- A schedule can follow a theme instead of one fixed verse: each send takes
-- the next verse of the theme and one of the short lines written for it.
-- The verse texts and the lines are prepared once by the owner (Admin →
-- Frases) and kept here, so a send never waits on an outside service.
create table if not exists verse_texts (
  verse_id text not null,
  locale text not null check (locale in ('es', 'en')),
  ref text not null,
  text text not null,
  source text,
  updated_at timestamptz not null default now(),
  primary key (verse_id, locale)
);

create table if not exists verse_notes (
  id serial primary key,
  verse_id text not null,
  locale text not null check (locale in ('es', 'en')),
  position int not null,
  text text not null check (length(text) between 1 and 300),
  created_at timestamptz not null default now(),
  unique (verse_id, locale, position)
);

alter table message_schedules
  add column if not exists theme_id text,
  add column if not exists sender_name text;

-- A theme schedule composes its message at send time, so the fixed text may
-- be empty for it and only for it.
alter table message_schedules drop constraint if exists message_schedules_message_check;
alter table message_schedules
  add constraint message_schedules_message_check
  check (length(message) <= 1000 and (theme_id is not null or length(message) >= 1));

alter table verse_texts enable row level security;
alter table verse_notes enable row level security;
revoke all on verse_texts, verse_notes from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on verse_texts, verse_notes from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on verse_texts, verse_notes from authenticated;
  end if;
end $$;
