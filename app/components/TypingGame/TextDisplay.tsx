import { CharState } from "@/lib/metrics";

interface TextDisplayProps {
  lines: string[];
  lineStartChars: number[];
  currentLineIndex: number;
  charStates: CharState[];
  typedLength: number;
  isFinished: boolean;
  onFocus: () => void;
}

const TextDisplay = ({
  lines,
  lineStartChars,
  currentLineIndex,
  charStates,
  typedLength,
  isFinished,
  onFocus,
}: TextDisplayProps) => (
  <div
    className="cursor-text rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-6 py-5 overflow-hidden"
    onClick={onFocus}
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
              const isCursor = globalIdx === typedLength && !isFinished;
              return (
                <span
                  key={j}
                  className={[
                    state === "correct" && "text-emerald-500 dark:text-emerald-400",
                    state === "incorrect" && "bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400",
                    state === "pending" && "text-zinc-400 dark:text-zinc-500",
                    isCursor && "border-b-2 border-indigo-500 dark:border-indigo-400",
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
);

export default TextDisplay;
