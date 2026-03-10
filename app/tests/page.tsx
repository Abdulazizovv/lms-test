import { redirect } from "next/navigation";
import { readBranches, readTests } from "@/lib/data";
import TestsList from "@/app/tests/TestsList";

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const { branch } = await searchParams;
  if (!branch) redirect("/branches");

  const tests = await readTests();
  const branches = await readBranches();
  const selectedBranch = branches.find((item) => item.id === branch);
  if (!selectedBranch) redirect("/branches");

  const filtered = tests.filter((t) => (t.branchId ?? "main") === selectedBranch.id);

  return (
    <TestsList
      tests={filtered}
      branch={{ id: selectedBranch.id, name: selectedBranch.name }}
    />
  );
}
