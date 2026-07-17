# ClassPulse AI

> **Tagline:** Cakap selepas kelas. AI bantu baiki kelas seterusnya.

ClassPulse AI ialah aplikasi refleksi pengajaran berasaskan suara. Guru merakam refleksi selama 30–60 saat selepas kelas. Sistem menukarkan rakaman tersebut kepada rekod berstruktur, mengenal pasti isu pembelajaran, bertanya soalan diagnosis ringkas dan menghasilkan pelan **Lesson Rescue** untuk kelas seterusnya.

---

## 1. Objektif Produk

ClassPulse AI dibina untuk menyelesaikan tiga masalah utama:

1. Guru tidak sempat menulis refleksi lengkap selepas setiap kelas.
2. Maklumat tentang murid yang belum menguasai sesuatu konsep mudah hilang atau tidak disusun.
3. Guru mengetahui murid tidak faham, tetapi memerlukan cadangan penerangan atau aktiviti alternatif.

### Hasil yang dikehendaki

Selepas satu rakaman suara, guru menerima:

- transkripsi refleksi;
- ringkasan kelas;
- senarai isu pembelajaran;
- pemerhatian murid;
- soalan diagnosis maksimum tiga soalan;
- pelan pemulihan 5–15 minit;
- analogi atau penerangan alternatif;
- soalan semakan penguasaan;
- peringatan susulan;
- rekod keberkesanan intervensi.

---

## 2. Definisi MVP

MVP dianggap berjaya apabila seorang guru boleh:

1. memilih kelas;
2. merakam atau menaip refleksi;
3. menyemak transkripsi;
4. menerima analisis AI berstruktur;
5. membetulkan atau mengesahkan analisis;
6. menjawab maksimum tiga soalan diagnosis;
7. menerima satu pelan Lesson Rescue;
8. merekod hasil intervensi pada kelas berikutnya.

### Aliran utama MVP

```text
Pilih kelas
   ↓
Rakam refleksi 30–60 saat
   ↓
Transkripsi audio
   ↓
Ekstrak fakta dan pemerhatian
   ↓
Semakan guru
   ↓
Soalan diagnosis ringkas
   ↓
Jana Lesson Rescue
   ↓
Laksana dalam kelas seterusnya
   ↓
Rekod hasil intervensi
```

---

# 3. Fasa Utama Pembangunan

## Fasa 0 — Tetapan Projek

### Matlamat

Menyediakan projek yang stabil sebelum membina fungsi AI.

### Tugasan

- Cipta repository GitHub.
- Cipta projek Next.js dengan TypeScript.
- Pasang Tailwind CSS dan komponen UI.
- Cipta projek Supabase untuk pembangunan.
- Tetapkan struktur folder.
- Tambah fail `.env.example`.
- Sediakan ESLint, Prettier dan TypeScript strict mode.
- Sediakan branch `main` dan `develop`.

### Teknologi dicadangkan

| Komponen | Teknologi |
|---|---|
| Frontend | Next.js + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Rakaman audio | Browser MediaRecorder API |
| Transkripsi | OpenAI Audio API |
| Analisis AI | OpenAI Responses API |
| Validation | Zod |
| Hosting | Vercel |
| Version control | GitHub |

### Kriteria siap

- Aplikasi boleh dijalankan secara lokal.
- Sambungan Supabase berjaya.
- Halaman asas boleh dibuka tanpa ralat.
- `.env.local` tidak dimasukkan ke GitHub.

---

## Fasa 1 — Class Setup dan Data Demo

### Matlamat

Membolehkan guru memilih kelas dan murid sebelum merekod refleksi.

### Fungsi

- Cipta kelas.
- Masukkan nama kelas, subjek dan tahun.
- Tambah senarai murid.
- Sediakan satu kelas demo secara automatik.
- Pilih kelas aktif daripada dashboard.

### Data demo dicadangkan

```text
Kelas: 3 Cemerlang
Subjek: Matematik
Topik demo: Pecahan
Bilangan murid: 30
Murid contoh: Ahmad, Ali, Sarah, Aina, Kumar
```

### Jadual database

#### `classes`

```text
id
teacher_id
class_name
year_level
subject
created_at
```

#### `students`

```text
id
class_id
display_name
student_code
active
created_at
```

### Kriteria siap

- Guru boleh melihat kelas pada dashboard.
- Guru boleh memilih kelas sebelum membuat refleksi.
- Data demo boleh dimuatkan dengan satu klik.

