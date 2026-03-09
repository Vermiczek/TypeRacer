import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  wpm: z.number().int().min(0).max(300),
  accuracy: z.number().min(0).max(1),
});

export async function POST(request: NextRequest) {
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

  // Fetch current stats to compute new rolling average
  const { data: player, error: fetchError } = await supabase
    .from("players")
    .select("games_played, best_wpm, avg_accuracy")
    .eq("id", user.id)
    .single();

  if (fetchError || !player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  const newGamesPlayed = player.games_played + 1;
  const newBestWpm = Math.max(player.best_wpm, wpm);
  const newAvgAccuracy =
    (Number(player.avg_accuracy) * player.games_played + accuracy) /
    newGamesPlayed;

  const { error: updateError } = await supabase
    .from("players")
    .update({
      games_played: newGamesPlayed,
      best_wpm: newBestWpm,
      avg_accuracy: newAvgAccuracy,
    })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, newBestWpm, newAvgAccuracy });
}
