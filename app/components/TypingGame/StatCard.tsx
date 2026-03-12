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
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 text-center">
      <p className="mb-1 text-xs uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{label}</p>
      <p
        className={`text-2xl font-bold tabular-nums ${highlight ? "text-amber-500 dark:text-amber-400" : "text-zinc-900 dark:text-white"}`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{sub}</p>}
    </div>
  );
};

export default StatCard;
