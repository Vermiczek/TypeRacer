import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";

const LeaderboardPage = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [playersResult, currentPlayerResult] = await Promise.all([
    supabase
      .from("players")
      .select("id, username, best_wpm, avg_accuracy, games_played")
      .gt("games_played", 0)
      .order("best_wpm", { ascending: false })
      .limit(100),
    supabase
      .from("players")
      .select("username")
      .eq("id", user.id)
      .single(),
  ]);

  const players = playersResult.data ?? [];
  const username = currentPlayerResult.data?.username ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm text-zinc-900 dark:text-white">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
          ← Back
        </Link>
        <span className="font-semibold">Leaderboard</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{username}</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {players.length === 0 ? (
            <p className="text-center text-sm text-zinc-400 dark:text-zinc-600">No games played yet.</p>
          ) : (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
              <div className="grid grid-cols-[2rem_1fr_5rem_5rem_5rem] gap-4 px-5 py-3 text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <span>#</span>
                <span>Player</span>
                <span className="text-right">Best WPM</span>
                <span className="text-right">Accuracy</span>
                <span className="text-right">Games</span>
              </div>

              <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                {players.map((p, i) => {
                  const isMe = p.id === user.id;
                  const medal = i === 0 ? "text-amber-500 dark:text-amber-400" : i === 1 ? "text-zinc-400 dark:text-zinc-300" : i === 2 ? "text-amber-700 dark:text-amber-700" : "text-zinc-400 dark:text-zinc-600";
                  return (
                    <div
                      key={p.id}
                      className={"grid grid-cols-[2rem_1fr_5rem_5rem_5rem] gap-4 px-5 py-3.5 items-center transition " + (isMe ? "bg-indigo-50 dark:bg-indigo-950/40" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/40")}
                    >
                      <span className={"text-sm font-bold tabular-nums " + medal}>{i + 1}</span>
                      <span className={"text-sm font-medium truncate " + (isMe ? "text-indigo-600 dark:text-indigo-300" : "text-zinc-900 dark:text-white")}>
                        {p.username}
                        {isMe && <span className="ml-2 text-xs text-indigo-400 dark:text-indigo-500">(you)</span>}
                      </span>
                      <span className="text-right text-sm font-bold tabular-nums text-zinc-900 dark:text-white">{p.best_wpm}</span>
                      <span className="text-right text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                        {Math.round(Number(p.avg_accuracy) * 100)}%
                      </span>
                      <span className="text-right text-sm tabular-nums text-zinc-400 dark:text-zinc-500">{p.games_played}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LeaderboardPage;
