import { NextRequest, NextResponse } from "next/server";

import { reflectionHistoryQuerySchema } from "@/features/reflections/schemas";
import { requireAuthenticatedUser, AuthenticationError } from "@/server/auth/require-user";
import { checkRateLimit } from "@/server/http/rate-limit";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { user } = await requireAuthenticatedUser();
    const rate = checkRateLimit(`reflection-history:${user.id}`, { limit: 60, windowMs: 60_000 });
    if (!rate.allowed) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Cuba sebentar lagi." }, { status: 429, headers: { "x-request-id": requestId, "retry-after": String(rate.retryAfterSeconds) } });
    }

    const query = reflectionHistoryQuerySchema.safeParse({
      before: request.nextUrl.searchParams.get("before") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });
    if (!query.success) return NextResponse.json({ error: "Parameter sejarah tidak sah." }, { status: 400, headers: { "x-request-id": requestId } });

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
    return NextResponse.json({ reflections: (data ?? []).slice(0, query.data.limit), hasMore }, { headers: { "x-request-id": requestId } });
  } catch (error) {
    if (error instanceof AuthenticationError) return NextResponse.json({ error: "Sila log masuk semula." }, { status: 401, headers: { "x-request-id": requestId } });
    console.error(JSON.stringify({ event: "reflection_history_failed", requestId, message: error instanceof Error ? error.message : "unknown" }));
    return NextResponse.json({ error: "Sejarah refleksi tidak dapat dimuatkan." }, { status: 500, headers: { "x-request-id": requestId } });
  }
}