---

## Fasa 2 — Rakaman Suara dan Transkripsi

### Matlamat

Membolehkan guru bercakap selama 30–60 saat dan menerima teks transkripsi.

### Fungsi

- Butang mula rakam.
- Butang berhenti rakam.
- Timer rakaman.
- Preview atau main semula audio.
- Hantar audio untuk transkripsi.
- Paparkan transkripsi dalam ruang teks.
- Benarkan guru membetulkan transkripsi.
- Sediakan input teks sebagai alternatif.

### Arahan pada skrin rakaman

Guru digalakkan menyebut:

1. Apa yang diajar?
2. Apa yang murid sudah faham?
3. Apa yang murid masih keliru?
4. Murid mana yang memerlukan perhatian?
5. Apa yang berlaku semasa kelas?

### Contoh refleksi

> Hari ini saya ajar pecahan. Lebih kurang lapan murid masih keliru antara pengangka dan penyebut. Ahmad dan Ali tidak fokus semasa penerangan. Sarah boleh jawab soalan mudah tetapi masih keliru apabila soalan menggunakan gambar.

### Kriteria siap

- Rakaman boleh dibuat melalui telefon dan komputer.
- Transkripsi dipaparkan dengan betul.
- Guru boleh mengedit teks sebelum analisis.
- Sistem mempunyai mesej ralat jika mikrofon tidak dibenarkan.

---

## Fasa 3 — Reflection Extractor

### Matlamat

Menukarkan transkripsi kepada data berstruktur tanpa terus membuat kesimpulan berlebihan.

### Output yang diperlukan

```json
{
  "subject": "Matematik",
  "topic": "Pecahan",
  "class_summary": "Murid mempelajari pengangka dan penyebut.",
  "learning_signals": [
    {
      "type": "misconception",
      "concept": "Pengangka dan penyebut",
      "estimated_student_count": 8,
      "evidence": "Guru menyebut lapan murid masih keliru.",
      "confidence": 0.91
    }
  ],
  "student_observations": [
    {
      "student_name": "Ahmad",
      "observation_type": "behaviour",
      "observation": "Tidak fokus semasa penerangan",
      "confidence": 0.84
    }
  ],
  "uncertainties": []
}
```

### Peraturan AI

- Ekstrak hanya perkara yang disebut atau disokong oleh transkripsi.
- Jangan membuat diagnosis perubatan atau psikologi.
- Jangan melabel murid sebagai malas, lemah atau bermasalah.
- Bezakan pemerhatian tingkah laku dengan isu pembelajaran.
- Sertakan bukti dan tahap keyakinan.
- Tandakan maklumat yang tidak pasti.

### Semakan guru

Guru mesti boleh:

- membetulkan nama murid;
- mengubah jumlah murid;
- membuang pemerhatian yang salah;
- mengubah kategori pemerhatian;
- mengesahkan analisis sebelum disimpan.

### Kriteria siap

- Output AI sentiasa mengikut struktur JSON yang ditetapkan.
- Nama murid dipadankan dengan senarai kelas.
- Analisis tidak disimpan sebagai rekod rasmi sebelum guru mengesahkan.

---

## Fasa 4 — Diagnostic Coach

### Matlamat

Mengenal pasti maklumat yang belum cukup sebelum sistem mencadangkan intervensi.

### Peraturan

- Maksimum tiga soalan.
- Utamakan soalan pilihan jawapan.
- Jangan tanya semula fakta yang telah diberikan.
- Setiap soalan mesti mempengaruhi bentuk intervensi.
- Guru boleh memilih `Tidak pasti`.

### Contoh

```json
{
  "questions": [
    {
      "id": "q1",
      "question": "Adakah murid boleh mengenal pecahan melalui gambar?",
      "options": [
        "Ya",
        "Sebahagian",
        "Belum",
        "Tidak pasti"
      ],
      "reason": "Untuk membezakan masalah istilah dengan masalah konsep."
    }
  ]
}
```

### Kriteria siap

- Soalan berkaitan terus dengan masalah pembelajaran.
- Sistem tidak menghasilkan lebih daripada tiga soalan.
- Jawapan guru disimpan bersama refleksi.

---

## Fasa 5 — Lesson Rescue Generator

### Matlamat

Menghasilkan intervensi yang praktikal untuk digunakan pada kelas seterusnya.

### Struktur output

