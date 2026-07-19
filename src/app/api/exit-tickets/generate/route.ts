import { z } from "zod";

import { AuthenticationError, requireAuthenticatedUser } from "@/server/auth/require-user";
import { checkRateLimit } from "@/server/http/rate-limit";
import { createRequestId, errorLogMeta, logger, requestLogMeta } from "@/server/logging/logger";

const requestSchema = z.object({ classId: z.string().uuid(), lessonRescueId: z.string().uuid(), format: z.enum(["objective", "short", "mixed"]) });

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = createRequestId();
  let status = 500;
  logger.info("Permintaan HTTP diterima", { event: "http.request", ...requestLogMeta(request, requestId) });
  try {
    const body = await request.json() as unknown;
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) { status = 400; return Response.json({ error: "Permintaan Exit Ticket tidak sah.", requestId }, { status, headers: { "X-Request-Id": requestId } }); }
    const { supabase, user } = await requireAuthenticatedUser();
    if (!checkRateLimit(`exit-ticket:${user.id}`, { limit: 12, windowMs: 60_000 }).allowed) { status = 429; return Response.json({ error: "Terlalu banyak permintaan. Cuba sebentar lagi.", requestId }, { status, headers: { "X-Request-Id": requestId } }); }
    const { data: rescue } = await supabase.from("lesson_rescues").select("id, objective, exit_questions, reflections!inner(class_id)").eq("id", parsed.data.lessonRescueId).maybeSingle();
    if (!rescue || (rescue.reflections as { class_id?: string } | null)?.class_id !== parsed.data.classId) { status = 404; return Response.json({ error: "Lesson Rescue tidak ditemui.", requestId }, { status, headers: { "X-Request-Id": requestId } }); }
    const prompts = (rescue.exit_questions as string[]).slice(0, 3);
    const questions: Array<{ id: string; type: string; prompt: string; options: string[] }> = prompts.map((prompt, index) => ({ id: `q${index + 1}`, type: parsed.data.format === "mixed" ? (index === 0 ? "objective" : "short") : parsed.data.format, prompt, options: parsed.data.format === "short" ? [] : ["Belum pasti", "Sebahagian", "Betul"] }));
    questions.push({ id: "confidence", type: "confidence", prompt: "Sejauh mana anda yakin dengan jawapan anda?", options: ["Masih keliru", "Hampir faham", "Yakin"] });
    status = 200;
    return Response.json({ questions, answerKey: prompts.map((prompt, index) => ({ questionId: `q${index + 1}`, guidance: `Cari bukti kefahaman untuk: ${prompt}` })) }, { headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } });
  } catch (error) {
    if (error instanceof AuthenticationError) { status = 401; return Response.json({ error: "Sesi tamat.", requestId }, { status, headers: { "X-Request-Id": requestId } }); }
    logger.error("Exit Ticket gagal dijana", { event: "exit_ticket.generate_failed", requestId, ...errorLogMeta(error) });
    status = 500;
    return Response.json({ error: "Exit Ticket tidak dapat dijana.", requestId }, { status, headers: { "X-Request-Id": requestId } });
  } finally {
    logger.info("Permintaan Exit Ticket selesai", { event: "exit_ticket.generate", requestId, status, durationMs: Date.now() - startedAt });
  }
}
