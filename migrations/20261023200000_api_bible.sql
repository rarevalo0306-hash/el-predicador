-- One persistent budget shared by every backend instance. No public access.
create table api_bible_budget (
  period text primary key,
  calls integer not null default 0 check (calls between 0 and 5000),
  attempts timestamptz[] not null default array[]::timestamptz[],
  blocked_until timestamptz
);
create table api_bible_cache (
  key text primary key,
  payload jsonb,
  expires_at timestamptz,
  lease_until timestamptz,
  lease_token text
);
alter table api_bible_budget enable row level security;
alter table api_bible_cache enable row level security;
revoke all on api_bible_budget, api_bible_cache from public;

-- These tables are generated provider caches, never user-authored notes.
delete from verse_texts;
-- Old pending fixed-text sends could contain the withdrawn translation.
-- Pause them for the owner to review; preserve every record and schedule.
update message_schedules set enabled=false, next_run_at=null where theme_id is null;
-- Remove only Scripture text from stored verseMemory; preserve reference IDs.
update preacher_state set payload=(payload::jsonb || jsonb_build_object('verseMemory',
  coalesce((select jsonb_object_agg(key, value - 'text' - 'source' - 'copyright' - 'expiresAt' || '{"text":""}'::jsonb)
    from jsonb_each(coalesce(payload::jsonb->'verseMemory','{}'::jsonb))), '{}'::jsonb)))::text
where jsonb_typeof(payload::jsonb->'verseMemory')='object';
