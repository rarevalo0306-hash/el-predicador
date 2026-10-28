-- iPhones that asked for the daily reminder. No account or personal data:
-- an Apple device token, the chosen hour, language and time zone.
create table push_devices (
  token text primary key,
  environment text not null default 'production' check (environment in ('production', 'sandbox')),
  hour integer not null check (hour between 0 and 23),
  locale text not null default 'es' check (locale in ('es', 'en')),
  time_zone text not null,
  last_sent_day text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table push_devices enable row level security;
revoke all on push_devices from public;
