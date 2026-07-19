import type { ReflectionAnalysis } from "@/features/reflections/types";
import type { AppLocale } from "@/shared/i18n/locales";

export type StudentRecord = { id: string; display_name: string; student_code: string | null; active: boolean };
export type ClassRecord = { id: string; class_name: string; year_level: string; subject: string; created_at: string; students: StudentRecord[] };
export type DiagnosticAnswerRecord = { id: string; question_id: string; question: string; answer: string | null };
export type OutcomeRecord = { id: string; outcome: "successful" | "partly_successful" | "unsuccessful" | "not_implemented"; notes: string | null; remaining_student_count: number | null; intervention_date: string };
export type RescueRecord = { id: string; title: string; duration_minutes: 5 | 10 | 15; objective: string; materials: string[]; steps: ReflectionAnalysis["lessonRescue"]["steps"]; alternative_explanation: string | null; exit_questions: string[]; confirmed: boolean; intervention_outcomes: OutcomeRecord[] };
export type ReflectionRecord = { id: string; class_id: string; transcript: string; subject: string | null; topic: string | null; class_summary: string | null; analysis: ReflectionAnalysis; status: "draft" | "confirmed"; recorded_at: string; diagnostic_answers: DiagnosticAnswerRecord[]; lesson_rescues: RescueRecord[] };
export type ClassPulse = { id: string; class_id: string; understanding: "strong" | "mixed" | "needs_support"; engagement: "high" | "mixed" | "low"; energy_level: "high" | "normal" | "low"; note: string | null; observed_at: string };
export type ProfileRecord = { id: string; display_name: string; school_name: string | null; primary_subject: string | null; preferred_locale: AppLocale; timezone: string; weekly_reflection_goal: 3 | 5 | 7 };
export type DashboardData = { profile: ProfileRecord; classes: ClassRecord[]; reflections: ReflectionRecord[]; reflectionHasMore: boolean; pulses: ClassPulse[] };
export function asArray<T>(value: T | T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

export function normalizeReflectionRecord(record: ReflectionRecord): ReflectionRecord {
  return {
    ...record,
    diagnostic_answers: asArray(record.diagnostic_answers),
    lesson_rescues: asArray(record.lesson_rescues).map((plan) => ({
      ...plan,
      intervention_outcomes: asArray(plan.intervention_outcomes),
    })),
  };
}