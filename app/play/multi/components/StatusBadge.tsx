type RoomStatus = "waiting" | "playing" | "finished";

const StatusBadge = ({ status }: { status: RoomStatus }) => {
  const styles: Record<RoomStatus, string> = {
    waiting: "bg-emerald-900/50 text-emerald-400 border-emerald-800",
    playing: "bg-amber-900/50 text-amber-400 border-amber-800",
    finished: "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 border-zinc-300 dark:border-zinc-700",
  };
  const labels: Record<RoomStatus, string> = {
    waiting: "Waiting",
    playing: "Playing",
    finished: "Done",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default StatusBadge;
