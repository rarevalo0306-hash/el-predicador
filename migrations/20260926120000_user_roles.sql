-- Managers: people the owner (CONTACTS_ADMIN_USER_IDS) or another manager
-- trusted with the Admin tab, automatic SMS and a higher AI limit. The
-- owner is never stored here; that stays in the deployment's settings.
create table if not exists user_roles (
  user_id text primary key,
  role text not null check (role in ('manager')),
  granted_by text not null,
  created_at timestamptz not null default now()
);

alter table user_roles enable row level security;
revoke all on user_roles from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on user_roles from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on user_roles from authenticated;
  end if;
end $$;
