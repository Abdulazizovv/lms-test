import { NextResponse } from "next/server";
import { readResults, writeResults } from "@/lib/data";
import type { ResultRecord } from "@/lib/types";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

async function sendTelegram(result: ResultRecord): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("Telegram credentials missing. Skipping notification.");
    return;
  }
  
  const date = new Date(result.createdAt);
  const uzbekTime = new Intl.DateTimeFormat('uz-UZ', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);

  const text = `📝 Yangi test natijasi

👤 Ism: ${result.student.name}
🎂 Yosh: ${result.student.age}
📚 Test: ${result.test.title}
✅ Natija: ${result.score.correct}/${result.score.total} (${result.score.percent}%)
🏷 Daraja: ${result.level}
⏱ Vaqt: ${uzbekTime}`;

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text }),
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ResultRecord;

    const results = await readResults();
    const exists = results.some((item) => item.attemptId === payload.attemptId);
    if (exists) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    results.push(payload);
    await writeResults(results);

    await sendTelegram(payload);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
