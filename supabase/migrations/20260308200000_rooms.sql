-- Multiplayer rooms (lobby)
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  host_id uuid not null references public.players (id) on delete cascade,
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'finished')),
  sentence text,
  max_players integer not null default 6,
  created_at timestamptz not null default now()
);

-- Players currently inside a room
create table public.room_players (
  room_id uuid not null references public.rooms (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  wpm integer,
  accuracy numeric(5, 4),
  finished_at timestamptz,
  primary key (room_id, player_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index on public.rooms (status, created_at desc);
create index on public.room_players (room_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;

-- Rooms: anyone can read; only host can insert/update their own room
create policy "rooms_select" on public.rooms for select using (true);
create policy "rooms_insert" on public.rooms for insert with check (auth.uid() = host_id);
create policy "rooms_update" on public.rooms for update using (auth.uid() = host_id);
create policy "rooms_delete" on public.rooms for delete using (auth.uid() = host_id);

-- Room players: anyone can read; players manage their own membership
create policy "room_players_select" on public.room_players for select using (true);
create policy "room_players_insert" on public.room_players for insert with check (auth.uid() = player_id);
create policy "room_players_update" on public.room_players for update using (auth.uid() = player_id);
create policy "room_players_delete" on public.room_players for delete using (auth.uid() = player_id);
