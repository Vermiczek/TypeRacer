import { Room, RoomPlayer } from "../types";

const WaitingView = ({
  players,
  room,
  isHost,
  starting,
  currentUserId,
  onStart,
  onReady,
}: {
  players: RoomPlayer[];
  room: Room;
  isHost: boolean;
  starting: boolean;
  currentUserId: string;
  onStart: () => void;
  onReady: () => void;
}) => {
  const me = players.find((p) => p.player_id === currentUserId);
  const nonHostPlayers = players.filter((p) => p.player_id !== room.host_id);
  const allReady = players.length >= 2 && nonHostPlayers.every((p) => p.is_ready);

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-zinc-500">
          Players — {players.length}/{room.max_players}
        </h2>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
          {players.map((rp) => (
            <div key={rp.player_id} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-medium">{rp.players?.username ?? "—"}</span>
              <div className="flex items-center gap-2">
                {rp.player_id === room.host_id ? (
                  <span className="rounded-full bg-indigo-900/50 border border-indigo-700 px-2.5 py-0.5 text-xs text-indigo-300">
                    Host
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      rp.is_ready
                        ? "bg-emerald-900/50 border border-emerald-700 text-emerald-300"
                        : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-500"
                    }`}
                  >
                    {rp.is_ready ? "Ready" : "Not ready"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {!isHost && (
          <button
            onClick={onReady}
            className={`w-full rounded-xl py-3 font-semibold transition ${
              me?.is_ready
                ? "bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {me?.is_ready ? "Cancel ready" : "Ready up"}
          </button>
        )}
        {isHost && (
          <button
            onClick={onStart}
            disabled={!allReady || starting}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 transition"
          >
            {starting
              ? "Starting…"
              : !allReady
              ? players.length < 2
                ? "Waiting for players…"
                : "Waiting for everyone to ready up…"
              : "Start game"}
          </button>
        )}
      </div>
    </div>
  );
};

export default WaitingView;
