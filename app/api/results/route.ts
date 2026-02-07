import { NextResponse } from "next/server";
import { readResults } from "@/lib/data";

export async function GET() {
  try {
    const results = await readResults();
    return NextResponse.json(results);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
