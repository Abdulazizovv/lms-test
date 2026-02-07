import { readTests } from "@/lib/data";
import QuizClient from "@/app/quiz/[testId]/QuizClient";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const tests = await readTests();
  const test = tests.find((item) => item.id === testId);

  if (!test) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Test topilmadi.
      </div>
    );
  }

  return <QuizClient test={test} />;
}
