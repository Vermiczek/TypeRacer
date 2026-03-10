import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SinglePlayerGame from "./SinglePlayerGame";

const fetchSentence = async (): Promise<string> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_random_words", { count: 20 });
  if (!data?.length) return "The quick brown fox jumps over the lazy dog.";
  return (
    (data as string[]).join(" ").replace(/^\w/, (c) => c.toUpperCase()) + "."
  );
};

const SinglePlayerPage = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [sentence, playerResult] = await Promise.all([
    fetchSentence(),
    supabase
      .from("players")
      .select("username, best_wpm")
      .eq("id", user.id)
      .single(),
  ]);

  const player = playerResult.data;

  return (
    <SinglePlayerGame
      initialSentence={sentence}
      username={player?.username ?? "Player"}
      bestWpm={player?.best_wpm ?? 0}
    />
  );
};

export default SinglePlayerPage;
