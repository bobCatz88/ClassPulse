import {
  createDemoReflectionAnalysis,
  MAX_TRANSCRIPT_LENGTH,
  validateAnalyzeRequest,
} from "@/features/reflections/analysis";
import { analyzeReflectionWithOpenAI } from "@/features/reflections/openai-analysis";
import type { ApiErrorResponse } from "@/features/reflections/types";
import { AuthenticationError, requireAuthenticatedUser } from "@/server/auth/require-user";
import { checkRateLimit } from "@/server/http/rate-limit";
import { createRequestId, errorLogMeta, logger, requestLogMeta } from "@/server/logging/logger";

const MAX_REQUEST_BYTES = MAX_TRANSCRIPT_LENGTH * 4;

export const runtime = "nodejs";

/**
 * POST /api/reflections/analyze
 *
 * Menganalisis transkrip refleksi guru. OPENAI_API_KEY adalah pilihan:
 * tanpa kunci, endpoint memulangkan analisis demo yang selamat dan deterministik.
 */
export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  const requestId = createRequestId();
  let status = 500;

  logger.info("Permintaan HTTP diterima", { event: "http.request", ...requestLogMeta(request, requestId) });

  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      status = 413;
      return errorResponse(
        "Permintaan terlalu besar.",
        status,
        requestId,
        { transcript: `Transkrip dihadkan kepada ${MAX_TRANSCRIPT_LENGTH} aksara.` },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      status = 400;
      return errorResponse("JSON permintaan tidak sah.", status, requestId);
    }

    const validation = validateAnalyzeRequest(body);
    if (!validation.success) {
      status = 400;
      return errorResponse("Maklumat permintaan tidak sah.", status, requestId, validation.details);
    }

    const { supabase, user } = await requireAuthenticatedUser();
    const limit = checkRateLimit(`analyze-reflection:${user.id}`, {
      limit: 12,
      windowMs: 60_000,
    });
    if (!limit.allowed) {
      status = 429;
      return errorResponse(
        "Terlalu banyak analisis. Sila tunggu sebentar.",
        status,
        requestId,
        undefined,
        limit.retryAfterSeconds,
      );
    }

    const { data: ownedClass, error: classError } = await supabase
      .from("classes")
      .select("id")
      .eq("id", validation.data.classId)
      .maybeSingle();
    if (classError) throw classError;
    if (!ownedClass) {
      status = 403;
      return errorResponse("Kelas tidak ditemui atau anda tidak mempunyai akses.", status, requestId);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_locale")
      .eq("id", user.id)
      .maybeSingle();
    const analysisRequest = { ...validation.data, locale: profile?.preferred_locale === "en" ? "en" as const : "ms-MY" as const };

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      status = 200;
      return analysisResponse(createDemoReflectionAnalysis(analysisRequest), "demo-no-key", requestId);
    }

    try {
      const analysis = await analyzeReflectionWithOpenAI(analysisRequest, apiKey);
      status = 200;
      return analysisResponse(analysis, "openai", requestId);
    } catch (error) {
      logger.warn("Fallback analisis demo digunakan", { event: "reflection.openai_fallback", requestId, ...errorLogMeta(error) });
      status = 200;
      return analysisResponse(
        createDemoReflectionAnalysis(analysisRequest),
        "demo-openai-error",
        requestId,
      );
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      status = 401;
      return errorResponse("Sesi tamat. Log masuk semula.", status, requestId);
    }

    logger.error("Analisis refleksi gagal", { event: "reflection.analyze_failed", requestId, ...errorLogMeta(error) });
    status = 500;
    return errorResponse("Analisis tidak dapat dijalankan buat masa ini.", status, requestId);
  } finally {
    logger.info("Permintaan analisis refleksi selesai", { event: "reflection.analyze", requestId, status, durationMs: Date.now() - startedAt });
  }
}

function analysisResponse(
  data: ReturnType<typeof createDemoReflectionAnalysis>,
  source: "openai" | "demo-no-key" | "demo-openai-error",
  requestId: string,
): Response {
  return Response.json(
    {
      ...data,
      mode: source === "openai" ? "ai" : "demo",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-ClassPulse-Analysis-Source": source,
        "X-Request-Id": requestId,
      },
    },
  );
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
    headers: {
      "Cache-Control": "no-store",
      "X-Request-Id": requestId,
      ...(retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : {}),
    },
  });
}
