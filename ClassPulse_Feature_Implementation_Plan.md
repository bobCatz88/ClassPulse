# ClassPulse — Pelan Pelaksanaan Ciri Seterusnya

Tarikh: 18 Julai 2026  
Status: Pelan cadangan untuk pembangunan selepas MVP

## 1. Matlamat

Menjadikan ClassPulse lebih hidup, berguna setiap hari dan mudah digunakan semasa guru sibuk, tanpa mengubahnya menjadi sistem pentadbiran yang berat.

Hasil sasaran:

- guru boleh merekod keadaan kelas dalam bawah 10 saat;
- refleksi lengkap dalam bawah dua minit;
- susulan murid boleh dikemas kini dalam bawah 20 saat;
- Lesson Rescue boleh digunakan terus daripada telefon;
- setiap dapatan AI mempunyai bukti dan boleh ditolak oleh guru;
- tiada diagnosis atau label negatif terhadap murid;
- semua data kekal diasingkan melalui Supabase Row Level Security (RLS).
- keseluruhan aplikasi boleh digunakan dalam Bahasa Melayu atau English.

## 2. Kedudukan Semasa

Sudah tersedia:

- autentikasi Supabase;
- pengurusan kelas dan murid;
- refleksi melalui suara atau teks;
- analisis refleksi;
- soalan diagnosis;
- Lesson Rescue;
- sejarah refleksi;
- rekod hasil intervensi;
- carian, notifikasi dan tetapan profil;
- deployment production Netlify.

Jurang teknikal sebelum penambahan besar:

- komponen dashboard masih terlalu besar dan perlu dipecahkan;
- belum ada ujian unit/E2E sebenar;
- belum ada schema validation menggunakan Zod;
- belum ada CI GitHub Actions;
- deployment automatik GitHub ke Netlify belum lengkap;
- mod AI sebenar memerlukan `OPENAI_API_KEY`; tanpa kunci, sistem menggunakan analisis demo.

## 3. Prinsip Pelaksanaan

1. Siapkan satu fasa sehingga boleh diuji sebelum membuka fasa berikutnya.
2. Data terbitan seperti streak dan statistik dikira daripada rekod asal; jangan simpan nilai yang mudah tidak sepadan.
3. AI hanya mencadangkan. Guru mesti mengesahkan sebelum data menjadi rekod rasmi.
4. Nama murid tidak dimasukkan dalam eksport secara lalai.
5. Corak pengajaran hanya dipaparkan apabila mempunyai sekurang-kurangnya tiga bukti.
6. Utamakan paparan telefon dan tindakan satu tangan.
7. Setiap migrasi Supabase mesti mempunyai RLS, indeks dan pelan rollback.
8. Bahasa UI, templat, notifikasi dan output AI mesti mengikut pilihan guru; kandungan asal guru tidak diterjemah secara automatik.

## 4. Susunan Keutamaan

| Fasa | Ciri | Keutamaan | Dependency |
|---|---|---:|---|
| 0 | Asas teknikal, dwibahasa dan ujian | P0 | Tiada |
| 1 | Pulse Kelas, templat pantas, streak | P0 | Fasa 0 |
| 2 | Papan susulan murid | P0 | Fasa 1 |
| 3 | Mod Mengajar dan Exit Ticket | P1 | Fasa 2 |
| 4 | Kalendar intervensi dan peringatan | P1 | Fasa 3 |
| 5 | Trend kelas dan Class Memory | P1 | Data daripada Fasa 1–4 |
| 6 | Eksport PDF dan perkongsian | P2 | Fasa 3 |
| 7 | AI bahan pengajaran | P2 | OPENAI_API_KEY, Fasa 3 |
| 8 | PWA dan penyempurnaan dwibahasa | P2 | Semua aliran stabil |

## 5. Fasa 0 — Asas Teknikal

### Skop

