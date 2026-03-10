"use client";

import { useEffect, useRef, useState } from "react";
import {
  calcAccuracy,
  calcWpm,
  countCorrectChars,
  getCharStates,
} from "@/lib/metrics";

export interface GameResult {
  wpm: number;
  accuracy: number;
  elapsed: number;
}

export interface TypingGameProps {
  sentence: string;
  onComplete: (result: GameResult) => void;
  onTyped?: (charsTyped: number) => void;
  disabled?: boolean;
  controls?: React.ReactNode;
  resultActions?: React.ReactNode;
  bestWpm?: number;
  newBest?: boolean;
}

type GameStatus = "idle" | "playing" | "finished";

const WORDS_PER_LINE = 7;

const TypingGame = ({
  sentence,
  onComplete,
  onTyped,
  disabled = false,
  controls,
  resultActions,
  bestWpm = 0,
  newBest = false,
}: TypingGameProps) => {
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalWpm, setFinalWpm] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [finalElapsed, setFinalElapsed] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [sentence]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSeconds(
        Math.floor((Date.now() - startTimeRef.current!) / 1000)
      );
    }, 500);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (status === "idle") {
      setStatus("playing");
      startTimer();
    }

    if (status === "finished") return;

    setTyped(value);
    onTyped?.(value.length);

    if (value === sentence) {
      stopTimer();
      const elapsed = startTimeRef.current
        ? (Date.now() - startTimeRef.current) / 1000
        : 1;
      const wpm = calcWpm(countCorrectChars(value, sentence), elapsed);
      const accuracy = calcAccuracy(value, sentence);

      setFinalWpm(wpm);
      setFinalAccuracy(accuracy);
      setFinalElapsed(Math.round(elapsed));
      setStatus("finished");

      onComplete({ wpm, accuracy, elapsed: Math.round(elapsed) });
    }
  };

  // Live metrics
  const elapsed = startTimeRef.current
    ? Math.max(1, (Date.now() - startTimeRef.current) / 1000)
    : 0;
  const liveCorrectChars = countCorrectChars(typed, sentence);
  const liveWpm = status === "playing" ? calcWpm(liveCorrectChars, elapsed) : 0;
  const liveAccuracy =
    status === "playing" ? calcAccuracy(typed, sentence) : 1;

  const charStates = getCharStates(typed, sentence);
  const progress = Math.round((typed.length / sentence.length) * 100);

  // Windowed line layout
  const words = sentence.split(" ");
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += WORDS_PER_LINE) {
    lines.push(words.slice(i, i + WORDS_PER_LINE).join(" "));
  }
  const lineStartChars = lines.map((_, i) =>
    lines.slice(0, i).reduce((sum, l) => sum + l.length + 1, 0)
  );
  let currentLineIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (typed.length >= lineStartChars[i]) currentLineIndex = i;
  }

  return (
    <div className="w-full max-w-2xl space-y-8">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="WPM"
          value={status === "finished" ? finalWpm : liveWpm}
          sub={`Best: ${bestWpm}`}
          highlight={newBest}
        />
        <StatCard
          label="Accuracy"
          value={`${Math.round((status === "finished" ? finalAccuracy : liveAccuracy) * 100)}%`}
        />
        <StatCard
          label="Time"
          value={`${status === "finished" ? finalElapsed : elapsedSeconds}s`}
          sub={status === "idle" ? "Start typing" : undefined}
        />
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Typing area */}
      <div
        className="cursor-text rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-5 overflow-hidden"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="space-y-3">
          {[-1, 0, 1].map((offset) => {
            const lineIdx = currentLineIndex + offset;
            if (lineIdx < 0 || lineIdx >= lines.length) {
              return <div key={offset} className="h-8" />;
            }
            const lineStart = lineStartChars[lineIdx];
            const isCurrent = offset === 0;
            return (
              <p
                key={offset}
                className={`font-mono text-xl leading-relaxed tracking-wide transition-opacity duration-150 ${
                  isCurrent ? "opacity-100" : "opacity-25"
                }`}
              >
                {lines[lineIdx].split("").map((char, j) => {
                  const globalIdx = lineStart + j;
                  const state = charStates[globalIdx];
                  const isCursor =
                    globalIdx === typed.length && status !== "finished";
                  return (
                    <span
                      key={j}
                      className={[
                        state === "correct" && "text-emerald-400",
                        state === "incorrect" && "bg-red-900/60 text-red-400",
                        state === "pending" && "text-zinc-500",
                        isCursor && "border-b-2 border-indigo-400",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {char}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </div>
      </div>

      {/* Input / Results */}
      {status !== "finished" ? (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={typed}
            onChange={handleInput}
            disabled={disabled}
            placeholder={status === "idle" ? "Start typing to begin…" : undefined}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 font-mono text-base text-white placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {controls && <div className="flex items-center justify-between gap-2">{controls}</div>}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 text-center space-y-4">
          {newBest && (
            <p className="text-sm font-semibold text-amber-400">
              New personal best!
            </p>
          )}
          <p className="text-2xl font-bold">
            {finalWpm} WPM · {Math.round(finalAccuracy * 100)}% accuracy
          </p>
          {resultActions && (
            <div className="flex justify-center gap-3">{resultActions}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default TypingGame;

const StatCard = ({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}) => {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
      <p className="mb-1 text-xs uppercase tracking-widest text-zinc-500">{label}</p>
      <p
        className={`text-2xl font-bold tabular-nums ${highlight ? "text-amber-400" : "text-white"}`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
};