```json
{
  "title": "Rescue Pengangka dan Penyebut",
  "duration_minutes": 10,
  "target_students": "8 murid belum menguasai",
  "objective": "Murid membezakan fungsi pengangka dan penyebut.",
  "materials": [
    "Kertas berbentuk bulatan",
    "Marker"
  ],
  "steps": [
    {
      "minute": "0–2",
      "instruction": "Tunjukkan satu bulatan yang dibahagikan kepada empat bahagian sama besar."
    },
    {
      "minute": "3–5",
      "instruction": "Warnakan satu bahagian dan bincangkan maksud 1/4."
    }
  ],
  "alternative_explanation": "Penyebut menunjukkan jumlah semua bahagian. Pengangka menunjukkan bahagian yang dipilih.",
  "analogy": "Bayangkan satu bekas mempunyai empat nugget dan kamu makan satu.",
  "exit_questions": [
    "Dalam 2/5, nombor mana menunjukkan jumlah bahagian?",
    "Tulis pecahan bagi tiga daripada lapan bahagian.",
    "Terangkan fungsi pengangka."
  ]
}
```

### Prinsip Lesson Rescue

- Tempoh pendek: 5, 10 atau 15 minit.
- Bahan mudah diperoleh.
- Tidak menghasilkan RPH penuh.
- Memberi satu penerangan alternatif.
- Memberi satu aktiviti aktif.
- Memberi dua hingga empat soalan semakan.
- Sesuai dengan umur dan tahap kelas.

### Kriteria siap

- Guru boleh terus menggunakan pelan daripada telefon.
- Semua langkah mempunyai tempoh atau urutan jelas.
- Guru boleh mengedit dan menyimpan pelan.
- Pelan boleh disalin sebagai teks.

---

## Fasa 6 — Follow-up dan Progress Loop

### Matlamat

Merekod sama ada intervensi berkesan dan mengelakkan cadangan berulang yang tidak membantu.

### Pilihan hasil

- Berjaya
- Sebahagian berjaya
- Tidak berjaya
- Belum dilaksanakan

### Maklumat tambahan

- Nota ringkas guru.
- Bilangan murid yang masih belum menguasai.
- Strategi yang digunakan.
- Tarikh intervensi.

### Logik susulan

```text
Berjaya
→ Tandakan konsep semakin dikuasai.

Sebahagian berjaya
→ Kekalkan bahagian berkesan dan ubah bahagian lain.

Tidak berjaya
→ Jangan ulang strategi sama tanpa perubahan.

Belum dilaksanakan
→ Paparkan peringatan pada dashboard.
```

### Kriteria siap

- Guru boleh merekod hasil dalam kurang 20 saat.
- Sistem menunjukkan sejarah intervensi.
- Lesson Rescue seterusnya menerima konteks hasil terdahulu.

---

# 4. Fasa Susulan Selepas MVP

## Fasa Susulan A — Class Memory

Sistem mengesan pola merentas beberapa refleksi.

### Contoh pola

- Konsep sama bermasalah dalam tiga sesi.
- Aktiviti tertentu hanya sebahagian berjaya.
- Murid tertentu lebih aktif semasa aktiviti manipulatif.
- Isu fokus berlaku terutamanya semasa penerangan panjang.

### Syarat penting

- Pola mesti disokong oleh beberapa rekod.
- Paparkan bukti dan bilangan kejadian.
- Guru mesti boleh menolak pola yang tidak tepat.

---

## Fasa Susulan B — Dashboard Analitik

Tambahkan:

- konsep berulang;
- intervensi akan datang;
- murid perlu susulan;
- trend penguasaan kelas;
- strategi paling berkesan;
- refleksi yang belum dilengkapkan.

Jangan bina analitik yang terlalu kompleks sebelum data sebenar mencukupi.

---

## Fasa Susulan C — Rujukan Bahan Pengajaran

Lesson Rescue boleh menggunakan:

- standard pembelajaran;
- objektif guru;
- bahan yang guru upload;
- kandungan buku teks yang dibenarkan;
- bank aktiviti sekolah.

Pastikan sistem membezakan bahan rujukan dengan cadangan AI.

---

## Fasa Susulan D — Eksport dan Perkongsian

Pilihan masa hadapan:

- eksport PDF;
- salin ke dokumen;
- eksport ringkasan mingguan;
- kongsi pelan dengan guru mata pelajaran;
- laporan peribadi guru.

