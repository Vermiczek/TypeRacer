import { ProgressMap, RoomPlayer } from "../types";

const OpponentBars = ({
  players,
  currentUserId,
  progress,
  sentenceLen,
}: {
  players: RoomPlayer[];
  currentUserId: string;
  progress: ProgressMap;
  sentenceLen: number;
}) => {
  const others = players.filter((p) => p.player_id !== currentUserId);
  if (!others.length) return null;

  return (
    <div className="space-y-2">
      {others.map((rp) => {
        const pct = rp.finished_at
          ? 100
          : Math.min(100, Math.round(((progress[rp.player_id] ?? 0) / sentenceLen) * 100));
        return (
          <div key={rp.player_id}>
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>{rp.players?.username ?? "—"}</span>
              {rp.finished_at && rp.wpm != null && (
                <span className="text-emerald-500 dark:text-emerald-400">{rp.wpm} WPM</span>
              )}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OpponentBars;
