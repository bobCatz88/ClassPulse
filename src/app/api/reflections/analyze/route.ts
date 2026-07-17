import {
  createDemoReflectionAnalysis,
  MAX_TRANSCRIPT_LENGTH,
  validateAnalyzeRequest,
} from "@/features/reflections/analysis";
import { analyzeReflectionWithOpenAI } from "@/features/reflections/openai-analysis";
import type { ApiErrorResponse } from "@/features/reflections/types";

const MAX_REQUEST_BYTES = MAX_TRANSCRIPT_LENGTH * 4;

export const runtime = "nodejs";

/**
 * POST /api/reflections/analyze
 *
 * Menganalisis transkrip refleksi guru. OPENAI_API_KEY adalah pilihan:
 * tanpa kunci, endpoint memulangkan analisis demo yang selamat dan deterministik.
 */
export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return errorResponse(
      "Permintaan terlalu besar.",
      413,
      { transcript: `Transkrip dihadkan kepada ${MAX_TRANSCRIPT_LENGTH} aksara.` },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("JSON permintaan tidak sah.", 400);
  }

  const validation = validateAnalyzeRequest(body);
  if (!validation.success) {
    return errorResponse("Maklumat permintaan tidak sah.", 400, validation.details);
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return analysisResponse(
      createDemoReflectionAnalysis(validation.data),
      "demo-no-key",
    );
  }

  try {
    const analysis = await analyzeReflectionWithOpenAI(validation.data, apiKey);
    return analysisResponse(analysis, "openai");
  } catch (error) {
    console.error(
      "[ClassPulse] Analisis OpenAI gagal; fallback demo digunakan.",
      error instanceof Error ? error.message : "Ralat tidak diketahui.",
    );

    return analysisResponse(
      createDemoReflectionAnalysis(validation.data),
      "demo-openai-error",
    );
  }
}

function analysisResponse(
  data: ReturnType<typeof createDemoReflectionAnalysis>,
  source: "openai" | "demo-no-key" | "demo-openai-error",
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
    },
  });
}

function errorResponse(
  error: string,
  status: number,
  details?: Record<string, string>,
): Response {
  const body: ApiErrorResponse = details ? { error, details } : { error };

  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
