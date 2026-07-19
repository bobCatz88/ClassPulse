"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="ms-MY">
      <body>
        <main className="error-page">
          <section className="error-card">
            <span className="eyebrow">RALAT SISTEM</span>
            <h1>ClassPulse tak dapat dimuatkan.</h1>
            <p>Cuba semula. Kod ralat ini membantu kita cari punca dalam log production.</p>
            {(error.digest || error.message) && <code>{error.digest || error.message}</code>}
            <button className="primary-button" onClick={reset}>Cuba semula</button>
          </section>
        </main>
      </body>
    </html>
  );
}
