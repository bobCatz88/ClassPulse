import { redirect } from "next/navigation";

import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { createSupabaseServerClient } from "@/server/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <DashboardShell />;
}
