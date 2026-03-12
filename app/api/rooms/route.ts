import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";

const createSchema = z.object({
  name: z.string().min(1).max(40).trim(),
  maxPlayers: z.number().int().min(2).max(10).default(6),
  wordCount: z.number().int().min(5).max(100).default(20),
  timeLimit: z.number().int().min(30).max(600).nullable().default(null),
  password: z.string().max(100).optional(),
  isRanked: z.boolean().default(false),
});

const hashPassword = (password: string): string => {
  return createHash("sha256").update(`typeracer:${password}`).digest("hex");
}

// GET /api/rooms — list open rooms with player count
export const GET = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rooms")
    .select(
      `id, name, status, max_players, word_count, time_limit, is_ranked, created_at, password_hash,
       host:players!rooms_host_id_fkey(username),
       room_players(count)`
    )
    .in("status", ["waiting", "playing"])
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }

  const rooms = (data ?? []).map(({ password_hash, ...room }) => ({
    ...room,
    has_password: password_hash !== null,
  }));

  return NextResponse.json({ rooms });
}

// POST /api/rooms — create a room and auto-join as host
export const POST = async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { name, maxPlayers, isRanked, timeLimit, password } = parsed.data;
  const wordCount = isRanked ? 50 : parsed.data.wordCount;
  const password_hash = password ? hashPassword(password) : null;

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({ name, host_id: user.id, max_players: maxPlayers, word_count: wordCount, time_limit: timeLimit, password_hash, is_ranked: isRanked })
    .select("id")
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }

  await supabase
    .from("room_players")
    .insert({ room_id: room.id, player_id: user.id });

  return NextResponse.json({ room }, { status: 201 });
}
