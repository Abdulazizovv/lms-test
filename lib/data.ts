import fs from "fs/promises";
import path from "path";
import type { Branch, ResultRecord, Test } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const branchesPath = path.join(dataDir, "branches.json");
const testsPath = path.join(dataDir, "tests.json");
const resultsPath = path.join(dataDir, "results.json");

const defaultBranches: Branch[] = [{ id: "main", name: "Asosiy filial" }];

export async function readBranches(): Promise<Branch[]> {
  try {
    const raw = await fs.readFile(branchesPath, "utf-8");
    const parsed = JSON.parse(raw) as Branch[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultBranches;
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(branchesPath, JSON.stringify(defaultBranches, null, 2), "utf-8");
    return defaultBranches;
  }
}

export async function writeBranches(branches: Branch[]): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(branchesPath, JSON.stringify(branches, null, 2), "utf-8");
}

export async function readTests(): Promise<Test[]> {
  const raw = await fs.readFile(testsPath, "utf-8");
  const parsed = JSON.parse(raw) as Test[];
  return parsed.map((test) => ({ ...test, branchId: test.branchId ?? "main" }));
}

export async function readResults(): Promise<ResultRecord[]> {
  try {
    const raw = await fs.readFile(resultsPath, "utf-8");
    return JSON.parse(raw) as ResultRecord[];
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(resultsPath, "[]", "utf-8");
    return [] as ResultRecord[];
  }
}

export async function writeResults(results: ResultRecord[]): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(resultsPath, JSON.stringify(results, null, 2), "utf-8");
}

export async function writeTests(tests: Test[]): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(testsPath, JSON.stringify(tests, null, 2), "utf-8");
}
