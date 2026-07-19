import type { RescueRecord } from "@/features/dashboard/types";

export type ResourceType = "analogy" | "group_activity" | "worksheet" | "differentiated_questions" | "teacher_script" | "slide_outline";
export type TeachingResourceContent = { title: string; sections: Array<{ heading: string; body: string }> };

const labels: Record<ResourceType, string> = {
  analogy: "Analogi alternatif",
  group_activity: "Aktiviti kumpulan",
  worksheet: "Lembaran kerja",
  differentiated_questions: "Soalan pembezaan aras",
  teacher_script: "Skrip penerangan guru",
  slide_outline: "Rangka slaid ringkas",
};

export function generateFallbackResource(plan: Pick<RescueRecord, "title" | "objective" | "steps" | "exit_questions" | "alternative_explanation">, resourceType: ResourceType): TeachingResourceContent {
  const baseTitle = `${labels[resourceType]}: ${plan.title}`;
  if (resourceType === "worksheet") {
    return { title: baseTitle, sections: [{ heading: "Arahan", body: `Jawab soalan berdasarkan objektif: ${plan.objective}` }, ...plan.exit_questions.map((question, index) => ({ heading: `Soalan ${index + 1}`, body: question }))] };
  }
  if (resourceType === "differentiated_questions") {
    return { title: baseTitle, sections: ["Asas", "Sederhana", "Cabaran"].map((level, index) => ({ heading: level, body: plan.exit_questions[index] || plan.objective })) };
  }
  if (resourceType === "teacher_script") {
    return { title: baseTitle, sections: [{ heading: "Pembukaan", body: `Hari ini kita fokus kepada: ${plan.objective}` }, ...plan.steps.map((step) => ({ heading: step.title, body: step.instruction })), { heading: "Semak kefahaman", body: plan.exit_questions.join(" ") }] };
  }
  if (resourceType === "slide_outline") {
    return { title: baseTitle, sections: [{ heading: "Slaid 1", body: plan.objective }, ...plan.steps.map((step, index) => ({ heading: `Slaid ${index + 2}: ${step.title}`, body: step.instruction }))] };
  }
  if (resourceType === "group_activity") {
    return { title: baseTitle, sections: [{ heading: "Aktiviti", body: plan.steps.map((step) => step.instruction).join(" ") }, { heading: "Bukti pembelajaran", body: plan.exit_questions[0] || plan.objective }] };
  }
  return { title: baseTitle, sections: [{ heading: "Analogi", body: plan.alternative_explanation || plan.objective }, { heading: "Semakan", body: plan.exit_questions[0] || "Minta murid terangkan semula dengan ayat sendiri." }] };
}
