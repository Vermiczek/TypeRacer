import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import RoomLobby from "./RoomLobby";

const RoomPage = async ({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) => {
  const { roomId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [roomResult, playerResult] = await Promise.all([
    supabase
      .from("rooms")
      .select(
        `id, name, status, max_players, host_id, time_limit, started_at, is_ranked,
         host:players!rooms_host_id_fkey(username),
         room_players(player_id, wpm, accuracy, finished_at, is_ready, players(username))`
      )
      .eq("id", roomId)
      .single(),
    supabase.from("players").select("username").eq("id", user.id).single(),
  ]);

  if (roomResult.error || !roomResult.data) notFound();

  const room = roomResult.data;


  // This handles page refreshes where the beforeunload beacon removed them.
  if (room.status === "waiting" || room.status === "playing") {
    await supabase
      .from("room_players")
      .upsert(
        { room_id: roomId, player_id: user.id },
        { onConflict: "room_id,player_id" }
      );
  }

  return (
    <RoomLobby
      room={room as never}
      currentUserId={user.id}
      username={playerResult.data?.username ?? "Player"}
    />
  );
};

export default RoomPage;