Jangan automatik menghantar maklumat murid kepada ibu bapa atau pihak lain.

---

## Fasa Susulan E — Aplikasi Mudah Alih

Selepas web app stabil:

1. Jadikan web app sebagai Progressive Web App.
2. Uji pemasangan pada Android.
3. Tambah rakaman offline sementara.
4. Pertimbangkan React Native atau Expo hanya jika PWA tidak mencukupi.

Untuk hackathon, web app mobile-first sudah memadai.

---

# 5. Struktur Repository

```text
classpulse-ai/
├── app/
│   ├── api/
│   │   ├── transcribe/
│   │   ├── analyze-reflection/
│   │   ├── diagnostic-questions/
│   │   └── generate-rescue/
│   ├── dashboard/
│   ├── classes/
│   ├── reflection/
│   ├── rescue/
│   └── follow-up/
├── components/
│   ├── audio-recorder/
│   ├── reflection-review/
│   ├── diagnostic-form/
│   ├── rescue-plan/
│   └── ui/
├── lib/
│   ├── openai/
│   ├── supabase/
│   ├── schemas/
│   ├── prompts/
│   └── utils/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── policies.sql
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/
├── docs/
│   ├── architecture.md
│   ├── ai-workflow.md
│   ├── privacy.md
│   ├── testing.md
│   └── demo-script.md
├── .env.example
├── README.md
├── CONTRIBUTING.md
├── LICENSE
└── package.json
```

---

# 6. Environment Variables

