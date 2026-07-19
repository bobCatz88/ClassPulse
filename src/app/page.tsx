import { redirect } from "next/navigation";

import { DashboardApp } from "@/features/dashboard/components/dashboard-app";
import { normalizeReflectionRecord, type DashboardData, type ReflectionRecord } from "@/features/dashboard/types";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { createRequestId, errorLogMeta, logger } from "@/server/logging/logger";
import { LocaleProvider } from "@/shared/i18n/locale-provider";

export default async function Home() {
  const requestId = createRequestId();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileResult, classesResult, reflectionsResult, pulsesResult] = await Promise.all([
    supabase.from("profiles").select("id, display_name, school_name, primary_subject, preferred_locale, timezone, weekly_reflection_goal").eq("id", user.id).maybeSingle(),
    supabase.from("classes").select("id, class_name, year_level, subject, created_at, students(id, display_name, student_code, active)").order("created_at", { ascending: true }),
    supabase.from("reflections").select("id, class_id, transcript, subject, topic, class_summary, analysis, status, recorded_at, diagnostic_answers(id, question_id, question, answer), lesson_rescues(id, title, duration_minutes, objective, materials, steps, alternative_explanation, exit_questions, confirmed, intervention_outcomes(id, outcome, notes, remaining_student_count, intervention_date))").order("recorded_at", { ascending: false }).range(0, 25),
    supabase.from("class_pulses").select("id, class_id, understanding, engagement, energy_level, note, observed_at").order("observed_at", { ascending: false }).limit(7),
  ]);
  for (const [source, result] of [["profile", profileResult], ["classes", classesResult], ["reflections", reflectionsResult], ["pulses", pulsesResult]] as const) {
    if (result.error) logger.error("Dashboard query gagal", { event: "dashboard.query_failed", requestId, source, ...errorLogMeta(result.error) });
  }
  const profile = profileResult.data ?? { id: user.id, display_name: user.user_metadata.display_name || user.email?.split("@")[0] || "Guru", school_name: null, primary_subject: null, preferred_locale: "ms-MY", timezone: "Asia/Kuala_Lumpur", weekly_reflection_goal: 3 };
  const initialReflections = (reflectionsResult.data ?? []).map((item) => normalizeReflectionRecord(item as ReflectionRecord));
  const initialData = { profile, classes: classesResult.data ?? [], reflections: initialReflections.slice(0, 25), reflectionHasMore: initialReflections.length > 25, pulses: pulsesResult.data ?? [] } as unknown as DashboardData;
  return <LocaleProvider initialLocale={profile.preferred_locale === "en" ? "en" : "ms-MY"}><DashboardApp initialData={initialData} /></LocaleProvider>;
}
