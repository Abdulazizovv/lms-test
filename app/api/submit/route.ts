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

  const formatDuration = (totalSec?: number) => {
    if (typeof totalSec !== "number" || !Number.isFinite(totalSec)) return "—";
    const sec = Math.max(Math.floor(totalSec), 0);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const esc = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  const text = [
    "<b>Test natijasi</b>",
    "",
    `<b>O‘quvchi:</b> ${esc(result.student.name)} (${result.student.age})`,
    `<b>Filial:</b> ${esc(result.branch?.name ?? "—")}`,
    `<b>Test:</b> ${esc(result.test.title)} <code>${esc(result.test.id)}</code>`,
    `<b>Natija:</b> ${result.score.correct}/${result.score.total} (${result.score.percent}%)`,
    `<b>Daraja:</b> ${esc(result.level)}`,
    `<b>Sarflangan vaqt:</b> ${formatDuration(result.durationSec)}`,
    `<b>Sana:</b> ${esc(uzbekTime)}`,
    `<b>Attempt:</b> <code>${esc(result.attemptId)}</code>`,
  ].join("\n");

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
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
