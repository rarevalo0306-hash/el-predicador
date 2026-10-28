-- One generated picture per day for the Home post. Only the server reads it.
create table daily_photos (
  day text primary key,
  theme text not null,
  ref text not null,
  mime text not null,
  data bytea not null,
  created_at timestamptz not null default now()
);
alter table daily_photos enable row level security;
revoke all on daily_photos from public;
