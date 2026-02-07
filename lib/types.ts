export type TestQuestion = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
};

export type Test = {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | string;
  timeLimitSec?: number;
  questions: TestQuestion[];
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
  test: { id: string; title: string };
  score: { correct: number; total: number; percent: number };
  level: "Beginner" | "Intermediate" | "Advanced";
  answers: AnswerRecord[];
};
