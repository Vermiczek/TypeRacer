"use client";

import { useState } from "react";
import Link from "next/link";
import TypingGame, { GameResult } from "@/app/components/TypingGame";
import ThemeToggle from "@/app/components/ThemeToggle";

interface Props {
  initialSentence: string;
  username: string;
  bestWpm: number;
}

const SinglePlayerGame = ({
  initialSentence,
  username,
  bestWpm: initialBestWpm,
}: Props) => {
  const [sentence, setSentence] = useState(initialSentence);
  const [resetKey, setResetKey] = useState(0);
  const [wordCount, setWordCount] = useState(20);
  const [loadingNext, setLoadingNext] = useState(false);
  const [currentBestWpm, setCurrentBestWpm] = useState(initialBestWpm);
  const [newBest, setNewBest] = useState(false);

  const fetchAndReset = async (count = wordCount) => {
    setLoadingNext(true);
    try {
      const res = await fetch("/api/sentence?count=" + count);
      const data = await res.json();
      setSentence(data.sentence);
    } catch {
      // Keep old sentence
    }
    setNewBest(false);
    setResetKey((k) => k + 1);
    setLoadingNext(false);
  };

  const restartGame = () => {
    setNewBest(false);
    setResetKey((k) => k + 1);
  };

  const handleComplete = async (result: GameResult) => {
    try {
      const res = await fetch("/api/game/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wpm: result.wpm, accuracy: result.accuracy }),
      });
      const data = await res.json();
      if (data.newBestWpm > currentBestWpm) {
        setCurrentBestWpm(data.newBestWpm);
        setNewBest(true);
      }
    } catch {
    }
  };

  const controls = (
    <>
      <label className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
        Words
        <input
          type="number"
          min={0}
          max={1000}
          value={wordCount}
          onChange={(e) => {
            setWordCount(Math.min(1000, Math.max(0, Number(e.target.value))));
          }}
          className="w-16 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none appearance-none rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-center text-xs text-zinc-900 dark:text-white outline-none focus:border-indigo-500"
        />
      </label>
      <div className="flex gap-2">
        <button
          onClick={restartGame}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 transition hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        >
          Restart
        </button>
        <button
          onClick={() => fetchAndReset()}
          disabled={loadingNext}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 transition hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-white disabled:opacity-40"
        >
          {loadingNext ? "Loading…" : "New sentence"}
        </button>
      </div>
    </>
  );

  const resultActions = (
    <>
      <button
        onClick={restartGame}
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-5 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 transition"
      >
        Restart
      </button>
      <button
        onClick={() => fetchAndReset()}
        disabled={loadingNext}
        className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
      >
        {loadingNext ? "Loading…" : "New sentence"}
      </button>
      <Link
        href="/"
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-5 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 transition"
      >
        Main menu
      </Link>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm text-zinc-900 dark:text-white">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
          Back
        </Link>
        <span className="font-semibold">Single Player</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{username}</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <TypingGame
          key={sentence + "-" + resetKey}
          sentence={sentence}
          onComplete={handleComplete}
          bestWpm={currentBestWpm}
          newBest={newBest}
          controls={controls}
          resultActions={resultActions}
        />
      </main>
    </div>
  );
};

export default SinglePlayerGame;
