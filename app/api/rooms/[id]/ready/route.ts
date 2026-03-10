import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/rooms/[id]/ready — toggle ready status for current player
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

  const { data: rp } = await supabase
    .from("room_players")
    .select("is_ready")
    .eq("room_id", roomId)
    .eq("player_id", user.id)
    .single();

  if (!rp) {
    return NextResponse.json({ error: "Not in room" }, { status: 404 });
  }

  await supabase
    .from("room_players")
    .update({ is_ready: !rp.is_ready })
    .eq("room_id", roomId)
    .eq("player_id", user.id);

  return NextResponse.json({ ok: true, is_ready: !rp.is_ready });
};
