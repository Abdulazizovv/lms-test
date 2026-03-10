import { redirect } from "next/navigation";
import { readBranches, readTests } from "@/lib/data";
import QuizClient from "@/app/quiz/[testId]/QuizClient";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ branch?: string }>;
}) {
  const { testId } = await params;
  const { branch } = await searchParams;
  if (!branch) redirect("/branches");

  const branches = await readBranches();
  const selectedBranch = branches.find((item) => item.id === branch);
  if (!selectedBranch) redirect("/branches");

  const tests = await readTests();
  const test = tests.find((item) => item.id === testId);

  if (!test) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Test topilmadi.
      </div>
    );
  }

  return (
    <QuizClient
      test={test}
      branch={{ id: selectedBranch.id, name: selectedBranch.name }}
    />
  );
}
