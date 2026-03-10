export type TestQuestion = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  imageUrl?: string;
};

export type Test = {
  id: string;
  branchId?: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | string;
  timeLimitSec?: number;
  questions: TestQuestion[];
};

export type Branch = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  address?: string;
  phone?: string;
};

export type StudentInfo = {
  name: string;
  age: number;
};

export type AnswerRecord = {
  questionId: string;
  selectedIndex: number | null;
  isCorrect: boolean;
};

export type ResultRecord = {
  attemptId: string;
  createdAt: string;
  student: StudentInfo;
  branch?: { id: string; name: string };
  test: { id: string; title: string };
  durationSec?: number;
  score: { correct: number; total: number; percent: number };
  level: "Beginner" | "Intermediate" | "Advanced";
  answers: AnswerRecord[];
};
