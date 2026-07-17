"use client";

import { FormEvent, useState } from "react";

import { createSupabaseBrowserClient } from "@/shared/lib/supabase/client";

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() || "Guru" },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      setIsSubmitting(false);
      if (error) {
        setMessage(error.message);
        return;
      }
      if (!data.session) {
        setMessage("Akaun berjaya dicipta. Semak e-mel anda untuk pengesahan.");
        return;
      }
      window.location.assign("/");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (error) {
      setMessage("E-mel atau kata laluan tidak tepat.");
      return;
    }

    window.location.assign("/");
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {mode === "signup" && (
        <label>
          Nama paparan
          <input
            autoComplete="name"
            maxLength={100}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Contoh: Cikgu Aina"
            required
            value={displayName}
          />
        </label>
      )}
      <label>
        E-mel
        <input
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="guru@sekolah.edu.my"
          required
          type="email"
          value={email}
        />
      </label>
      <label>
        Kata laluan
        <input
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Sekurang-kurangnya 8 aksara"
          required
          type="password"
          value={password}
        />
      </label>
      {message && <p className="login-message" role="status">{message}</p>}
      <button className="login-submit" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Sila tunggu…" : mode === "login" ? "Daftar masuk" : "Cipta akaun guru"}
      </button>
      <button
        className="login-switch"
        onClick={() => {
          setMode((current) => current === "login" ? "signup" : "login");
          setMessage("");
        }}
        type="button"
      >
        {mode === "login" ? "Belum ada akaun? Cipta akaun" : "Sudah ada akaun? Daftar masuk"}
      </button>
    </form>
  );
}
