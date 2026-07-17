import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";
import { createSupabaseServerClient } from "@/server/supabase/server";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/");

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <span>Class<span>Pulse</span></span>
        </div>
        <p className="eyebrow">RUANG KERJA GURU</p>
        <h1>Refleksi kecil.<br />Kelas seterusnya lebih jelas.</h1>
        <p className="login-intro">Daftar masuk untuk menyimpan refleksi, Lesson Rescue dan kemajuan kelas anda dengan selamat.</p>
        <LoginForm />
        <p className="login-privacy">Data setiap guru diasingkan menggunakan Row Level Security.</p>
      </section>
    </main>
  );
}
