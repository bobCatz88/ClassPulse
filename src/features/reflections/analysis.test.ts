import { describe, expect, it } from "vitest";

import { createDemoReflectionAnalysis, validateAnalyzeRequest } from "./analysis";

describe("analisis refleksi", () => {
  it("menormalisasi transkrip tanpa mengubah input kepada arahan", () => {
    const result = validateAnalyzeRequest({
      classId: "class-1",
      transcript: "  Murid   masih   keliru.  ",
    });

    expect(result).toEqual({
      success: true,
      data: { classId: "class-1", transcript: "Murid masih keliru." },
    });
  });

  it("menghasilkan fallback English apabila guru memilih English", () => {
    const analysis = createDemoReflectionAnalysis({
      classId: "class-1",
      transcript: "Several students are confused about equivalent fractions.",
      locale: "en",
    });

    expect(analysis.summary).toContain("Teacher reflection");
    expect(analysis.diagnosticQuestions[0]?.options).toContain("Not sure");
    expect(analysis.lessonRescue.objective).toContain("Identify");
  });
});
