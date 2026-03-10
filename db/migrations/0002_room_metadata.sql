alter table rooms
  add column if not exists description text null,
  add column if not exists scheduled_label text null;
