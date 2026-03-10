import { NextResponse } from "next/server";
import { readResults, writeResults } from "@/lib/data";
import type { ResultRecord } from "@/lib/types";

export const runtime = "nodejs";

type TelegramSendOutcome =
  | { ok: true; skipped: boolean }
  | { ok: false; skipped: false; status?: number; description: string };

async function sendTelegram(result: ResultRecord, origin: string): Promise<TelegramSendOutcome> {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN ?? "").trim();
  const chatId = (process.env.TELEGRAM_CHAT_ID ?? "").trim();
  const publicAppUrl = (process.env.PUBLIC_APP_URL ?? "").trim();

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

  const caption = [
    "<b>Test natijasi</b>",
    `<b>O‘quvchi:</b> ${esc(result.student.name)} (${result.student.age})`,
    `<b>Filial:</b> ${esc(result.branch?.name ?? "—")}`,
    `<b>Test:</b> ${esc(result.test.title)} <code>${esc(result.test.id)}</code>`,
    `<b>Natija:</b> ${result.score.correct}/${result.score.total} (${result.score.percent}%) • <b>${esc(result.level)}</b>`,
    `<b>Sarflangan:</b> ${formatDuration(result.durationSec)} • <b>${esc(uzbekTime)}</b>`,
  ].join("\n");

  const resultUrl = publicAppUrl
    ? new URL(`/result/${result.attemptId}`, publicAppUrl).toString()
    : "";

  const replyMarkup = resultUrl
    ? { inline_keyboard: [[{ text: "Natijani ko‘rish", url: resultUrl }]] }
    : undefined;

  const splitMessage = (value: string, maxLen: number) => {
    if (value.length <= maxLen) return [value];
    const parts: string[] = [];
    let current = "";
    for (const line of value.split("\n")) {
      const next = current ? `${current}\n${line}` : line;
      if (next.length > maxLen) {
        if (current) parts.push(current);
        current = line;
        continue;
      }
      current = next;
    }
    if (current) parts.push(current);
    return parts.length ? parts : [value.slice(0, maxLen)];
  };

  const describeFetchError = (error: unknown) => {
    if (!(error instanceof Error)) return String(error);
    const anyErr = error as Error & { cause?: unknown; code?: unknown };
    const parts = [anyErr.message];
    if (anyErr.code) parts.push(`code=${String(anyErr.code)}`);
    if (anyErr.cause instanceof Error) parts.push(`cause=${anyErr.cause.message}`);
    else if (anyErr.cause) parts.push(`cause=${String(anyErr.cause)}`);
    return parts.filter(Boolean).join(" ");
  };

  const makeRequest = async (url: string, init: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      const raw = await res.text();
      if (!res.ok) {
        console.error("Telegram API failed:", res.status, raw);
        return { ok: false as const, status: res.status, raw };
      }
      try {
        const parsed = JSON.parse(raw) as { ok?: boolean; description?: string };
        if (parsed?.ok === false) {
          console.error("Telegram API returned ok=false:", raw);
          return { ok: false as const, status: res.status, raw };
        }
      } catch {
        // ignore JSON parse errors for successful HTTP
      }
      return { ok: true as const, raw };
    } catch (error: unknown) {
      const message = describeFetchError(error);
      console.error("Telegram API error:", message);
      return { ok: false as const, raw: message };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    // Send main info as text (+ inline button).
    const sendMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const chunks = splitMessage(text, 3500);
    const firstRes = await makeRequest(sendMessageUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: chunks[0],
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    });
    if (!firstRes.ok) return { ok: false, skipped: false, description: firstRes.raw };
    for (let i = 1; i < chunks.length; i += 1) {
      await makeRequest(sendMessageUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: chunks[i],
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
    }
    return { ok: true, skipped: false };
  } catch (error: unknown) {
    const message = describeFetchError(error);
    console.error("Telegram sendMessage error:", message);
    return { ok: false, skipped: false, description: message };
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

    const origin = new URL(request.url).origin;
    const internalBase =
      (process.env.INTERNAL_BASE_URL ?? "").trim() || origin || "http://127.0.0.1:3000";
    const telegram = await sendTelegram(payload, internalBase);

    return NextResponse.json({ ok: true, telegram });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
