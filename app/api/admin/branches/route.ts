import { NextResponse } from "next/server";
import { readBranches, writeBranches } from "@/lib/data";
import type { Branch } from "@/lib/types";
import { isAdminRequest } from "@/lib/admin";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  try {
    if (!isAdminRequest(request)) return unauthorized();
    const branches = await readBranches();
    return NextResponse.json({ ok: true, branches });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAdminRequest(request)) return unauthorized();
    const { branch } = (await request.json()) as { branch: Branch };
    if (!branch?.id || !branch?.name) {
      return NextResponse.json({ ok: false, error: "Missing branch.id/branch.name" }, { status: 400 });
    }

    const branches = await readBranches();
    if (branches.some((b) => b.id === branch.id)) {
      return NextResponse.json({ ok: false, error: "Branch id already exists" }, { status: 409 });
    }

    await writeBranches([...branches, branch]);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!isAdminRequest(request)) return unauthorized();
    const { id, branch } = (await request.json()) as { id: string; branch: Branch };
    if (!id || !branch?.id || !branch?.name) {
      return NextResponse.json({ ok: false, error: "Missing id/branch" }, { status: 400 });
    }

    const branches = await readBranches();
    const idx = branches.findIndex((b) => b.id === id);
    if (idx === -1) {
      return NextResponse.json({ ok: false, error: "Branch not found" }, { status: 404 });
    }

    if (branch.id !== id && branches.some((b) => b.id === branch.id)) {
      return NextResponse.json({ ok: false, error: "New branch.id already exists" }, { status: 409 });
    }

    const next = branches.slice();
    next[idx] = branch;
    await writeBranches(next);
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

    const branches = await readBranches();
    const next = branches.filter((b) => b.id !== id);
    if (next.length === branches.length) {
      return NextResponse.json({ ok: false, error: "Branch not found" }, { status: 404 });
    }
    if (next.length === 0) {
      return NextResponse.json({ ok: false, error: "At least one branch must exist" }, { status: 400 });
    }

    await writeBranches(next);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

