import { describe, expect, it } from "vitest";
import { generateFallbackResource } from "./generator";

const plan = {
  title: "Rescue Pecahan",
  objective: "Murid membezakan pengangka dan penyebut.",
  steps: [{ title: "Model", instruction: "Tunjuk satu bulatan dibahagi empat.", durationMinutes: 5 }],
  exit_questions: ["Apakah fungsi penyebut?"],
  alternative_explanation: "Penyebut ialah jumlah bahagian.",
} as never;

describe("jana bahan pengajaran fallback", () => {
  it("menghasilkan lembaran kerja daripada soalan exit ticket", () => {
    const resource = generateFallbackResource(plan, "worksheet");
    expect(resource.title).toContain("Lembaran kerja");
    expect(resource.sections.some((section) => section.body.includes("penyebut"))).toBe(true);
  });
});
