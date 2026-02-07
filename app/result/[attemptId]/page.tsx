import { Suspense } from "react";
import ResultClient from "@/app/result/[attemptId]/ResultClient";
import { use } from "react";

export default function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = use(params);
  return (
    <Suspense
      fallback={
        <div className="text-sm text-slate-600">Natija yuklanmoqda...</div>
      }
    >
      <ResultClient attemptId={attemptId} />
    </Suspense>
  );
}
