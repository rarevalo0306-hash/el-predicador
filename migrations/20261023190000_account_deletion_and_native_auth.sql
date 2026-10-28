-- Associate NEW registrations with the authenticated owner. Legacy rows are
-- linked only for verified email ownership; guessing from unverified email
-- would let an attacker delete someone else's public registration.
alter table contacts add column if not exists user_id text references "user"(id) on delete cascade;
create index if not exists contacts_user_idx on contacts(user_id);
update contacts c set user_id = u.id from "user" u
where c.user_id is null and u."emailVerified" = true and lower(c.email) = lower(u.email);

-- Enforce new writes without failing on pre-existing orphan rows. In-flight
-- authenticated writes cannot recreate state after their user was deleted.
alter table preacher_state add constraint preacher_state_user_fk foreign key (user_id) references "user"(id) on delete cascade not valid;
alter table ask_quota add constraint ask_quota_user_fk foreign key (user_id) references "user"(id) on delete cascade not valid;
alter table user_roles add constraint user_roles_user_fk foreign key (user_id) references "user"(id) on delete cascade not valid;

-- App data removal runs in the SAME transaction as the auth user deletion.
-- message_schedules/deliveries, sessions, accounts and linked contacts already cascade.
create or replace function preacher_delete_user_data() returns trigger language plpgsql as $$
begin
  if old."emailVerified" then
    delete from contacts where user_id is null and lower(email) = lower(old.email);
  end if;
  delete from preacher_state where user_id = old.id;
  delete from ask_quota where user_id = old.id;
  delete from user_roles where user_id = old.id;
  update user_roles set granted_by = 'deleted-user' where granted_by = old.id;
  delete from verification where value = old.id;
  return old;
end;
$$;
drop trigger if exists preacher_user_deletion on "user";
create trigger preacher_user_deletion before delete on "user"
for each row execute function preacher_delete_user_data();

-- OAuth handoff: only an encrypted cookie, hashed one-use code and PKCE challenge.
create table if not exists native_auth_handoffs (
  code_hash text primary key,
  challenge text not null,
  cookie_ciphertext text not null,
  session_id text not null references "session"(id) on delete cascade,
  user_id text not null references "user"(id) on delete cascade,
  expires_at timestamptz not null
);
create index if not exists native_auth_expiry_idx on native_auth_handoffs(expires_at);
alter table native_auth_handoffs enable row level security;
revoke all on native_auth_handoffs from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on native_auth_handoffs from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on native_auth_handoffs from authenticated;
  end if;
end $$;
