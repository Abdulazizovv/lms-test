import { NextResponse } from "next/server";
import { readResults, writeResults } from "@/lib/data";
import type { ResultRecord } from "@/lib/types";

export const runtime = "nodejs";

type TelegramSendOutcome =
  | { ok: true; skipped: boolean }
  | { ok: false; skipped: false; status?: number; description: string };

async function sendTelegram(result: ResultRecord): Promise<TelegramSendOutcome> {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID ?? "").trim();

  if (!botToken || !chatId) {
    console.warn(
      "Telegram credentials missing (TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID). Skipping notification."
    );
    return { ok: true, skipped: true };
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

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: controller.signal,
    });

    const raw = await res.text();
    if (!res.ok) {
      console.error("Telegram sendMessage failed:", res.status, raw);
      return { ok: false, skipped: false, status: res.status, description: raw };
    }

    try {
      const parsed = JSON.parse(raw) as { ok?: boolean; description?: string };
      if (parsed?.ok === false) {
        console.error("Telegram sendMessage returned ok=false:", raw);
        return {
          ok: false,
          skipped: false,
          status: res.status,
          description: parsed.description ?? raw,
        };
      }
    } catch {
      // Telegram normally returns JSON, but if not, treat as success if HTTP 2xx.
    }

    return { ok: true, skipped: false };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Telegram sendMessage error:", message);
    return { ok: false, skipped: false, description: message };
  } finally {
    clearTimeout(timeoutId);
  }
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

    const telegram = await sendTelegram(payload);

    return NextResponse.json({ ok: true, telegram });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
