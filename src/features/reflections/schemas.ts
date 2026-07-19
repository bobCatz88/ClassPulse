import { z } from "zod";

const confidenceSchema = z.enum(["high", "medium", "low"]);
const textSchema = z.string().trim().min(1).max(20_000);
const shortTextSchema = z.string().trim().min(1).max(1_000);

export const reflectionAnalysisSchema = z.object({
  summary: textSchema,
  observations: z.array(z.object({
    text: shortTextSchema,
    evidence: shortTextSchema,
    confidence: confidenceSchema,
  })).max(6),
  learningIssues: z.array(z.object({
    title: shortTextSchema,
    description: shortTextSchema,
    evidence: shortTextSchema,
    confidence: confidenceSchema,
  })).max(5),
  diagnosticQuestions: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    question: shortTextSchema,
    options: z.array(shortTextSchema).min(2).max(4),
    allowUnsure: z.boolean(),
  })).max(3),
  lessonRescue: z.object({
    durationMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]),
    objective: shortTextSchema,
    materials: z.array(shortTextSchema).max(6),
    steps: z.array(z.object({
      title: shortTextSchema,
      instruction: shortTextSchema,
      durationMinutes: z.number().int().min(1).max(15),
    })).min(1).max(6),
    alternativeExplanation: shortTextSchema,
    exitQuestions: z.array(shortTextSchema).min(2).max(4),
  }),
});

export const saveReflectionRequestSchema = z.object({
  diagnosticAnswers: z.record(z.string(), z.string().trim().max(1_000)).default({}),
  classId: z.string().uuid(),
  transcript: z.string().trim().min(3).max(20_000),
  topic: z.string().trim().max(120).optional().default(""),
  analysis: reflectionAnalysisSchema,
  idempotencyKey: z.string().uuid(),
});

export type SaveReflectionRequest = z.infer<typeof saveReflectionRequestSchema>;

export const reflectionHistoryQuerySchema = z.object({
  before: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(25),
});
