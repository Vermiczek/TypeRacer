import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";

const MENU_ITEMS = [
  {
    href: "/play/single",
    label: "Single Player",
    description: "Practice on your own. No timer, no pressure — just you and the words.",
    icon: "⌨️",
    cta: "Start practicing",
    accent: "from-indigo-500 to-violet-500",
  },
  {
    href: "/play/multi",
    label: "Multiplayer",
    description: "Join a live round and race against other players in real time.",
    icon: "⚡",
    cta: "Find a race",
    accent: "from-amber-500 to-orange-500",
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    description: "See the all-time fastest typists. Sort by WPM, accuracy or games played.",
    icon: "🏆",
    cta: "View rankings",
    accent: "from-emerald-500 to-teal-500",
  },
] as const;

const HomePage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: player } = await supabase
    .from("players")
    .select("username, best_wpm, games_played")
    .eq("id", user!.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm text-zinc-900 dark:text-white">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <span className="text-lg font-bold tracking-tight">TypeRacer</span>
        <div className="flex items-center gap-4">
          {player && (
            <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-medium text-zinc-900 dark:text-white">{player.username}</span>
              {player.best_wpm > 0 && (
                <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs">
                  Best: {player.best_wpm} WPM
                </span>
              )}
            </div>
          )}
          <ThemeToggle />
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 transition hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Ready to race?
          </h1>
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            {player
              ? "Welcome back, " + player.username + ". " + player.games_played + " " + (player.games_played === 1 ? "race" : "races") + " completed."
              : "Choose a mode to get started."}
          </p>
        </div>

        <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6 transition hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
            >
              <div
                className={"mb-4 h-1 w-10 rounded-full bg-gradient-to-r " + item.accent + " transition-all group-hover:w-16"}
              />
              <span className="mb-3 text-3xl">{item.icon}</span>
              <h2 className="mb-1.5 text-lg font-semibold">{item.label}</h2>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {item.description}
              </p>
              <span
                className={"self-start bg-gradient-to-r " + item.accent + " bg-clip-text text-sm font-medium text-transparent"}
              >
                {item.cta} →
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
