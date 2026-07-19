import { describe, expect, it } from "vitest";
import { formatLessonRescueForExport } from "./lesson-rescue-export";

const reflection = {
  id: "r1",
  class_id: "c1",
  transcript: "Ahmad dan Ali keliru tentang pecahan.",
  subject: "Matematik",
  topic: "Pecahan",
  class_summary: "Murid keliru tentang pecahan.",
  analysis: { learningIssues: [], studentObservations: [], diagnosticQuestions: [], lessonRescue: {} },
  status: "confirmed",
  recorded_at: "2026-07-19T00:00:00.000Z",
  diagnostic_answers: [],
  lesson_rescues: [],
} as never;

const plan = {
  id: "p1",
  title: "Rescue Pecahan",
  duration_minutes: 10,
  objective: "Bezakan pengangka dan penyebut.",
  materials: [],
  steps: [{ title: "Model visual", durationMinutes: 5, instruction: "Guna bulatan pecahan." }],
  alternative_explanation: "Penyebut ialah jumlah bahagian.",
  exit_questions: ["Dalam 1/4, nombor mana penyebut?"],
  confirmed: true,
  intervention_outcomes: [],
} as never;

describe("eksport Lesson Rescue", () => {
  it("tidak memasukkan transkrip atau nama murid secara lalai", () => {
    const output = formatLessonRescueForExport({ className: "3 Cemerlang", reflection, plan });
    expect(output).toContain("Rescue Pecahan");
    expect(output).toContain("Nota privasi");
    expect(output).not.toContain("Ahmad");
    expect(output).not.toContain("Ali");
  });
});
