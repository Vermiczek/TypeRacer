-- Players table (extends auth.users)
create table public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  games_played integer not null default 0,
  best_wpm integer not null default 0,
  avg_accuracy numeric(5, 4) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Game rounds table
create table public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  sentence text not null,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  is_active boolean not null default true
);

-- Round results (per player per round)
create table public.round_results (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.game_rounds (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  wpm integer not null default 0,
  accuracy numeric(5, 4) not null default 0,
  finished_at timestamptz,
  unique (round_id, player_id)
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index on public.round_results (round_id);
create index on public.round_results (player_id);
create index on public.game_rounds (is_active, ends_at);

-- ── Auto-update updated_at ───────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger players_updated_at
  before update on public.players
  for each row execute function public.handle_updated_at();

-- ── Auto-create player row on signup ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.players (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.players enable row level security;
alter table public.game_rounds enable row level security;
alter table public.round_results enable row level security;

-- Players: anyone can read, only owner can update their own row
create policy "players_select" on public.players for select using (true);
create policy "players_update" on public.players for update using (auth.uid() = id);

-- Game rounds: anyone can read
create policy "rounds_select" on public.game_rounds for select using (true);

-- Round results: anyone can read, players insert/update their own
create policy "results_select" on public.round_results for select using (true);
create policy "results_insert" on public.round_results for insert with check (auth.uid() = player_id);
create policy "results_update" on public.round_results for update using (auth.uid() = player_id);
