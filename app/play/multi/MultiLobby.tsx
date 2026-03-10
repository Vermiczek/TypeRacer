"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface RoomPlayer {
  count: number;
}

interface Room {
  id: string;
  name: string;
  status: "waiting" | "playing" | "finished";
  max_players: number;
  word_count: number;
  time_limit: number | null;
  is_ranked: boolean;
  has_password: boolean;
  created_at: string;
  host: { username: string } | null;
  room_players: RoomPlayer[];
}

interface Props {
  username: string;
  initialRooms: Room[];
}

const MultiLobby = ({ username, initialRooms }: Props) => {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>(initialRooms);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [wordCount, setWordCount] = useState(20);
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [isRanked, setIsRanked] = useState(false);
  const [createPassword, setCreatePassword] = useState("");
  const [creating, setCreating] = useState(false);

  // Password prompt for joining
  const [promptRoomId, setPromptRoomId] = useState<string | null>(null);
  const [joinPassword, setJoinPassword] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("rooms-lobby")
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, fetchRooms)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players" }, fetchRooms)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRooms = async () => {
    const res = await fetch("/api/rooms");
    const data = await res.json();
    if (data.rooms) setRooms(data.rooms);
  };

  const handleCreate = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roomName.trim(),
          maxPlayers,
          wordCount: isRanked ? 50 : wordCount,
          timeLimit,
          isRanked,
          ...(createPassword ? { password: createPassword } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to create room"); return; }
      router.push(`/play/multi/${data.room.id}`);
    } catch {
      toast.error("Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const requestJoin = (room: Room) => {
    if (room.has_password) {
      setPromptRoomId(room.id);
      setJoinPassword("");
    } else {
      doJoin(room.id);
    }
  };

  const doJoin = async (roomId: string, password?: string) => {
    setJoiningId(roomId);
    try {
      const res = await fetch(`/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(password ? { password } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to join room");
        return;
      }
      router.push(`/play/multi/${roomId}`);
    } catch {
      toast.error("Failed to join room");
    } finally {
      setJoiningId(null);
    }
  };

  const waitingRooms = rooms.filter((r) => r.status === "waiting");
  const playingRooms = rooms.filter((r) => r.status === "playing");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white transition">
          ← Back
        </Link>
        <span className="font-semibold">Multiplayer</span>
        <span className="text-sm text-zinc-400">{username}</span>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-12">
        <div className="w-full max-w-2xl space-y-8">

          {/* Create room */}
          {!showForm ? (
            <div className="flex justify-end">
              <button
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold hover:bg-indigo-500 transition"
              >
                + Create room
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleCreate}
              className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5 space-y-4"
            >
              <p className="font-semibold text-sm">New room</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Room name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  maxLength={40}
                  autoFocus
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500"
                />
                <label className="flex items-center gap-2 text-xs text-zinc-400 shrink-0">
                  Max
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={maxPlayers}
                    onChange={(e) =>
                      setMaxPlayers(Math.min(10, Math.max(2, Number(e.target.value))))
                    }
                    className="w-14 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-center text-white outline-none focus:border-indigo-500 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none appearance-none"
                  />
                </label>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsRanked((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    isRanked
                      ? "border-amber-600 bg-amber-900/40 text-amber-300"
                      : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500"
                  }`}
                >
                  {isRanked ? "★ Ranked" : "☆ Ranked"}
                </button>
                <span className="text-xs text-zinc-600">Ranked games count towards the leaderboard · 50 words</span>
              </div>
              <div className="flex gap-3">
                <label className={`flex items-center gap-2 text-xs ${isRanked ? "text-zinc-600" : "text-zinc-400"}`}>
                  Words
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={isRanked ? 50 : wordCount}
                    disabled={isRanked}
                    onChange={(e) => setWordCount(Math.min(100, Math.max(5, Number(e.target.value))))}
                    className="w-16 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-center text-white outline-none focus:border-indigo-500 disabled:opacity-40 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none appearance-none"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  Time limit
                  <select
                    value={timeLimit ?? ""}
                    onChange={(e) => setTimeLimit(e.target.value === "" ? null : Number(e.target.value))}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">None</option>
                    <option value="30">30s</option>
                    <option value="60">60s</option>
                    <option value="90">90s</option>
                    <option value="120">2 min</option>
                    <option value="180">3 min</option>
                    <option value="300">5 min</option>
                  </select>
                </label>
              </div>
              <input
                type="password"
                placeholder="Password (optional)"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                maxLength={100}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setRoomName(""); setWordCount(20); setTimeLimit(null); setIsRanked(false); setCreatePassword(""); }}
                  className="rounded-lg border border-zinc-700 px-4 py-1.5 text-sm text-zinc-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !roomName.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          )}

          {/* Password prompt modal */}
          {promptRoomId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const id = promptRoomId;
                  setPromptRoomId(null);
                  doJoin(id, joinPassword);
                }}
                className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 space-y-4 mx-4"
              >
                <p className="font-semibold">Enter room password</p>
                <input
                  type="password"
                  placeholder="Password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  autoFocus
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-indigo-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setPromptRoomId(null); setJoinPassword(""); }}
                    className="rounded-lg border border-zinc-700 px-4 py-1.5 text-sm text-zinc-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!joinPassword}
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50 transition"
                  >
                    Join
                  </button>
                </div>
              </form>
            </div>
          )}

          <RoomSection
            title="Open rooms"
            rooms={waitingRooms}
            joiningId={joiningId}
            onJoin={requestJoin}
            emptyText="No open rooms — create one above."
          />

          {playingRooms.length > 0 && (
            <RoomSection
              title="In progress"
              rooms={playingRooms}
              joiningId={joiningId}
              onJoin={requestJoin}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default MultiLobby;

const RoomSection = ({
  title,
  rooms,
  joiningId,
  onJoin,
  emptyText,
}: {
  title: string;
  rooms: Room[];
  joiningId: string | null;
  onJoin: (room: Room) => void;
  emptyText?: string;
}) => {
  return (
    <div className="space-y-3">
      <h2 className="text-xs uppercase tracking-widest text-zinc-500">{title}</h2>
      {rooms.length === 0 && emptyText ? (
        <p className="text-sm text-zinc-600">{emptyText}</p>
      ) : (
        <div className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          {rooms.map((room) => {
            const count = room.room_players[0]?.count ?? 0;
            const full = count >= room.max_players;
            return (
              <div key={room.id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-medium text-sm">
                    {room.has_password && (
                      <span className="text-zinc-500" title="Password protected">🔒</span>
                    )}
                    {room.name}
                    {room.is_ranked && (
                      <span className="ml-1 rounded-full border border-amber-700 bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-300">
                        Ranked
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    by {room.host?.username ?? "—"} ·{" "}
                    <span className={full ? "text-red-400" : "text-zinc-400"}>
                      {count}/{room.max_players} players
                    </span>
                    {" · "}{room.word_count}w
                    {room.time_limit != null && ` · ${room.time_limit >= 60 ? `${room.time_limit / 60}min` : `${room.time_limit}s`}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <StatusBadge status={room.status} />
                  {room.status === "waiting" && (
                    <button
                      onClick={() => onJoin(room)}
                      disabled={full || joiningId === room.id}
                      className="rounded-lg border border-zinc-700 px-4 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 disabled:opacity-40 transition"
                    >
                      {joiningId === room.id ? "Joining…" : full ? "Full" : "Join"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: Room["status"] }) => {
  const styles = {
    waiting: "bg-emerald-900/50 text-emerald-400 border-emerald-800",
    playing: "bg-amber-900/50 text-amber-400 border-amber-800",
    finished: "bg-zinc-800 text-zinc-500 border-zinc-700",
  };
  const labels = { waiting: "Waiting", playing: "Playing", finished: "Done" };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};
