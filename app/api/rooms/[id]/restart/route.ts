import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/rooms/[id]/restart — host only; resets the room back to waiting
export const POST = async (
  _request: NextRequest,
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

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("host_id, status")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (room.host_id !== user.id) {
    return NextResponse.json({ error: "Only the host can restart" }, { status: 403 });
  }
  if (room.status !== "finished") {
    return NextResponse.json({ error: "Game is not finished" }, { status: 409 });
  }

  await Promise.all([
    supabase
      .from("rooms")
      .update({ status: "waiting", sentence: null, started_at: null })
      .eq("id", roomId),
    supabase
      .from("room_players")
      .update({ wpm: null, accuracy: null, finished_at: null, is_ready: false })
      .eq("room_id", roomId),
  ]);

  return NextResponse.json({ ok: true });
};
