import { NextResponse } from "next/server";
import { readResults, writeResults } from "@/lib/data";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const results = await readResults();
    const filtered = results.filter((item) => item.attemptId !== attemptId);
    
    if (filtered.length === results.length) {
      return NextResponse.json(
        { ok: false, error: "Result not found" },
        { status: 404 }
      );
    }

    await writeResults(filtered);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
