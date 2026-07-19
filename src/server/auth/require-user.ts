import { createSupabaseServerClient } from "@/server/supabase/server";

export class AuthenticationError extends Error {
  constructor() {
    super("Sesi pengguna tidak sah atau telah tamat.");
  }
}

/**
 * Dapatkan pengguna daripada kuki sesi yang telah disahkan oleh Supabase.
 * Jangan gunakan getSession() untuk kebenaran kerana nilai itu datang daripada
 * kuki dan tidak mengesahkan token dengan pelayan Auth.
 */
export async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthenticationError();
  }

  return { supabase, user };
}
