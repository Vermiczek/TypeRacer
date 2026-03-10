import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MultiLobby from "./MultiLobby";

const MultiPlayerPage = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [playerResult, roomsResult] = await Promise.all([
    supabase.from("players").select("username").eq("id", user.id).single(),
    supabase
      .from("rooms")
      .select(
        `id, name, status, max_players, word_count, time_limit, created_at, password_hash,
         host:players!rooms_host_id_fkey(username),
         room_players(count)`
      )
      .in("status", ["waiting", "playing"])
      .order("created_at", { ascending: false }),
  ]);

  const rooms = (roomsResult.data ?? []).map(({ password_hash, ...room }) => ({
    ...room,
    has_password: password_hash !== null,
  }));

  return (
    <MultiLobby
      username={playerResult.data?.username ?? "Player"}
      initialRooms={rooms as never}
    />
  );
};

export default MultiPlayerPage;
