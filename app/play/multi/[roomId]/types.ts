export interface RoomPlayer {
  player_id: string;
  wpm: number | null;
  accuracy: number | null;
  finished_at: string | null;
  is_ready: boolean;
  players: { username: string } | null;
}

export interface Room {
  id: string;
  name: string;
  status: "waiting" | "playing" | "finished";
  sentence: string | null;
  max_players: number;
  host_id: string;
  time_limit: number | null;
  started_at: string | null;
  is_ranked: boolean;
  host: { username: string } | null;
  room_players: RoomPlayer[];
}

export type ProgressMap = Record<string, number>;
