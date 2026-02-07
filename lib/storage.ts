export const storageKeys = {
  student: "assessment.student",
  submittedAttempts: "assessment.submittedAttempts",
  answers: (testId: string) => `assessment.answers.${testId}`,
  attempt: (testId: string) => `assessment.attempt.${testId}`,
  quizProgress: (testId: string) => `assessment.progress.${testId}`,
  result: (attemptId: string) => `assessment.result.${attemptId}`,
};
