-- Add started_at to rooms for server-authoritative countdown sync
alter table public.rooms add column started_at timestamptz;

-- Add is_ready to room_players for per-player ready status
alter table public.room_players add column is_ready boolean not null default false;
