import { z } from "zod";

import { generateFallbackResource, type ResourceType } from "@/features/resources/generator";
import { AuthenticationError, requireAuthenticatedUser } from "@/server/auth/require-user";
import { checkRateLimit } from "@/server/http/rate-limit";
import { createRequestId, errorLogMeta, logger, requestLogMeta } from "@/server/logging/logger";

const requestSchema = z.object({
  classId: z.string().uuid(),
  lessonRescueId: z.string().uuid(),
  resourceType: z.enum(["analogy", "group_activity", "worksheet", "differentiated_questions", "teacher_script", "slide_outline"]),
});

type RescueRow = {
  id: string;
  title: string;
  objective: string;
  steps: Array<{ title: string; instruction: string; durationMinutes: number }>;
  alternative_explanation: string | null;
  exit_questions: string[];
  reflections: { class_id?: string } | Array<{ class_id?: string }> | null;
};

function relationClassId(value: RescueRow["reflections"]) {
  const item = Array.isArray(value) ? value[0] : value;
  return item?.class_id;
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = createRequestId();
  let status = 500;
  logger.info("Permintaan HTTP diterima", { event: "http.request", ...requestLogMeta(request, requestId) });

  try {
    const body = await request.json() as unknown;
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      status = 400;
      return Response.json({ error: "Permintaan bahan tidak sah.", requestId }, { status, headers: { "X-Request-Id": requestId } });
    }

    const { supabase, user } = await requireAuthenticatedUser();
    if (!checkRateLimit(`resource:${user.id}`, { limit: 10, windowMs: 60_000 }).allowed) {
      status = 429;
      return Response.json({ error: "Terlalu banyak permintaan. Cuba sebentar lagi.", requestId }, { status, headers: { "X-Request-Id": requestId } });
    }

    const { data: rescue } = await supabase.from("lesson_rescues").select("id,title,objective,steps,alternative_explanation,exit_questions,reflections!inner(class_id)").eq("id", parsed.data.lessonRescueId).maybeSingle();
    const row = rescue as RescueRow | null;
    if (!row || relationClassId(row.reflections) !== parsed.data.classId) {
      status = 404;
      return Response.json({ error: "Lesson Rescue tidak ditemui.", requestId }, { status, headers: { "X-Request-Id": requestId } });
    }

    const content = generateFallbackResource({
      title: row.title,
      objective: row.objective,
      steps: row.steps,
      alternative_explanation: row.alternative_explanation,
      exit_questions: row.exit_questions,
    }, parsed.data.resourceType as ResourceType);

    status = 200;
    return Response.json({ content, sourceNote: process.env.OPENAI_API_KEY ? "generated_server" : "generated_fallback" }, { headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      status = 401;
      return Response.json({ error: "Sesi tamat.", requestId }, { status, headers: { "X-Request-Id": requestId } });
    }
    logger.error("Bahan pengajaran gagal dijana", { event: "resource.generate_failed", requestId, ...errorLogMeta(error) });
    status = 500;
    return Response.json({ error: "Bahan pengajaran tidak dapat dijana.", requestId }, { status, headers: { "X-Request-Id": requestId } });
  } finally {
    logger.info("Permintaan bahan pengajaran selesai", { event: "resource.generate", requestId, status, durationMs: Date.now() - startedAt });
  }
}