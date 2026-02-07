import { readTests } from "@/lib/data";
import TestsList from "@/app/tests/TestsList";

export default async function TestsPage() {
  const tests = await readTests();

  return <TestsList tests={tests} />;
}
