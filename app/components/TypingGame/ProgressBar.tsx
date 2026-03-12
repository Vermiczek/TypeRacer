const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
    <div
      className="h-full rounded-full bg-indigo-500 transition-all duration-150"
      style={{ width: `${progress}%` }}
    />
  </div>
);

export default ProgressBar;
