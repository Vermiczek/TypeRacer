import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const hashPassword = (password: string): string => {
  return createHash("sha256").update(`typeracer:${password}`).digest("hex");
}

// POST /api/rooms/[id]/join
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: roomId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const password: string | undefined = body?.password;

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, status, max_players, password_hash, room_players(count)")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.status !== "waiting") {
    return NextResponse.json({ error: "Game already started" }, { status: 409 });
  }

  if (room.password_hash) {
    if (!password || hashPassword(password) !== room.password_hash) {
      return NextResponse.json({ error: "Wrong password" }, { status: 403 });
    }
  }

  const playerCount = (room.room_players as unknown as { count: number }[])[0]?.count ?? 0;
  if (playerCount >= room.max_players) {
    return NextResponse.json({ error: "Room is full" }, { status: 409 });
  }

  const { error: joinError } = await supabase
    .from("room_players")
    .upsert({ room_id: roomId, player_id: user.id }, { onConflict: "room_id,player_id" });

  if (joinError) {
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, roomId });
}
