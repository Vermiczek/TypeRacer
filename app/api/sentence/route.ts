import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_WORD_COUNT = 20;
const MIN_WORD_COUNT = 5;
const MAX_WORD_COUNT = 50;

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("count");
  const parsed = raw ? parseInt(raw, 10) : DEFAULT_WORD_COUNT;
  const count = Number.isNaN(parsed)
    ? DEFAULT_WORD_COUNT
    : Math.min(MAX_WORD_COUNT, Math.max(MIN_WORD_COUNT, parsed));

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_random_words", { count });

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
