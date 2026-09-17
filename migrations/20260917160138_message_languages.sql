alter table message_schedules
  add column if not exists message_locale text not null default 'es' check (message_locale in ('es', 'en')),
  add column if not exists verse_id text;
