import { RoomPlayer } from "../types";

const FinishedView = ({
  players,
  isHost,
  onRestart,
  onLeave,
}: {
  players: RoomPlayer[];
  isHost: boolean;
  onRestart: () => void;
  onLeave: () => void;
}) => {
  const sorted = [...players].sort((a, b) => (b.wpm ?? -1) - (a.wpm ?? -1));

  return (
    <div className="w-full max-w-md space-y-6">
      <h2 className="text-center text-xs uppercase tracking-widest text-zinc-500">Results</h2>
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
        {sorted.map((rp, i) => (
          <div key={rp.player_id} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500 w-4">{i + 1}</span>
              <span className="text-sm font-medium">{rp.players?.username ?? "—"}</span>
            </div>
            <div className="text-right text-sm">
              {rp.wpm != null ? (
                <>
                  <span className={`font-bold tabular-nums ${i === 0 ? "text-amber-500 dark:text-amber-400" : "text-zinc-900 dark:text-white"}`}>
                    {rp.wpm} WPM
                  </span>
                  <span className="ml-2 text-zinc-500">
                    {Math.round((rp.accuracy ?? 0) * 100)}%
                  </span>
                </>
              ) : (
                <span className="text-zinc-400 dark:text-zinc-600">DNF</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        {isHost && (
          <button
            onClick={onRestart}
            className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition"
          >
            Play again
          </button>
        )}
        <button
          onClick={onLeave}
          className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 py-3 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 transition"
        >
          Back to lobby
        </button>
      </div>
    </div>
  );
};

export default FinishedView;
