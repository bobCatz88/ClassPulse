"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setIsSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <button className="sign-out-button" disabled={isSigningOut} onClick={signOut} type="button">
      {isSigningOut ? "…" : "Keluar"}
    </button>
  );
}
