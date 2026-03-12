export interface RoomPlayer {
  count: number;
}

export interface Room {
  id: string;
  name: string;
  status: "waiting" | "playing" | "finished";
  max_players: number;
  word_count: number;
  time_limit: number | null;
  is_ranked: boolean;
  has_password: boolean;
  created_at: string;
  host: { username: string } | null;
  room_players: RoomPlayer[];
}
