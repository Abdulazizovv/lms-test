export function getLevel(percent: number): "Beginner" | "Intermediate" | "Advanced" {
  if (percent <= 40) return "Beginner";
  if (percent <= 70) return "Intermediate";
  return "Advanced";
}
