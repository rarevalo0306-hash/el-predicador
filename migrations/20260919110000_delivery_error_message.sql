-- Twilio rejections arrive as a bare numeric code, and several are absent from
-- the public error dictionary. Keep the provider's own sentence so the owner
-- reads what went wrong instead of looking up a number.
alter table message_deliveries
  add column if not exists error_message text;
