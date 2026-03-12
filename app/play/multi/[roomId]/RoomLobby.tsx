"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import TypingGame, { GameResult } from "@/app/components/TypingGame";
import ThemeToggle from "@/app/components/ThemeToggle";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Room, RoomPlayer, ProgressMap } from "./types";
import WaitingView from "./components/WaitingView";
import OpponentBars from "./components/OpponentBars";
import FinishedView from "./components/FinishedView";

interface Props {
  room: Room;
  currentUserId: string;
  username: string;
}

const RoomLobby = ({ room: initialRoom, currentUserId, username }: Props) => {
  const router = useRouter();
  const [room, setRoom] = useState(initialRoom);
  const [players, setPlayers] = useState<RoomPlayer[]>(initialRoom.room_players);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [starting, setStarting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
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
  useEffect(() => {
    if (room.status !== "playing" || !room.started_at) return;

    const tick = () => {
      const now = Date.now();
      const startMs = new Date(room.started_at!).getTime();
      const diffSec = Math.ceil((startMs - now) / 1000);

      if (diffSec > 0) {
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

  const inCountdown = room.status === "playing" && (countdown === null || countdown > 0);

  return (
    <div className="flex min-h-screen flex-col bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm text-zinc-900 dark:text-white">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <button onClick={handleLeave} className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition">
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
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{username}</span>
          <ThemeToggle />
        </div>
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
                <span className="text-7xl font-bold tabular-nums text-indigo-500 dark:text-indigo-400">
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
                        <span className={`text-xs font-mono tabular-nums ${timeLeft <= 10 ? "text-red-500 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  }
                  resultActions={
                    <button
                      onClick={handleLeave}
                      className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-5 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-500 transition"
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
