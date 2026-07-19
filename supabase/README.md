# Tetapan Supabase ClassPulse

## Migrasi awal

1. Buka projek ClassPulse dalam Supabase Dashboard.
2. Pilih **SQL Editor** dan cipta query baharu.
3. Salin keseluruhan kandungan `migrations/202607170001_initial_schema.sql`.
4. Jalankan query sekali sahaja.
5. Semak **Table Editor** untuk memastikan tujuh jadual awam telah dicipta.

## Migrasi Fasa 0

Selepas migrasi awal, jalankan `migrations/202607190001_phase0_foundations.sql` melalui SQL Editor. Ia:

- menyimpan pilihan bahasa guru (`ms-MY` atau `en`);
- menambah idempotency key pada refleksi;
- mencipta fungsi `save_reflection_bundle` untuk menyimpan refleksi, diagnosis dan Lesson Rescue secara atomik.

Jalankan migrasi pada staging dahulu, kemudian production. Jangan deploy route `/api/reflections` yang baharu sebelum migrasi ini berjaya.

Migrasi menyediakan profil guru automatik, hubungan data, validasi asas, indeks dan Row Level Security. Setiap polisi menggunakan identiti pengguna Supabase supaya guru hanya boleh mengakses rekod sendiri.

## Authentication

Dalam **Authentication → URL Configuration**:

- Development Site URL: `http://localhost:3000`
- Development Redirect URL: `http://localhost:3000/auth/callback`

Untuk deployment, tambah URL produksi dan `/auth/callback` produksi tanpa membuang URL pembangunan.

Jangan gunakan atau masukkan kunci `service_role` ke dalam aplikasi klien. Operasi MVP menggunakan sesi pengguna dan kunci `anon` bersama RLS.
