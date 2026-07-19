import { describe, expect, it } from "vitest";
import { repeatedLearningIssues } from "./insights";
describe("insight berasaskan bukti", () => { it("menyembunyikan pola dengan kurang daripada tiga bukti", () => { const reflections = ["1", "2", "3"].map((id) => ({ id, analysis: { learningIssues: [{ title: "Pecahan setara" }] } })) as never; expect(repeatedLearningIssues(reflections)).toEqual([{ title: "pecahan setara", count: 3, reflectionIds: ["1", "2", "3"] }]); }); });
