-- The app keeps no Bible text. Living Stream Ministry (Recobro) and The
-- Lockman Foundation (LBLA, NASB) do not allow storing their text, nor works
-- derived from it; every screen and every send now reads it live and keeps
-- only the reference.

-- Copies of verse text kept for scheduled sends and the daily reflection.
drop table if exists verse_texts;

-- Lines and reflections the AI wrote from that text. New ones are written
-- from the reference alone: Admin → Frases writes the lines again, and the
-- word of the day is written again on the first visit of the day.
delete from verse_notes;
delete from daily_reflections;

-- A chosen verse is read when it is sent, so its schedule keeps only the
-- sender's own note. Until now its message was the whole verse and nothing
-- else, so it becomes empty.
alter table message_schedules drop constraint if exists message_schedules_message_check;
update message_schedules set message = '' where theme_id is null and verse_id is not null;
alter table message_schedules
  add constraint message_schedules_message_check
  check (
    length(message) <= 1000
    and (theme_id is not null or verse_id is not null or length(message) >= 1)
  );

-- Verses people saved keep their reference and lose the text, the same rule
-- the app applies (verse-memory.ts): the AI's case letters, the prayer and
-- the NWT comparisons are the app's own writing and stay.
update preacher_state
set payload = jsonb_set(
    payload::jsonb,
    '{verseMemory}',
    coalesce(
      (
        select jsonb_object_agg(
          entry.key,
          case
            when entry.key like 'caso-ia-%' or entry.key like 'nwt-%' or entry.key = 'evangelio-oracion'
              then entry.value
            when entry.key like 'doctrina-%' or entry.key like 'caso-%' or entry.key like 'nvi-%'
              or entry.key = 'evangelio-camino'
              or entry.key ~ '-range-[0-9,-]+$'
              or coalesce(entry.value ->> 'ref', '') ~ '[0-9]+\s*:\s*[0-9]+'
              then jsonb_set(entry.value, '{text}', '""'::jsonb)
            else entry.value
          end
        )
        from jsonb_each(payload::jsonb -> 'verseMemory') as entry
      ),
      '{}'::jsonb
    )
  )::text,
  updated_at = now()
where jsonb_typeof(payload::jsonb -> 'verseMemory') = 'object'
  and payload::jsonb -> 'verseMemory' <> '{}'::jsonb;
