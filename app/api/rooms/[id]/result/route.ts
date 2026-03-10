import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  wpm: z.number().int().min(0).max(300).nullable(),
  accuracy: z.number().min(0).max(1).nullable(),
});

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

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { wpm, accuracy } = parsed.data;

  await supabase
    .from("room_players")
    .update({ wpm, accuracy, finished_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("player_id", user.id);

  // Check if all players in this room have finished
  const { data: unfinished } = await supabase
    .from("room_players")
    .select("player_id", { count: "exact", head: false })
    .eq("room_id", roomId)
    .is("finished_at", null);

  if (!unfinished?.length) {
    await supabase
      .from("rooms")
      .update({ status: "finished" })
      .eq("id", roomId);
  }

  // Update leaderboard stats only for ranked rooms with a real finish (non-DNF)
  if (wpm !== null && accuracy !== null) {
    const { data: room } = await supabase
      .from("rooms")
      .select("is_ranked")
      .eq("id", roomId)
      .single();

    if (room?.is_ranked) {
      const { data: player } = await supabase
        .from("players")
        .select("games_played, best_wpm, avg_accuracy")
        .eq("id", user.id)
        .single();

      if (player) {
        const newGamesPlayed = player.games_played + 1;
        const newBestWpm = Math.max(player.best_wpm, wpm);
        const newAvgAccuracy =
          (Number(player.avg_accuracy) * player.games_played + accuracy) / newGamesPlayed;

        await supabase
          .from("players")
          .update({ games_played: newGamesPlayed, best_wpm: newBestWpm, avg_accuracy: newAvgAccuracy })
          .eq("id", user.id);
      }
    }
  }

  return NextResponse.json({ ok: true });
};
