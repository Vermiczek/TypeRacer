interface ResultPanelProps {
  wpm: number;
  accuracy: number;
  newBest: boolean;
  resultActions?: React.ReactNode;
}

const ResultPanel = ({ wpm, accuracy, newBest, resultActions }: ResultPanelProps) => (
  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-6 text-center space-y-4">
    {newBest && (
      <p className="text-sm font-semibold text-amber-500 dark:text-amber-400">
        New personal best!
      </p>
    )}
    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
      {wpm} WPM · {Math.round(accuracy * 100)}% accuracy
    </p>
    {resultActions && (
      <div className="flex justify-center gap-3">{resultActions}</div>
    )}
  </div>
);

export default ResultPanel;