- Pecahkan `dashboard-app.tsx` kepada halaman dan komponen mengikut ciri.
- Wujudkan lapisan query/mutation Supabase yang konsisten.
- Tambah Zod untuk validasi form dan respons API.
- Tambah Vitest untuk unit test dan Playwright untuk E2E.
- Tambah GitHub Actions: lint, typecheck, test dan build.
- Lengkapkan sambungan GitHub → Netlify untuk deploy automatik branch `main`.
- Jana TypeScript database types daripada Supabase.
- Sediakan lapisan i18n menggunakan kamus berjenis supaya teks UI tidak di-hardcode dalam komponen.
- Tambah `profiles.preferred_locale` dengan nilai `ms-MY` atau `en` dan fallback `ms-MY`.
- Tambah error boundary, empty state dan retry state yang seragam.
- Pindahkan simpanan reflection → diagnostic answers → Lesson Rescue ke RPC/transaksi atomik supaya kegagalan pertengahan tidak meninggalkan data separa.
- Wajibkan semakan sesi pada API analisis, rate limit, idempotency key dan correlation ID.
- Tambah pagination untuk sejarah refleksi serta query agregat untuk metrik dashboard.
- Gunakan structured logs tanpa transkrip atau nama murid.
- Kemas kini README daripada arahan Vercel lama kepada deployment Netlify sebenar.

### Struktur sasaran

```text
src/features/
  pulse/
  templates/
  streaks/
  follow-ups/
  teaching-mode/
  exit-tickets/
  schedules/
  analytics/
  exports/
  resources/
src/server/
  repositories/
  services/
src/i18n/
  dictionaries/
  locale-provider.tsx
src/shared/
  components/
  schemas/
  utils/
tests/
  unit/
  integration/
  e2e/
```

### Kriteria siap

- `npm run lint`, `typecheck`, `test` dan `build` lulus dalam CI.
- Tiada komponen halaman utama yang terlalu besar atau mengurus semua domain.
- Semua API baharu menggunakan schema input dan output.
- Preview Netlify tersedia untuk pull request.
- Pilihan bahasa kekal selepas logout, login semula dan pertukaran peranti.

## 6. Fasa 1 — Engagement Core

### 6.1 Pulse Kelas

Guru merekod keadaan kelas menggunakan tiga pilihan visual:

- Hijau — lancar;
- Kuning — bercampur;
- Merah — perlukan bantuan.

Pilihan tambahan: kefahaman, penglibatan, tahap tenaga dan nota ringkas.

### Database

Jadual `class_pulses`:

- `id`;
- `teacher_id`;
- `class_id`;
- `reflection_id` (nullable);
- `understanding`: strong/mixed/needs_support;
- `engagement`: high/mixed/low;
- `energy_level`: high/normal/low;
- `note`;
- `observed_at`;
- timestamps.

### UI

- Kad Pulse berwarna pada dashboard.
- Quick action selepas memilih kelas.
- Trend tujuh sesi terakhir.
- Pulse boleh ditukar sebelum refleksi disahkan.

### 6.2 Templat Refleksi Pantas

Templat sistem:

- Murid masih keliru;
- Aktiviti berjaya;
- Masa tidak mencukupi;
- Penglibatan rendah;
- Perlu susulan individu;
- Refleksi bebas.

Versi pertama disimpan sebagai konfigurasi aplikasi. Templat tersuai guru boleh ditambah kemudian melalui jadual `reflection_templates`.

### 6.3 Streak dan Sasaran Mingguan

- Kira streak daripada tarikh refleksi yang disahkan.
- Sasaran mingguan boleh dipilih: 3, 5 atau 7 refleksi.
- Paparkan progress ring dan pencapaian ringan.
- Elakkan hukuman atau mesej rasa bersalah apabila streak terputus.
- Tambah `timezone` dan `weekly_reflection_goal` pada profil guru.
- Gunakan zon waktu Asia/Kuala_Lumpur sebagai lalai.

Templat sistem boleh bermula sebagai konfigurasi aplikasi. Apabila templat tersuai diperkenalkan, jadual `reflection_templates` mesti membenarkan semua guru membaca templat sistem tetapi hanya pemilik mengubah templat peribadi.

### Kriteria siap Fasa 1

- Pulse boleh disimpan dalam bawah 10 saat.
- Templat mengisi ruang teks tetapi masih boleh diedit.
- Streak dikira dengan betul merentas zon waktu Asia/Kuala_Lumpur.
- Dashboard mempunyai warna dan pergerakan mikro tanpa mengganggu aksesibiliti.

