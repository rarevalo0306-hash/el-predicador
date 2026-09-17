create table if not exists message_schedules (
  id text primary key,
  user_id text not null references "user"(id) on delete cascade,
  recipient_name text not null,
  phone text not null,
  message text not null check (length(message) between 1 and 1000),
  channel text not null check (channel in ('whatsapp', 'sms')),
  days jsonb not null,
  send_time text not null,
  time_zone text not null,
  consent boolean not null default false,
  enabled boolean not null default false,
  next_run_at timestamptz,
  lease_until timestamptz,
  lease_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists message_schedules_user_idx on message_schedules(user_id);
create index if not exists message_schedules_due_idx on message_schedules(next_run_at) where enabled;

create table if not exists message_deliveries (
  id text primary key,
  schedule_id text not null references message_schedules(id) on delete cascade,
  scheduled_for timestamptz not null,
  status text not null check (status in ('sending', 'accepted', 'failed', 'unknown', 'skipped')),
  provider_id text,
  error_code text,
  created_at timestamptz not null default now(),
  unique(schedule_id, scheduled_for)
);
-- Better Auth users access these tables only through owner-scoped server functions.
-- No Data API policies: the server's Postgres role is the sole data access path.
alter table message_schedules enable row level security;
alter table message_deliveries enable row level security;
revoke all on message_schedules, message_deliveries from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on message_schedules, message_deliveries from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on message_schedules, message_deliveries from authenticated;
  end if;
end $$;
