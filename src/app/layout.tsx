import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClassPulse — Refleksi yang jadi tindakan",
  description:
    "Ruang kerja refleksi guru untuk menukar pemerhatian selepas kelas kepada langkah pengajaran yang jelas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms-MY">
      <body>{children}</body>
    </html>
  );
}
