-- Enable Realtime for rooms and room_players so lobby and room pages
-- receive live updates via postgres_changes subscriptions.
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_players;
