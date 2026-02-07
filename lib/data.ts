import fs from "fs/promises";
import path from "path";
import type { ResultRecord, Test } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const testsPath = path.join(dataDir, "tests.json");
const resultsPath = path.join(dataDir, "results.json");

export async function readTests(): Promise<Test[]> {
  const raw = await fs.readFile(testsPath, "utf-8");
  return JSON.parse(raw) as Test[];
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
