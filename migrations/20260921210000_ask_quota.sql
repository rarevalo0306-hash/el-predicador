-- "Pregunta": a signed-in person can ask the app about the Word a limited
-- number of times a day. Only the count is kept, never the questions.
create table if not exists ask_quota (
  user_id text not null,
  day date not null,
  count int not null default 0 check (count >= 0),
  primary key (user_id, day)
);

alter table ask_quota enable row level security;
revoke all on ask_quota from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on ask_quota from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on ask_quota from authenticated;
  end if;
end $$;
