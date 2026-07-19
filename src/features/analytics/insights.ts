import type { ReflectionRecord } from "@/features/dashboard/types";

export type EvidenceInsight = { title: string; count: number; reflectionIds: string[] };

export function repeatedLearningIssues(reflections: ReflectionRecord[]): EvidenceInsight[] {
  const evidence = new Map<string, { count: number; reflectionIds: string[] }>();
  for (const reflection of reflections) for (const issue of reflection.analysis.learningIssues || []) {
    const key = issue.title.trim().toLocaleLowerCase("ms-MY");
    if (!key) continue;
    const value = evidence.get(key) || { count: 0, reflectionIds: [] };
    value.count += 1; value.reflectionIds.push(reflection.id); evidence.set(key, value);
  }
  return [...evidence.entries()].filter(([, value]) => value.count >= 3).map(([title, value]) => ({ title, ...value })).sort((a, b) => b.count - a.count);
}
