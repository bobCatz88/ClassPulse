import { describe, expect, it } from "vitest";

import { reflectionHistoryQuerySchema, saveReflectionRequestSchema } from "./schemas";

const validRequest = {
  classId: "81fc1d58-0da4-45d3-8874-62bbb501a90a",
  transcript: "Sebahagian murid masih keliru tentang pecahan setara.",
  topic: "Pecahan",
  idempotencyKey: "bc702a76-4e74-4a33-a9ae-7fe7a66c274d",
  analysis: {
    summary: "Guru melihat kekeliruan pada pecahan setara.",
    observations: [{ text: "Murid keliru", evidence: "Beberapa jawapan salah", confidence: "medium" }],
    learningIssues: [{ title: "Pecahan setara", description: "Konsep belum kukuh", evidence: "Jawapan salah", confidence: "medium" }],
    diagnosticQuestions: [{ id: "evidence", question: "Apakah bukti paling jelas?", options: ["Jawapan lisan", "Latihan"], allowUnsure: true }],
    lessonRescue: {
      durationMinutes: 10,
      objective: "Semak dan baiki konsep pecahan setara.",
      materials: ["Kad pecahan"],
      steps: [{ title: "Semak", instruction: "Murid padankan dua pecahan.", durationMinutes: 5 }],
      alternativeExplanation: "Gunakan gambar petak yang dibahagi sama rata.",
      exitQuestions: ["Apakah pecahan setara?", "Berikan satu contoh."],
    },
  },
};

describe("saveReflectionRequestSchema", () => {
  it("menerima rekod refleksi lengkap dan menambah jawapan diagnosis kosong", () => {
    const parsed = saveReflectionRequestSchema.parse(validRequest);

    expect(parsed.transcript).toBe(validRequest.transcript);
    expect(parsed.diagnosticAnswers).toEqual({});
  });

  it("menolak idempotency key yang bukan UUID", () => {
    const result = saveReflectionRequestSchema.safeParse({
      ...validRequest,
      idempotencyKey: "bukan-uuid",
    });

    expect(result.success).toBe(false);
  });

  it("menolak pelan tanpa sekurang-kurangnya dua exit ticket", () => {
    const result = saveReflectionRequestSchema.safeParse({
      ...validRequest,
      analysis: {
        ...validRequest.analysis,
        lessonRescue: { ...validRequest.analysis.lessonRescue, exitQuestions: ["Satu sahaja"] },
      },
    });

    expect(result.success).toBe(false);
  });
});

describe("reflectionHistoryQuerySchema", () => {
  it("menetapkan had lalai yang selamat", () => {
    expect(reflectionHistoryQuerySchema.parse({})).toEqual({ limit: 25 });
  });

  it("menolak permintaan melebihi had halaman", () => {
    expect(reflectionHistoryQuerySchema.safeParse({ limit: 51 }).success).toBe(false);
  });

  it("menerima cursor ISO yang sah", () => {
    expect(reflectionHistoryQuerySchema.parse({ before: "2026-07-19T09:00:00.000Z" }).before).toBe("2026-07-19T09:00:00.000Z");
  });
});
