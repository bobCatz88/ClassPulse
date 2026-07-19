import type { ReflectionRecord, RescueRecord } from "@/features/dashboard/types";

export function formatLessonRescueForExport({
  className,
  reflection,
  plan,
  includeTranscript = false,
}: {
  className: string;
  reflection: ReflectionRecord;
  plan: RescueRecord;
  includeTranscript?: boolean;
}) {
  const date = new Date(reflection.recorded_at).toLocaleDateString("ms-MY");
  const lines = [
    "ClassPulse AI - Lesson Rescue",
    `Tarikh: ${date}`,
    `Kelas: ${className}`,
    `Subjek: ${reflection.subject || "-"}`,
    `Topik: ${reflection.topic || "-"}`,
    "",
    `Tajuk: ${plan.title}`,
    `Tempoh: ${plan.duration_minutes} minit`,
    `Objektif: ${plan.objective}`,
    "",
    "Langkah:",
    ...plan.steps.map((step, index) => `${index + 1}. ${step.title} (${step.durationMinutes} minit): ${step.instruction}`),
    "",
    `Penerangan alternatif: ${plan.alternative_explanation || "-"}`,
    "",
    "Soalan semakan:",
    ...plan.exit_questions.map((question, index) => `${index + 1}. ${question}`),
    "",
    "Nota privasi: Eksport ini tidak memasukkan nama murid secara lalai.",
    "Disclaimer: Analisis ini ialah cadangan. Guru perlu menyemak sebelum digunakan sebagai rekod rasmi.",
  ];
  if (includeTranscript) lines.splice(6, 0, `Ringkasan: ${reflection.class_summary || "-"}`, `Transkrip: ${reflection.transcript}`, "");
  return lines.join("\n");
}
