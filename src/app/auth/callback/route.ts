import { NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/server/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const destination = new URL("/", request.url);

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(destination);
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", "Pautan pengesahan tidak sah atau telah tamat tempoh.");
  return NextResponse.redirect(loginUrl);
}
