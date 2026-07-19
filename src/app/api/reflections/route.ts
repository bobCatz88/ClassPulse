import { z } from "zod";

import { saveReflectionRequestSchema } from "@/features/reflections/schemas";
import type { ApiErrorResponse } from "@/features/reflections/types";
import { AuthenticationError, requireAuthenticatedUser } from "@/server/auth/require-user";
import { checkRateLimit } from "@/server/http/rate-limit";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 150_000;

type SaveBundleResult = {
  reflection_id: string;
  lesson_rescue_id: string | null;
  created: boolean;
};

/** Simpan refleksi, jawapan diagnosis dan Lesson Rescue sebagai satu transaksi. */
export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  let status = 500;

  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      status = 413;
      return errorResponse("Permintaan terlalu besar.", status, requestId);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      status = 400;
      return errorResponse("JSON permintaan tidak sah.", status, requestId);
    }

    const validation = saveReflectionRequestSchema.safeParse(body);
    if (!validation.success) {
      status = 400;
      return errorResponse(
        "Maklumat refleksi tidak sah.",
        status,
        requestId,
        flattenIssues(validation.error),
      );
    }

    const { supabase, user } = await requireAuthenticatedUser();
    const limit = checkRateLimit(`save-reflection:${user.id}`, {
      limit: 30,
      windowMs: 60_000,
    });
    if (!limit.allowed) {
      status = 429;
      return errorResponse(
        "Terlalu banyak cubaan simpan. Sila tunggu sebentar.",
        status,
        requestId,
        undefined,
        limit.retryAfterSeconds,
      );
    }

    const { data: ownedClass, error: classError } = await supabase
      .from("classes")
      .select("id, subject")
      .eq("id", validation.data.classId)
      .maybeSingle();

    if (classError) throw classError;
    if (!ownedClass) {
      status = 403;
      return errorResponse("Kelas tidak ditemui atau anda tidak mempunyai akses.", status, requestId);
    }

    const analysis = validation.data.analysis;
    const { data: savedBundle, error: saveError } = await supabase.rpc(
      "save_reflection_bundle",
      {
        p_class_id: validation.data.classId,
        p_transcript: validation.data.transcript,
        p_subject: ownedClass.subject,
        p_topic: validation.data.topic,
        p_class_summary: analysis.summary,
        p_analysis: analysis,
        p_diagnostic_answers: analysis.diagnosticQuestions.map((question) => ({
          question_id: question.id,
          question: question.question,
          options: question.options,
          answer: validation.data.diagnosticAnswers[question.id] || "Tidak pasti",
        })),
        p_lesson_rescue: {
          ...analysis.lessonRescue,
          title: `Lesson Rescue: ${validation.data.topic || ownedClass.subject}`,
        },
        p_idempotency_key: validation.data.idempotencyKey,
      },
    );

    if (saveError) throw saveError;
    const bundle = savedBundle as SaveBundleResult | null;
    if (!bundle?.reflection_id) throw new Error("Simpanan refleksi tidak memulangkan ID rekod.");

    const { data: reflection, error: reflectionError } = await supabase
      .from("reflections")
      .select("id, class_id, transcript, subject, topic, class_summary, analysis, status, recorded_at, diagnostic_answers(id, question_id, question, answer), lesson_rescues(id, title, duration_minutes, objective, materials, steps, alternative_explanation, exit_questions, confirmed, intervention_outcomes(id, outcome, notes, remaining_student_count, intervention_date))")
      .eq("id", bundle.reflection_id)
      .single();

    if (reflectionError) throw reflectionError;

    status = 201;
    return Response.json(
      { reflection, created: bundle.created },
      { status, headers: responseHeaders(requestId) },
    );
  } catch (error) {
    if (error instanceof AuthenticationError) {
      status = 401;
      return errorResponse("Sesi tamat. Log masuk semula.", status, requestId);
    }

    console.error("[ClassPulse] reflection.save_failed", {
      requestId,
      message: error instanceof Error ? error.message : "Ralat tidak diketahui",
    });
    status = 500;
    return errorResponse("Refleksi tidak dapat disimpan buat masa ini.", status, requestId);
  } finally {
    console.info("[ClassPulse] reflection.save", {
      requestId,
      status,
      durationMs: Date.now() - startedAt,
    });
  }
}

function flattenIssues(error: z.ZodError): Record<string, string> {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "body";
    if (!details[key]) details[key] = issue.message;
  }
  return details;
}

function responseHeaders(requestId: string, retryAfterSeconds?: number): HeadersInit {
  return {
    "Cache-Control": "no-store",
    "X-Request-Id": requestId,
    ...(retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : {}),
  };
}

function errorResponse(
  error: string,
  status: number,
  requestId: string,
  details?: Record<string, string>,
  retryAfterSeconds?: number,
): Response {
  const body: ApiErrorResponse & { requestId: string } = details
    ? { error, details, requestId }
    : { error, requestId };

  return Response.json(body, {
    status,
    headers: responseHeaders(requestId, retryAfterSeconds),
  });
}