## 7. Fasa 2 — Papan Susulan Murid

### Matlamat

Memberi guru satu tempat melihat murid yang memerlukan perhatian tanpa melabel mereka.

### Database

Jadual `student_follow_ups`:

- `id`;
- `teacher_id`;
- `student_id`;
- `class_id`;
- `reflection_id` (nullable);
- `observation`;
- `evidence`;
- `priority`: low/medium/high;
- `status`: needs_attention/monitoring/improving/resolved;
- `due_date`;
- `resolved_at`;
- timestamps.

### UI dan aliran

- Papan empat lajur seperti Kanban.
- Filter mengikut kelas, keutamaan dan tarikh.
- Guru boleh tambah murid daripada hasil analisis selepas pengesahan.
- Perubahan status boleh dibuat melalui butang; drag-and-drop hanya penambahbaikan.
- Kad menunjukkan pemerhatian dan bukti, bukan label murid.

### Kriteria siap

- Guru boleh mencipta susulan daripada refleksi dalam dua klik.
- RLS memastikan guru hanya melihat murid kelas sendiri.
- Item selesai kekal dalam sejarah.
- Nama murid tidak muncul dalam log teknikal atau eksport umum.

## 8. Fasa 3 — Mod Mengajar dan Exit Ticket

### 8.1 Mod Mengajar Lesson Rescue

Paparan telefon skrin penuh:

- satu langkah pada satu masa;
- timer 5, 10 atau 15 minit;
- checklist bahan;
- butang Seterusnya/Kembali;
- jeda timer;
- tandakan pelan selesai;
- terus buka borang rekod hasil.

Jadual `lesson_rescue_runs` menyimpan masa mula, langkah selesai, masa tamat dan status.

### 8.2 Generator Exit Ticket

Format:

- 3 soalan objektif;
- 3 soalan respons pendek;
- campuran;
- satu soalan keyakinan murid.

API baharu: `POST /api/exit-tickets/generate`.

Jadual `exit_tickets` menyimpan soalan, jawapan cadangan, tahap dan pengesahan guru.

### Kriteria siap

- Mod Mengajar boleh digunakan pada skrin 360px tanpa scroll mendatar.
- Timer terus stabil apabila skrin bertukar tab.
- Exit Ticket boleh diedit, disalin dan dicetak.
- AI tidak menghasilkan kandungan di luar topik atau umur kelas yang dipilih.

## 9. Fasa 4 — Kalendar Intervensi

### Database

Jadual `intervention_schedules`:

- `id`;
- `teacher_id`;
- `class_id`;
- `lesson_rescue_id`;
- `scheduled_for`;
- `status`: scheduled/completed/skipped;
- `reminder_at`;
- `note`;
- timestamps.

### UI

- Paparan agenda minggu ini dahulu; kalendar bulanan kemudian.
- Kad “Hari ini” dan “Akan datang”.
- Notifikasi dalam aplikasi.
- Pautan terus ke Mod Mengajar.

### Kriteria siap

- Jadual boleh dicipta daripada Lesson Rescue.
- Tindakan tertunggak muncul di dashboard.
- Tiada e-mel atau mesej dihantar tanpa arahan jelas guru.

## 10. Fasa 5 — Trend Kelas dan Class Memory

### Analitik

- konsep berulang;
- trend Pulse Kelas;
- strategi yang paling kerap berjaya;
- intervensi yang belum selesai;
- murid yang mempunyai beberapa susulan aktif;
- perbandingan sebelum dan selepas Lesson Rescue.

### Database

Jadual `teaching_insights`:

- `id`;
- `teacher_id`;
- `class_id`;
- `insight_type`;
- `title`;
- `description`;
- `evidence_refs` JSONB;
- `confidence`;
- `status`: proposed/accepted/dismissed;
- timestamps.

Gunakan view/RPC untuk statistik asas. AI hanya digunakan untuk merumus pola yang mempunyai sekurang-kurangnya tiga rekod bukti.

### UI

- Graf garis Pulse;
- graf bar konsep berulang;
- kad strategi berkesan;
- butang “Terima” atau “Tolak dapatan”.

### Kriteria siap

