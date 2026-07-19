"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(JSON.stringify({
      event: "app.client_error",
      message: error.message,
      digest: error.digest,
    }));
  }, [error]);

  return (
    <main className="error-page">
      <section className="error-card">
        <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
        <span className="eyebrow">RALAT APLIKASI</span>
        <h1>ClassPulse tersangkut sebentar.</h1>
        <p>Reload halaman ini. Jika masih berlaku, salin kod ralat ini supaya kita boleh jejak dalam log production.</p>
        {error.digest && <code>{error.digest}</code>}
        <div className="card-actions">
          <button className="primary-button" onClick={reset}>Cuba semula</button>
          <button className="secondary-button" onClick={() => window.location.assign("/")}>Buka dashboard</button>
        </div>
      </section>
    </main>
  );
}
