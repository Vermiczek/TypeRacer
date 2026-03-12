"use client";

import { useEffect, useRef, useState } from "react";
import {
  calcAccuracy,
  calcWpm,
  countCorrectChars,
  getCharStates,
} from "@/lib/metrics";
import StatCard from "./StatCard";
import ProgressBar from "./ProgressBar";
import TextDisplay from "./TextDisplay";
import GameInput from "./GameInput";
import ResultPanel from "./ResultPanel";

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

  const elapsed = startTimeRef.current
    ? Math.max(1, (Date.now() - startTimeRef.current) / 1000)
    : 0;
  const liveCorrectChars = countCorrectChars(typed, sentence);
  const liveWpm = status === "playing" ? calcWpm(liveCorrectChars, elapsed) : 0;
  const liveAccuracy = status === "playing" ? calcAccuracy(typed, sentence) : 1;
  const charStates = getCharStates(typed, sentence);
  const progress = Math.round((typed.length / sentence.length) * 100);
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

      <ProgressBar progress={progress} />

      <TextDisplay
        lines={lines}
        lineStartChars={lineStartChars}
        currentLineIndex={currentLineIndex}
        charStates={charStates}
        typedLength={typed.length}
        isFinished={status === "finished"}
        onFocus={() => inputRef.current?.focus()}
      />

      {status !== "finished" ? (
        <GameInput
          inputRef={inputRef}
          value={typed}
          onChange={handleInput}
          disabled={disabled}
          isIdle={status === "idle"}
          controls={controls}
        />
      ) : (
        <ResultPanel
          wpm={finalWpm}
          accuracy={finalAccuracy}
          newBest={newBest}
          resultActions={resultActions}
        />
      )}
    </div>
  );
};

export default TypingGame;
