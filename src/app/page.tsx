import { redirect } from "next/navigation";

import { DashboardApp } from "@/features/dashboard/components/dashboard-app";
import type { DashboardData } from "@/features/dashboard/types";
import { createSupabaseServerClient } from "@/server/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileResult, classesResult, reflectionsResult] = await Promise.all([
    supabase.from("profiles").select("id, display_name, school_name, primary_subject").eq("id", user.id).maybeSingle(),
    supabase.from("classes").select("id, class_name, year_level, subject, created_at, students(id, display_name, student_code, active)").order("created_at", { ascending: true }),
    supabase.from("reflections").select("id, class_id, transcript, subject, topic, class_summary, analysis, status, recorded_at, diagnostic_answers(id, question_id, question, answer), lesson_rescues(id, title, duration_minutes, objective, materials, steps, alternative_explanation, exit_questions, confirmed, intervention_outcomes(id, outcome, notes, remaining_student_count, intervention_date))").order("recorded_at", { ascending: false }),
  ]);
  const profile = profileResult.data ?? { id: user.id, display_name: user.user_metadata.display_name || user.email?.split("@")[0] || "Guru", school_name: null, primary_subject: null };
  const initialData = { profile, classes: classesResult.data ?? [], reflections: reflectionsResult.data ?? [] } as unknown as DashboardData;
  return <DashboardApp initialData={initialData} />;
}