Contoh `.env.example`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=
```

### Peraturan

- Jangan commit `.env.local`.
- Jangan letakkan API key pada frontend.
- Semua panggilan OpenAI mesti melalui server route.
- Gunakan environment berbeza untuk development dan production.
- Tukar key jika pernah terdedah.

---

# 7. Strategi Pengujian

## Tahap 1 — Ujian Lokal

Jalankan aplikasi pada komputer sendiri.

```bash
npm install
npm run dev
```

Buka:

```text
http://localhost:3000
```

### Perkara diuji

- Login.
- Cipta kelas.
- Pilih kelas.
- Benarkan akses mikrofon.
- Rakam suara.
- Transkripsi.
- Edit transkripsi.
- Analisis refleksi.
- Soalan diagnosis.
- Lesson Rescue.
- Follow-up.

---

## Tahap 2 — Ujian Unit

Uji fungsi kecil seperti:

- validation schema;
- pemadanan nama murid;
- format output AI;
- pengiraan confidence;
- fungsi sanitasi input;
- permission check.

### Contoh kriteria

- Output tanpa `topic` mesti ditolak.
- Nama murid yang tidak wujud mesti ditandakan sebagai tidak pasti.
- `duration_minutes` hanya menerima 5, 10 atau 15.

---

## Tahap 3 — Ujian Integrasi

Uji hubungan antara:

- audio dan transkripsi;
- transkripsi dan analisis;
- analisis dan database;
- diagnosis dan Lesson Rescue;
- follow-up dan class memory.

Gunakan rakaman pendek dan data rekaan.

---

## Tahap 4 — Ujian End-to-End

Gunakan Playwright atau alat E2E lain.

### Senario utama

```text
Guru login
→ pilih kelas
→ rakam refleksi
→ semak transkripsi
→ sahkan analisis
→ jawab diagnosis
→ jana Lesson Rescue
→ simpan pelan
→ rekod hasil
```

### Senario ralat

- Mikrofon tidak dibenarkan.
- Audio kosong.
- Transkripsi gagal.
- API timeout.
- Output AI tidak lengkap.
- Sambungan database terputus.
- Guru keluar sebelum menyimpan.

---

## Tahap 5 — Ujian Peranti

Uji sekurang-kurangnya pada:

- Chrome desktop;
- Microsoft Edge desktop;
- Chrome Android;
- Safari iPhone jika ada akses;
- skrin telefon bersaiz kecil.

### Fokus utama

- butang rakam mudah ditekan;
- teks tidak terlalu kecil;
- pelan boleh dibaca ketika mengajar;
- tiada horizontal scroll;
- mikrofon berfungsi melalui HTTPS.

---

## Tahap 6 — Ujian Guru Sebenar

Gunakan data rekaan atau nama samaran.

### Cadangan kumpulan ujian

- 3–5 orang guru;
- subjek berbeza;
- kelas berbeza;
- satu sesi penggunaan setiap guru.

### Soalan maklum balas

1. Adakah rakaman lebih cepat daripada menulis refleksi?
2. Adakah analisis menggambarkan apa yang berlaku?
3. Adakah soalan diagnosis membantu atau mengganggu?
4. Adakah Lesson Rescue boleh terus digunakan?
5. Bahagian mana mengambil masa terlalu lama?
6. Adakah bahasa sistem sesuai dengan gaya guru Malaysia?

### Metrik MVP

- Refleksi siap dalam bawah dua minit.
- Sekurang-kurangnya 80% fakta utama diekstrak dengan betul.
- Guru menganggap pelan intervensi boleh digunakan dengan sedikit atau tanpa suntingan.
- Kurang daripada tiga pembetulan besar bagi satu refleksi.

---

# 8. Tempat Menguji Web App

## Development

Gunakan:

- komputer sendiri;
- `localhost`;
- projek Supabase development;
- data murid rekaan.

## Preview atau Staging

Gunakan **Vercel Preview Deployment**.

Setiap pull request boleh menghasilkan URL preview tersendiri. URL ini sesuai untuk:

- ujian rakan pasukan;
- ujian guru;
- semakan UI;
- semakan sebelum merge ke `main`.

Gunakan projek Supabase staging yang berasingan jika mampu.

## Production Demo

Deploy branch `main` ke Vercel.

Contoh:

```text
https://classpulse-ai.vercel.app
```

Pastikan:

- HTTPS aktif;
- environment variables production telah ditetapkan;
- database production tidak menggunakan data murid sebenar;
- aplikasi mempunyai data demo;
- halaman demo boleh digunakan tanpa konfigurasi rumit.

---

# 9. Aliran GitHub

## Cipta repository

Nama dicadangkan:

```text
classpulse-ai
```

## Inisialisasi projek

```bash
git init
git add .
git commit -m "chore: initialize ClassPulse AI project"
git branch -M main
git remote add origin https://github.com/USERNAME/classpulse-ai.git
git push -u origin main
```

## Branch dicadangkan

```text
main        → versi stabil dan production
develop     → integrasi semasa pembangunan
feature/*   → fungsi baharu
fix/*       → pembaikan bug
docs/*      → dokumentasi
```

### Contoh

```bash
git checkout -b feature/audio-recorder
```

Selepas siap:

```bash
git add .
git commit -m "feat: add browser audio recorder"
git push -u origin feature/audio-recorder
```

Kemudian buka pull request ke `develop` atau `main`.

---

# 10. Standard Commit

Gunakan format ringkas dan konsisten:

```text
feat: tambah fungsi baharu
fix: baiki ralat
docs: kemas kini dokumentasi
test: tambah atau ubah ujian
refactor: ubah struktur tanpa ubah fungsi
chore: konfigurasi dan kerja sokongan
```

### Contoh

```text
feat: generate diagnostic questions from reflection
fix: handle microphone permission errors
docs: add AI workflow documentation
test: add rescue plan schema validation
```

---

# 11. Dokumentasi GitHub

## README.md mesti mempunyai

1. Nama dan tagline projek.
2. Masalah yang diselesaikan.
3. Cara ClassPulse berfungsi.
4. Gambar atau GIF demo.
5. Senarai fungsi MVP.
6. Seni bina ringkas.
7. Teknologi digunakan.
8. Cara install.
9. Environment variables.
10. Cara jalankan lokal.
11. Cara ujian.
12. Cara deploy.
13. Privasi dan keselamatan.
14. Limitasi semasa.
15. Roadmap.
16. Pautan demo.
17. Pautan video hackathon.

## Dokumen tambahan

### `docs/architecture.md`

- rajah seni bina;
- aliran frontend, backend, AI dan database;
- struktur jadual;
- keputusan teknikal.

### `docs/ai-workflow.md`

- Reflection Extractor;
- Diagnostic Coach;
- Lesson Rescue Generator;
- format structured output;
- guardrail AI;
- human-in-the-loop.

### `docs/privacy.md`

- jenis data disimpan;
- data yang tidak boleh disimpan;
- polisi audio;
- penggunaan nama samaran;
- hak guru untuk edit dan padam;
- larangan diagnosis perubatan.

### `docs/testing.md`

- senario ujian;
- keputusan ujian;
- isu diketahui;
- peranti diuji.

### `docs/demo-script.md`

- skrip video tiga minit;
- teks refleksi demo;
- hasil analisis yang dijangka;
- urutan klik.

---

# 12. Deployment ke Vercel

## Cara paling mudah

1. Push projek ke GitHub.
2. Login ke Vercel.
3. Pilih `Add New Project`.
4. Import repository `classpulse-ai`.
5. Masukkan environment variables.
6. Tekan deploy.
7. Uji URL production.

## Selepas deploy

Uji semula:

- login;
- mikrofon;
- transkripsi;
- analisis;
- simpan database;
- Lesson Rescue;
- follow-up;
- paparan telefon.

### Nota penting

Akses mikrofon browser biasanya memerlukan HTTPS. Oleh itu, fungsi rakaman mesti diuji pada URL Vercel, bukan hanya melalui alamat IP tempatan.

---

# 13. GitHub Actions

Tambahkan CI asas untuk setiap push atau pull request.

### Pemeriksaan minimum

```text
npm run lint
npm run typecheck
npm run test
npm run build
```

### Kriteria merge

Pull request tidak boleh merge jika:

- lint gagal;
- TypeScript gagal;
- ujian utama gagal;
- build gagal;
- secret dikesan dalam repository.

---

# 14. Privasi dan Keselamatan

ClassPulse melibatkan maklumat murid. Gunakan prinsip berikut:

- Gunakan nama samaran atau kod murid untuk demo.
- Jangan simpan nombor kad pengenalan.
- Jangan simpan maklumat kesihatan.
- Jangan simpan rakaman lebih lama daripada diperlukan.
- Sediakan pilihan padam audio selepas transkripsi.
- Jangan membuat diagnosis psikologi atau perubatan.
- Semua analisis mesti boleh diedit guru.
- Jangan menghantar laporan secara automatik.
- Gunakan Row Level Security dalam Supabase.
- Pastikan guru hanya boleh membaca kelas sendiri.
- Jangan expose OpenAI API key kepada browser.

### Disclaimer dalam aplikasi

> Analisis ini ialah cadangan berdasarkan refleksi guru. Guru perlu menyemak dan mengesahkan maklumat sebelum ia disimpan atau digunakan sebagai rekod.

---

# 15. Perkara yang Tidak Perlu Dibina untuk MVP

Elakkan skop berikut sebelum demo utama stabil:

- portal ibu bapa;
- aplikasi murid;
- analisis video kelas;
- pengenalan wajah;
- rakaman kelas secara berterusan;
- integrasi WhatsApp;
- integrasi sistem sekolah;
- penjana RPH penuh;
- diagnosis emosi;
- native Android atau iOS app;
- dashboard analitik kompleks.

---

# 16. Pelan Kerja Mengikut Keutamaan

## Keutamaan P0 — Wajib untuk demo

- [ ] Projek Next.js berjalan.
- [ ] Supabase disambungkan.
- [ ] Kelas demo tersedia.
- [ ] Rakaman suara berfungsi.
- [ ] Transkripsi berfungsi.
- [ ] Guru boleh edit transkripsi.
- [ ] Reflection Extractor berfungsi.
- [ ] Analisis boleh disahkan guru.
- [ ] Diagnostic Coach menghasilkan maksimum tiga soalan.
- [ ] Lesson Rescue dijana.
- [ ] Pelan boleh disimpan.
- [ ] Aplikasi dideploy ke Vercel.
- [ ] Repository GitHub mempunyai README.

## Keutamaan P1 — Menguatkan demo

- [ ] Follow-up berjaya/sebahagian/tidak berjaya.
- [ ] Sejarah refleksi.
- [ ] Detection isu berulang.
- [ ] Loading state yang jelas.
- [ ] Error handling.
- [ ] Data demo satu klik.
- [ ] Paparan telefon yang kemas.
- [ ] Copy Lesson Rescue.

## Keutamaan P2 — Selepas demo stabil

- [ ] Eksport PDF.
- [ ] PWA.
- [ ] Analitik kelas.
- [ ] Class memory lanjutan.
- [ ] Bahan rujukan guru.
- [ ] Perkongsian sesama guru.

---

# 17. Urutan Pembangunan Dicadangkan

```text
1. Setup repository dan stack
2. Bina dashboard statik
3. Tambah kelas dan data demo
4. Bina rakaman audio
5. Integrasi transkripsi
6. Bina Reflection Extractor
7. Tambah semakan guru
8. Bina Diagnostic Coach
9. Bina Lesson Rescue Generator
10. Simpan semua hasil ke Supabase
11. Tambah follow-up
12. Uji pada telefon
13. Deploy preview
14. Ujian guru
15. Baiki isu kritikal
16. Merge ke main
17. Deploy production
18. Lengkapkan README dan dokumentasi
19. Rakam video demo
20. Sediakan submission hackathon
```

---

# 18. Demo Hackathon Tiga Minit

## 0:00–0:20 — Masalah

Terangkan bahawa guru mengajar banyak kelas dan refleksi sering hilang sebelum sempat direkod.

## 0:20–0:55 — Rakaman

Guru memilih kelas dan merakam refleksi pendek.

## 0:55–1:25 — Analisis

Paparkan transkripsi, isu pembelajaran dan pemerhatian murid.

## 1:25–1:45 — Semakan Guru

Guru membetulkan satu perkara dan mengesahkan analisis.

## 1:45–2:10 — Diagnosis

Guru menjawab dua soalan pilihan.

## 2:10–2:40 — Lesson Rescue

Paparkan pelan pemulihan 10 minit, analogi dan soalan semakan.

## 2:40–2:55 — Follow-up

Tunjukkan rekod bahawa strategi terdahulu hanya sebahagian berjaya dan sistem mencadangkan pendekatan baharu.

## 2:55–3:00 — Penutup

> ClassPulse turns a teacher's reflection into the next teaching action.

---

# 19. Checklist Sebelum Push ke GitHub

- [ ] Tiada API key dalam kod.
- [ ] `.env.local` berada dalam `.gitignore`.
- [ ] `.env.example` disediakan.
- [ ] Build berjaya.
- [ ] Lint berjaya.
- [ ] Typecheck berjaya.
- [ ] Data murid sebenar dibuang.
- [ ] Screenshot tidak memaparkan data sensitif.
- [ ] README mempunyai arahan install.
- [ ] Pautan demo dimasukkan.
- [ ] License dipilih.
- [ ] Isu diketahui didokumentasikan.

---

# 20. Checklist Sebelum Submission

- [ ] URL production boleh dibuka.
- [ ] Rakaman mikrofon berfungsi melalui HTTPS.
- [ ] Akaun atau mode demo tersedia.
- [ ] Demo tidak memerlukan setup panjang.
- [ ] Repository boleh diakses oleh juri mengikut syarat pertandingan.
- [ ] README lengkap.
- [ ] Video demo jelas dan kurang daripada had masa pertandingan.
- [ ] Semua fungsi dalam video benar-benar berfungsi.
- [ ] Data yang digunakan ialah data rekaan.
- [ ] Limitasi AI diterangkan secara jujur.
- [ ] Peranan Codex atau AI development didokumentasikan jika diperlukan.
- [ ] Commit utama dan perubahan semasa hackathon mudah dikenal pasti.

---

# 21. Definition of Done

Versi hackathon dianggap selesai apabila:

- aplikasi boleh digunakan melalui telefon;
- guru boleh merakam refleksi dalam Bahasa Melayu;
- sistem menghasilkan transkripsi yang boleh diedit;
- AI mengekstrak isu pembelajaran dan pemerhatian murid;
- guru mengesahkan analisis;
- sistem bertanya maksimum tiga soalan diagnosis;
- Lesson Rescue praktikal berjaya dijana;
- hasil boleh disimpan dan dilihat semula;
- satu follow-up boleh direkod;
- aplikasi dideploy ke Vercel;
- kod dipush ke GitHub;
- README dan dokumentasi utama lengkap;
- demo tiga minit boleh dijalankan tanpa pembaikan manual.

---

# 22. Langkah Seterusnya Selepas Dokumen Ini

1. Cipta repository GitHub bernama `classpulse-ai`.
2. Inisialisasi Next.js, TypeScript dan Tailwind.
3. Cipta projek Supabase development.
4. Bina dashboard statik berdasarkan aliran MVP.
5. Bina komponen rakaman audio.
6. Integrasi transkripsi.
7. Bina schema JSON untuk Reflection Extractor.
8. Gunakan satu refleksi demo sehingga keseluruhan aliran berjaya.
9. Deploy awal ke Vercel walaupun fungsi belum lengkap.
10. Gunakan Vercel Preview untuk setiap pembaikan utama.
11. Uji dengan beberapa guru menggunakan data rekaan.
12. Lengkapkan dokumentasi berdasarkan keputusan sebenar, bukan sekadar rancangan.
