import { NextResponse } from "next/server";
import { readBranches, readTests, writeTests } from "@/lib/data";
import type { Test } from "@/lib/types";
import { isAdminRequest } from "@/lib/admin";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  try {
    if (!isAdminRequest(request)) return unauthorized();
    const [branches, tests] = await Promise.all([readBranches(), readTests()]);
    return NextResponse.json({ ok: true, branches, tests });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdminRequest(request)) return unauthorized();
    const { test } = (await request.json()) as { test: Test };
    if (!test?.id) {
      return NextResponse.json({ ok: false, error: "Missing test.id" }, { status: 400 });
    }

    const tests = await readTests();
    if (tests.some((t) => t.id === test.id)) {
      return NextResponse.json({ ok: false, error: "Test id already exists" }, { status: 409 });
    }

    const normalized: Test = { ...test, branchId: test.branchId ?? "main" };
    await writeTests([...tests, normalized]);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!isAdminRequest(request)) return unauthorized();
    const { id, test } = (await request.json()) as { id: string; test: Test };
    if (!id || !test?.id) {
      return NextResponse.json({ ok: false, error: "Missing id/test" }, { status: 400 });
    }

    const tests = await readTests();
    const idx = tests.findIndex((t) => t.id === id);
    if (idx === -1) {
      return NextResponse.json({ ok: false, error: "Test not found" }, { status: 404 });
    }

    // Prevent accidental id collisions if user changes test.id
    if (test.id !== id && tests.some((t) => t.id === test.id)) {
      return NextResponse.json({ ok: false, error: "New test.id already exists" }, { status: 409 });
    }

    const normalized: Test = { ...test, branchId: test.branchId ?? "main" };
    const next = tests.slice();
    next[idx] = normalized;
    await writeTests(next);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isAdminRequest(request)) return unauthorized();
    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }
    const tests = await readTests();
    const next = tests.filter((t) => t.id !== id);
    if (next.length === tests.length) {
      return NextResponse.json({ ok: false, error: "Test not found" }, { status: 404 });
    }
    await writeTests(next);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

