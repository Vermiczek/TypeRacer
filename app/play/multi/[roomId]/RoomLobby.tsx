"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import TypingGame, { GameResult } from "@/app/components/TypingGame";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface RoomPlayer {
  player_id: string;
  wpm: number | null;
  accuracy: number | null;
  finished_at: string | null;
  is_ready: boolean;
  players: { username: string } | null;
}

interface Room {
  id: string;
  name: string;
  status: "waiting" | "playing" | "finished";
  sentence: string | null;
  max_players: number;
  host_id: string;
  time_limit: number | null;
  started_at: string | null;
  is_ranked: boolean;
  host: { username: string } | null;
  room_players: RoomPlayer[];
}

interface Props {
  room: Room;
  currentUserId: string;
  username: string;
}

type ProgressMap = Record<string, number>;

const RoomLobby = ({ room: initialRoom, currentUserId, username }: Props) => {
  const router = useRouter();
  const [room, setRoom] = useState(initialRoom);
  const [players, setPlayers] = useState<RoomPlayer[]>(initialRoom.room_players);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [starting, setStarting] = useState(false);
  // countdown: seconds until game actually begins (null = not counting down)
  const [countdown, setCountdown] = useState<number | null>(null);
  // timeLeft: seconds remaining in the game (null = no limit or not started)
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const hasSubmitted = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const isHost = currentUserId === room.host_id;
  const sentenceLen = room.sentence?.length ?? 1;

  // ── Realtime ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();

    const refreshPlayers = async () => {
      const { data } = await supabase
        .from("room_players")
        .select("player_id, wpm, accuracy, finished_at, is_ready, players(username)")
        .eq("room_id", room.id);
      if (data) setPlayers(data as unknown as RoomPlayer[]);
    };

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` },
        (payload) => {
          const updated = payload.new as Partial<Room>;
          setRoom((r) => ({ ...r, ...updated }));
          if (updated.status === "finished") refreshPlayers();
          if (updated.status === "waiting") hasSubmitted.current = false;
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${room.id}` },
        refreshPlayers
      )
      .on("broadcast", { event: "progress" }, ({ payload }) => {
        setProgress((prev) => ({
          ...prev,
          [payload.playerId as string]: payload.chars as number,
        }));
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id]);

  // ── Unified server-authoritative timer ───────────────────────────────────
  // When status = "playing" and started_at is set:
  //   - if now < started_at  → countdown phase (typing disabled)
  //   - if now >= started_at → game phase, derive timeLeft from started_at + time_limit
  useEffect(() => {
    if (room.status !== "playing" || !room.started_at) return;

    const tick = () => {
      const now = Date.now();
      const startMs = new Date(room.started_at!).getTime();
      const diffSec = Math.ceil((startMs - now) / 1000);

      if (diffSec > 0) {
        // Still counting down
        setCountdown(diffSec);
        setTimeLeft(null);
      } else {
        setCountdown(null);

        if (room.time_limit) {
          const elapsed = Math.floor((now - startMs) / 1000);
          const remaining = Math.max(0, room.time_limit - elapsed);
          setTimeLeft(remaining);

          if (remaining === 0 && !hasSubmitted.current) {
            hasSubmitted.current = true;
            fetch(`/api/rooms/${room.id}/result`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ wpm: null, accuracy: null }),
            });
          }
        }
      }
    };

    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.status, room.started_at, room.time_limit]);

  // Reset countdown/timeLeft when room returns to waiting
  useEffect(() => {
    if (room.status === "waiting") {
      setCountdown(null);
      setTimeLeft(null);
    }
  }, [room.status]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const broadcastProgress = (chars: number) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "progress",
      payload: { playerId: currentUserId, chars },
    });
  };

  const handleReady = async () => {
    const res = await fetch(`/api/rooms/${room.id}/ready`, { method: "POST" });
    if (!res.ok) toast.error("Failed to update ready status");
  };

  const handleStart = async () => {
    setStarting(true);
    const res = await fetch(`/api/rooms/${room.id}/start`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Failed to start game");
    }
    setStarting(false);
  };

  const handleComplete = async (result: GameResult) => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    const res = await fetch(`/api/rooms/${room.id}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wpm: result.wpm, accuracy: result.accuracy }),
    });
    if (!res.ok) toast.error("Failed to submit result");
  };

  const handleRestart = async () => {
    const res = await fetch(`/api/rooms/${room.id}/restart`, { method: "POST" });
    if (!res.ok) toast.error("Failed to restart game");
  };

  const handleLeave = async () => {
    await fetch(`/api/rooms/${room.id}/leave`, { method: "DELETE" });
    router.push("/play/multi");
  };

  // True while we're still in the pre-game countdown phase.
  // Also true when status just flipped to "playing" but the timer hasn't ticked yet (null),
  // so no player ever sees the typing game before the countdown finishes.
  const inCountdown = room.status === "playing" && (countdown === null || countdown > 0);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <button onClick={handleLeave} className="text-sm text-zinc-400 hover:text-white transition">
          ← Leave
        </button>
        <span className="flex items-center gap-2 font-semibold">
          {room.name}
          {room.is_ranked && (
            <span className="rounded-full border border-amber-700 bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-300">
              Ranked
            </span>
          )}
        </span>
        <span className="text-sm text-zinc-400">{username}</span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {room.status === "waiting" && (
          <WaitingView
            players={players}
            room={room}
            isHost={isHost}
            starting={starting}
            currentUserId={currentUserId}
            onStart={handleStart}
            onReady={handleReady}
          />
        )}

        {room.status === "playing" && room.sentence && (
          <div className="w-full max-w-2xl space-y-6">
            {inCountdown && (
              <div className="flex flex-col items-center justify-center gap-2">
                <span className="text-7xl font-bold tabular-nums text-indigo-400">
                  {countdown ?? "…"}
                </span>
                <span className="text-sm text-zinc-500 uppercase tracking-widest">Get ready…</span>
              </div>
            )}

            {!inCountdown && (
              <>
                <OpponentBars
                  players={players}
                  currentUserId={currentUserId}
                  progress={progress}
                  sentenceLen={sentenceLen}
                />
                <TypingGame
                  sentence={room.sentence}
                  onComplete={handleComplete}
                  disabled={timeLeft === 0}
                  controls={
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-zinc-500">
                        Multiplayer · {players.length} players
                      </p>
                      {timeLeft != null && (
                        <span className={`text-xs font-mono tabular-nums ${timeLeft <= 10 ? "text-red-400" : "text-zinc-400"}`}>
                          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  }
                  resultActions={
                    <button
                      onClick={handleLeave}
                      className="rounded-lg border border-zinc-700 px-5 py-2 text-sm font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 transition"
                    >
                      Back to lobby
                    </button>
                  }
                  onTyped={broadcastProgress}
                />
              </>
            )}
          </div>
        )}

        {room.status === "finished" && (
          <FinishedView
            players={players}
            isHost={isHost}
            onRestart={handleRestart}
            onLeave={handleLeave}
          />
        )}
      </main>
    </div>
  );
};

export default RoomLobby;

// ── Sub-components ────────────────────────────────────────────────────────────

const WaitingView = ({
  players,
  room,
  isHost,
  starting,
  currentUserId,
  onStart,
  onReady,
}: {
  players: RoomPlayer[];
  room: Room;
  isHost: boolean;
  starting: boolean;
  currentUserId: string;
  onStart: () => void;
  onReady: () => void;
}) => {
  const me = players.find((p) => p.player_id === currentUserId);
  const nonHostPlayers = players.filter((p) => p.player_id !== room.host_id);
  const allReady = players.length >= 2 && nonHostPlayers.every((p) => p.is_ready);

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-zinc-500">
          Players — {players.length}/{room.max_players}
        </h2>
        <div className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          {players.map((rp) => (
            <div key={rp.player_id} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-medium">{rp.players?.username ?? "—"}</span>
              <div className="flex items-center gap-2">
                {rp.player_id === room.host_id ? (
                  <span className="rounded-full bg-indigo-900/50 border border-indigo-700 px-2.5 py-0.5 text-xs text-indigo-300">
                    Host
                  </span>
                ) : (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      rp.is_ready
                        ? "bg-emerald-900/50 border border-emerald-700 text-emerald-300"
                        : "bg-zinc-800 border border-zinc-700 text-zinc-500"
                    }`}
                  >
                    {rp.is_ready ? "Ready" : "Not ready"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {!isHost && (
          <button
            onClick={onReady}
            className={`w-full rounded-xl py-3 font-semibold transition ${
              me?.is_ready
                ? "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {me?.is_ready ? "Cancel ready" : "Ready up"}
          </button>
        )}
        {isHost && (
          <button
            onClick={onStart}
            disabled={!allReady || starting}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold hover:bg-indigo-500 disabled:opacity-40 transition"
          >
            {starting
              ? "Starting…"
              : !allReady
              ? players.length < 2
                ? "Waiting for players…"
                : "Waiting for everyone to ready up…"
              : "Start game"}
          </button>
        )}
      </div>
    </div>
  );
};

const OpponentBars = ({
  players,
  currentUserId,
  progress,
  sentenceLen,
}: {
  players: RoomPlayer[];
  currentUserId: string;
  progress: ProgressMap;
  sentenceLen: number;
}) => {
  const others = players.filter((p) => p.player_id !== currentUserId);
  if (!others.length) return null;

  return (
    <div className="space-y-2">
      {others.map((rp) => {
        const pct = rp.finished_at
          ? 100
          : Math.min(100, Math.round(((progress[rp.player_id] ?? 0) / sentenceLen) * 100));
        return (
          <div key={rp.player_id}>
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>{rp.players?.username ?? "—"}</span>
              {rp.finished_at && rp.wpm != null && (
                <span className="text-emerald-400">{rp.wpm} WPM</span>
              )}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const FinishedView = ({
  players,
  isHost,
  onRestart,
  onLeave,
}: {
  players: RoomPlayer[];
  isHost: boolean;
  onRestart: () => void;
  onLeave: () => void;
}) => {
  const sorted = [...players].sort((a, b) => (b.wpm ?? -1) - (a.wpm ?? -1));

  return (
    <div className="w-full max-w-md space-y-6">
      <h2 className="text-center text-xs uppercase tracking-widest text-zinc-500">Results</h2>
      <div className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {sorted.map((rp, i) => (
          <div key={rp.player_id} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500 w-4">{i + 1}</span>
              <span className="text-sm font-medium">{rp.players?.username ?? "—"}</span>
            </div>
            <div className="text-right text-sm">
              {rp.wpm != null ? (
                <>
                  <span className={`font-bold tabular-nums ${i === 0 ? "text-amber-400" : "text-white"}`}>
                    {rp.wpm} WPM
                  </span>
                  <span className="ml-2 text-zinc-500">
                    {Math.round((rp.accuracy ?? 0) * 100)}%
                  </span>
                </>
              ) : (
                <span className="text-zinc-600">DNF</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        {isHost && (
          <button
            onClick={onRestart}
            className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold hover:bg-indigo-500 transition"
          >
            Play again
          </button>
        )}
        <button
          onClick={onLeave}
          className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 transition"
        >
          Back to lobby
        </button>
      </div>
    </div>
  );
};
