import { NextRequest, NextResponse } from "next/server";

import { reflectionHistoryQuerySchema } from "@/features/reflections/schemas";
import { requireAuthenticatedUser, AuthenticationError } from "@/server/auth/require-user";
import { checkRateLimit } from "@/server/http/rate-limit";
import { createRequestId, errorLogMeta, logger, requestLogMeta } from "@/server/logging/logger";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = createRequestId();
  let status = 500;
  logger.info("Permintaan HTTP diterima", { event: "http.request", ...requestLogMeta(request, requestId) });

  try {
    const { user } = await requireAuthenticatedUser();
    const rate = checkRateLimit(`reflection-history:${user.id}`, { limit: 60, windowMs: 60_000 });
    if (!rate.allowed) {
      status = 429;
      return NextResponse.json({ error: "Terlalu banyak permintaan. Cuba sebentar lagi." }, { status, headers: { "x-request-id": requestId, "retry-after": String(rate.retryAfterSeconds) } });
    }

    const query = reflectionHistoryQuerySchema.safeParse({
      before: request.nextUrl.searchParams.get("before") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });
    if (!query.success) {
      status = 400;
      return NextResponse.json({ error: "Parameter sejarah tidak sah." }, { status, headers: { "x-request-id": requestId } });
    }

    const supabase = await createSupabaseServerClient();
    let reflectionsQuery = supabase
      .from("reflections")
      .select("id, class_id, transcript, subject, topic, class_summary, analysis, status, recorded_at, diagnostic_answers(id, question_id, question, answer), lesson_rescues(id, title, duration_minutes, objective, materials, steps, alternative_explanation, exit_questions, confirmed, intervention_outcomes(id, outcome, notes, remaining_student_count, intervention_date))")
      .order("recorded_at", { ascending: false })
      .range(0, query.data.limit);
    if (query.data.before) reflectionsQuery = reflectionsQuery.lt("recorded_at", query.data.before);

    const { data, error } = await reflectionsQuery;
    if (error) throw error;

    const hasMore = (data?.length ?? 0) > query.data.limit;
    status = 200;
    return NextResponse.json({ reflections: (data ?? []).slice(0, query.data.limit), hasMore }, { headers: { "x-request-id": requestId } });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      status = 401;
      return NextResponse.json({ error: "Sila log masuk semula." }, { status, headers: { "x-request-id": requestId } });
    }
    logger.error("Sejarah refleksi gagal", { event: "reflection.history_failed", requestId, ...errorLogMeta(error) });
    status = 500;
    return NextResponse.json({ error: "Sejarah refleksi tidak dapat dimuatkan." }, { status, headers: { "x-request-id": requestId } });
  } finally {
    logger.info("Permintaan sejarah refleksi selesai", { event: "reflection.history", requestId, status, durationMs: Date.now() - startedAt });
  }
}