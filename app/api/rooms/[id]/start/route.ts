import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/rooms/[id]/start — host only; fetches a sentence and flips status to 'playing'
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

  // Only host can start
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("host_id, status, word_count")
    .eq("id", roomId)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (room.host_id !== user.id) {
    return NextResponse.json({ error: "Only the host can start" }, { status: 403 });
  }
  if (room.status !== "waiting") {
    return NextResponse.json({ error: "Game already started" }, { status: 409 });
  }

  // Fetch a sentence using the room's word count
  const { data: words } = await supabase.rpc("get_random_words", { count: room.word_count ?? 20 });
  const sentence = words?.length
    ? (words as string[]).join(" ").replace(/^\w/, (c) => c.toUpperCase()) + "."
    : "The quick brown fox jumps over the lazy dog.";

  const startedAt = new Date(Date.now() + 10_000).toISOString();

  const { error: updateError } = await supabase
    .from("rooms")
    .update({ status: "playing", sentence, started_at: startedAt })
    .eq("id", roomId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sentence });
}