- Setiap insight memaparkan bukti dan bilangan kejadian.
- Insight dengan data tidak mencukupi tidak dipaparkan.
- Guru boleh menolak insight dan ia tidak muncul semula tanpa bukti baharu.

## 11. Fasa 6 — Eksport dan Perkongsian

Urutan pelaksanaan:

1. Paparan mesra cetak menggunakan CSS.
2. Salin Lesson Rescue sebagai teks.
3. Eksport PDF.
4. Ringkasan mingguan.
5. Pautan perkongsian terkawal, jika benar-benar diperlukan.

Peraturan privasi:

- nama murid disembunyikan secara lalai;
- guru memilih data yang hendak dimasukkan;
- tiada pautan awam kekal;
- PDF memaparkan tarikh, kelas, objektif dan disclaimer AI.

### Kriteria siap

- PDF boleh dibuka pada telefon dan desktop.
- Tiada data sensitif bocor melalui URL.
- Eksport berjaya walaupun tiada sambungan OpenAI.

## 12. Fasa 7 — AI Bahan Pengajaran

Jenis bahan:

- analogi alternatif;
- aktiviti kumpulan;
- lembaran kerja;
- soalan pembezaan aras;
- skrip penerangan guru;
- rangka slaid ringkas.

### Database dan API

Jadual `teaching_resources` menyimpan jenis bahan, kandungan JSONB, sumber rujukan, status pengesahan dan pautan kepada Lesson Rescue.

API: `POST /api/resources/generate`.

### Guardrail

- `OPENAI_API_KEY` hanya pada server;
- kadar permintaan dihadkan;
- kandungan transkrip dianggap data, bukan arahan;
- rujukan guru dibezakan daripada cadangan AI;
- guru mesti mengesahkan sebelum simpan atau eksport.

### Kriteria siap

- bahan sesuai dengan subjek, topik dan tahap kelas;
- output boleh diedit;
- kegagalan AI mempunyai retry dan fallback;
- kos/token direkod tanpa menyimpan kandungan sensitif dalam log.

## 13. Fasa 8 — Dwibahasa, PWA dan Kemasan

- penukar bahasa `Bahasa Melayu / English` pada login, dashboard dan tetapan;
- semua navigasi, borang, mesej ralat, empty state, notifikasi dan templat sistem diterjemah;
- output AI menerima `preferred_locale` secara eksplisit dan kekal boleh diedit oleh guru;
- refleksi serta catatan asal guru tidak diterjemah tanpa arahan;
- format tarikh, masa dan nombor mengikut locale pilihan;
- manifest dan ikon pemasangan;
- offline shell untuk halaman utama;
- simpan draf refleksi secara lokal;
- sync semula apabila talian pulih;
- animasi mikro dengan sokongan `prefers-reduced-motion`;
- skeleton loading;
- dark mode hanya selepas kontras disahkan;
- audit aksesibiliti papan kekunci dan pembaca skrin.

## 14. Strategi Ujian

### Unit

- pengiraan streak;
- validasi Pulse;
- transformasi templat;
- status papan susulan;
- timer Mod Mengajar;
- sanitasi eksport;
- syarat minimum tiga bukti untuk insight.
- kelengkapan kunci kamus Bahasa Melayu dan English;
- fallback locale apabila kunci terjemahan tiada.

### Integrasi

- Pulse → refleksi;
- refleksi → follow-up;
- Lesson Rescue → schedule → teaching run → outcome;
- outcome → analytics;
- RLS setiap jadual baharu;
- API AI dengan respons berjaya, timeout dan schema tidak sah.
- API AI menghasilkan bahasa yang diminta tanpa menukar kandungan asal guru.

### E2E

1. Login.
2. Pilih kelas.
3. Rekod Pulse.
4. Pilih templat dan taip refleksi.
5. Sahkan analisis.
6. Tambah murid ke papan susulan.
7. Jadualkan Lesson Rescue.
8. Jalankan Mod Mengajar.
9. Jana Exit Ticket.
10. Rekod hasil.
11. Semak trend.
12. Eksport PDF.
13. Tukar ke English dan ulang aliran utama tanpa teks bercampur.

### Peranti

- Chrome/Edge desktop;
- Chrome Android;
- Safari iPhone jika tersedia;
- viewport 360px, 768px dan 1440px.

