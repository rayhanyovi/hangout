create table if not exists schema_migrations (
  migration_name text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists rooms (
  room_id text primary key,
  join_code text not null unique,
  title text null,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  created_by_member_id text not null,
  transport_mode text not null,
  privacy_mode text not null,
  venue_preferences jsonb not null,
  midpoint jsonb null,
  finalized_decision jsonb null,
  status text not null
);

create table if not exists members (
  member_id text primary key,
  room_id text not null references rooms(room_id) on delete cascade,
  display_name text not null,
  role text not null,
  joined_at timestamptz not null,
  last_active_at timestamptz not null,
  location jsonb null
);

create index if not exists idx_members_room_id on members(room_id);

create table if not exists votes (
  vote_id text primary key,
  room_id text not null references rooms(room_id) on delete cascade,
  member_id text not null references members(member_id) on delete cascade,
  venue_id text not null,
  reaction text null,
  comment text null,
  updated_at timestamptz not null,
  unique (room_id, member_id)
);

create index if not exists idx_votes_room_id on votes(room_id);

create table if not exists venue_cache (
  room_id text primary key references rooms(room_id) on delete cascade,
  venues jsonb not null,
  updated_at timestamptz not null
);
