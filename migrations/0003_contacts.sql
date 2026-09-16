create table if not exists contacts (
  id serial primary key,
  name text not null,
  email text not null,
  phone text not null,
  address text not null,
  locale text not null default 'es',
  created_at timestamptz not null default now()
);

create unique index if not exists contacts_email_lower_idx on contacts (lower(email));