## 15. Keselamatan dan Privasi

Setiap jadual baharu wajib mempunyai:

- `teacher_id`;
- foreign key yang betul;
- RLS select/insert/update/delete;
- indeks pada `teacher_id`, `class_id` dan tarikh;
- limit panjang teks;
- cascade delete yang disengajakan;
- audit terhadap data murid dalam log dan eksport.

Dilarang:

- diagnosis psikologi atau perubatan;
- label “malas”, “lemah” atau “bermasalah”;
- penghantaran automatik kepada ibu bapa;
- menyimpan audio tanpa persetujuan;
- penggunaan service role pada frontend.

## 16. Jadual Cadangan

| Sprint | Hasil utama |
|---|---|
| Sprint 0 | Refactor, validation, CI dan test harness |
| Sprint 1 | Pulse Kelas, templat dan streak |
| Sprint 2 | Papan susulan murid |
| Sprint 3 | Mod Mengajar dan Exit Ticket |
| Sprint 4 | Agenda intervensi dan notifikasi |
| Sprint 5 | Trend kelas dan Class Memory |
| Sprint 6 | Cetak, PDF dan ringkasan mingguan |
| Sprint 7 | AI bahan pengajaran |
| Sprint 8 | Dwibahasa lengkap, PWA, aksesibiliti dan polish |

Setiap sprint berakhir dengan: migration diuji, CI hijau, preview Netlify, ujian telefon dan deployment production selepas semakan.

## 17. Definition of Done

Sesuatu ciri dianggap siap apabila:

- aliran utama dan aliran ralat berfungsi;
- loading, empty, success dan error states tersedia;
- TypeScript, lint, unit test, E2E penting dan build lulus;
- RLS diuji menggunakan dua akaun berbeza;
- paparan telefon stabil;
- dokumentasi dan migration dikemas kini;
- tiada rahsia dalam Git;
- deployed ke preview sebelum production;
- guru boleh membetulkan atau menolak cadangan AI.
- semua teks sistem tersedia dalam Bahasa Melayu dan English;
- tiada teks UI penting di-hardcode di luar kamus terjemahan.

## 18. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| Data murid/PDPA | Minimumkan data, RLS tenant isolation, samaran nama dalam eksport dan tiada PII dalam log |
| Data separa semasa simpan | RPC/transaksi atomik dan idempotency key |
| Hallucination AI | Structured schema, bukti, human confirmation dan fallback |
| Kos AI meningkat | Rate limit, quota, cache selamat dan rekod penggunaan tanpa kandungan sensitif |
| Timer/rakaman terganggu | Kira masa daripada timestamp, bukan interval sahaja |
| Dashboard semakin perlahan | Pagination, indeks dan aggregate RPC/view |
| Schema JSON lama tidak serasi | Tambah versi schema dan migrasi parser |
| Netlify function timeout | Timeout eksplisit, retry terkawal dan fallback |
| Terjemahan tidak lengkap atau teks bercampur | Kamus berjenis, pemeriksaan kunci dalam CI dan ujian E2E untuk kedua-dua bahasa |

## 19. Urutan Kerja Pertama
1. Cipta branch `codex/engagement-core`.
2. Pecahkan dashboard mengikut halaman/ciri.
3. Tambah Zod, Vitest, Playwright dan GitHub Actions.
4. Bina locale provider, kamus `ms-MY`/`en` dan migration `preferred_locale`.
5. Tambah migration `class_pulses`.
6. Bina kad Pulse dan quick action.
7. Tambah templat refleksi pantas dalam kedua-dua bahasa.
8. Bina fungsi streak dan sasaran mingguan.
9. Uji RLS, mobile, dwibahasa dan E2E.
10. Deploy preview Netlify.
11. Selepas stabil, mulakan papan susulan murid.

## 20. Perkara Yang Tidak Dibina Dahulu

- aplikasi React Native;
- portal ibu bapa;
- ranking guru atau murid;
- automasi WhatsApp;
- analitik ramalan;
- diagnosis pembelajaran;
- marketplace bahan;
- integrasi sistem sekolah yang belum mempunyai API jelas.

Fokus awal ialah menjadikan aliran harian guru cepat, visual dan boleh dipercayai.

