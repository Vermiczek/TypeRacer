import { Room } from "../types";
import StatusBadge from "./StatusBadge";

const RoomSection = ({
  title,
  rooms,
  joiningId,
  onJoin,
  emptyText,
}: {
  title: string;
  rooms: Room[];
  joiningId: string | null;
  onJoin: (room: Room) => void;
  emptyText?: string;
}) => {
  return (
    <div className="space-y-3">
      <h2 className="text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{title}</h2>
      {rooms.length === 0 && emptyText ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-600">{emptyText}</p>
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
          {rooms.map((room) => {
            const count = room.room_players[0]?.count ?? 0;
            const full = count >= room.max_players;
            return (
              <div key={room.id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-medium text-sm">
                    {room.has_password && (
                      <span className="text-zinc-400 dark:text-zinc-500" title="Password protected">🔒</span>
                    )}
                    {room.name}
                    {room.is_ranked && (
                      <span className="ml-1 rounded-full border border-amber-700 bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-300">
                        Ranked
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    by {room.host?.username ?? "—"} ·{" "}
                    <span className={full ? "text-red-500 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}>
                      {count}/{room.max_players} players
                    </span>
                    {" · "}{room.word_count}w
                    {room.time_limit != null && ` · ${room.time_limit >= 60 ? `${room.time_limit / 60}min` : `${room.time_limit}s`}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <StatusBadge status={room.status} />
                  {room.status === "waiting" && (
                    <button
                      onClick={() => onJoin(room)}
                      disabled={full || joiningId === room.id}
                      className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 disabled:opacity-40 transition"
                    >
                      {joiningId === room.id ? "Joining…" : full ? "Full" : "Join"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoomSection;
