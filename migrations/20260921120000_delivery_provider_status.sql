-- "Accepted" only means the provider queued the message; whether the carrier
-- delivered it comes later, through the provider's status callback. Keep that
-- final word next to the send-time outcome so the owner can see both.
alter table message_deliveries
  add column if not exists provider_status text,
  add column if not exists provider_error_code text,
  add column if not exists provider_status_at timestamptz;

create index if not exists message_deliveries_provider_id_idx
  on message_deliveries (provider_id);
