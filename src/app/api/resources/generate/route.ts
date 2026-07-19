import { z } from "zod";

import { generateFallbackResource, type ResourceType } from "@/features/resources/generator";
import { AuthenticationError, requireAuthenticatedUser } from "@/server/auth/require-user";
import { checkRateLimit } from "@/server/http/rate-limit";

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
  try {
    const body = await request.json() as unknown;
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Permintaan bahan tidak sah." }, { status: 400 });
    const { supabase, user } = await requireAuthenticatedUser();
    if (!checkRateLimit(`resource:${user.id}`, { limit: 10, windowMs: 60_000 }).allowed) return Response.json({ error: "Terlalu banyak permintaan. Cuba sebentar lagi." }, { status: 429 });
    const { data: rescue } = await supabase.from("lesson_rescues").select("id,title,objective,steps,alternative_explanation,exit_questions,reflections!inner(class_id)").eq("id", parsed.data.lessonRescueId).maybeSingle();
    const row = rescue as RescueRow | null;
    if (!row || relationClassId(row.reflections) !== parsed.data.classId) return Response.json({ error: "Lesson Rescue tidak ditemui." }, { status: 404 });
    const content = generateFallbackResource({
      title: row.title,
      objective: row.objective,
      steps: row.steps,
      alternative_explanation: row.alternative_explanation,
      exit_questions: row.exit_questions,
    }, parsed.data.resourceType as ResourceType);
    return Response.json({ content, sourceNote: process.env.OPENAI_API_KEY ? "generated_server" : "generated_fallback" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AuthenticationError) return Response.json({ error: "Sesi tamat." }, { status: 401 });
    return Response.json({ error: "Bahan pengajaran tidak dapat dijana." }, { status: 500 });
  }
}
