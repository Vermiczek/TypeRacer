import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const WORD_COUNT = 10;

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_random_words", {
    count: WORD_COUNT,
  });

  if (error || !data?.length) {
    return NextResponse.json(
      { error: "Failed to generate sentence" },
      { status: 500 }
    );
  }

  const sentence =
    (data as string[]).join(" ").replace(/^\w/, (c) => c.toUpperCase()) + ".";

  return NextResponse.json({ sentence });
}
