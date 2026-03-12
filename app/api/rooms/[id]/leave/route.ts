import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// DELETE /api/rooms/[id]/leave — remove the calling player from a room.
export const DELETE = async (
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

  await supabase
    .from("room_players")
    .delete()
    .eq("room_id", roomId)
    .eq("player_id", user.id);

  const { data: room } = await supabase
    .from("rooms")
    .select("status")
    .eq("id", roomId)
    .single();

  if (room?.status === "playing") {
    const { count } = await supabase
      .from("room_players")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId);

    if ((count ?? 0) === 0) {
      await supabase
        .from("rooms")
        .update({ status: "finished" })
        .eq("id", roomId);
    }
  }

  return NextResponse.json({ ok: true });
};
