# ClassPulse AI

> **Cakap selepas kelas. AI bantu baiki kelas seterusnya.**

ClassPulse AI ialah aplikasi refleksi pengajaran berasaskan suara untuk guru. Selepas kelas, guru merakam refleksi ringkas selama 30–60 saat. ClassPulse menukarkannya kepada transkripsi yang boleh disemak, mengenal pasti isu pembelajaran berdasarkan bukti, bertanya soalan diagnosis ringkas, kemudian mencadangkan pelan **Lesson Rescue** untuk kelas seterusnya.

Matlamat produk ini bukan untuk menggantikan pertimbangan profesional guru. Semua analisis dan cadangan AI perlu disemak, dibetulkan dan disahkan oleh guru sebelum disimpan atau digunakan.

## Masalah yang diselesaikan

- Guru sering tidak sempat menulis refleksi lengkap selepas setiap kelas.
- Pemerhatian tentang konsep yang belum dikuasai mudah hilang atau tidak tersusun.
- Guru memerlukan tindakan susulan yang ringkas dan praktikal, bukan satu lagi dokumen panjang.
- Keberkesanan intervensi terdahulu sukar dijejak dari satu kelas ke kelas seterusnya.

## Skop MVP

MVP ClassPulse membolehkan guru:

1. memilih kelas;
2. merakam suara atau menaip refleksi;
3. menyemak dan membetulkan transkripsi;
4. menerima analisis AI berstruktur beserta bukti dan tahap keyakinan;
5. membetulkan serta mengesahkan analisis;
6. menjawab maksimum tiga soalan diagnosis;
7. menjana pelan Lesson Rescue selama 5, 10 atau 15 minit;
8. menyimpan pelan dan merekod hasil intervensi.

Fungsi seperti portal ibu bapa, analisis video, pengecaman wajah, rakaman kelas berterusan, diagnosis emosi, aplikasi natif dan analitik kompleks tidak termasuk dalam MVP.

## Aliran produk

```text
Pilih kelas
  -> Rakam atau taip refleksi
  -> Semak transkripsi
  -> Semak dan sahkan analisis AI
  -> Jawab maksimum 3 soalan diagnosis
  -> Jana Lesson Rescue
  -> Laksana dalam kelas seterusnya
  -> Rekod hasil intervensi
```

## Teknologi

- Next.js dan TypeScript
- Tailwind CSS
- Supabase PostgreSQL dan Supabase Auth
- Browser MediaRecorder API
- OpenAI Audio API untuk transkripsi
- OpenAI Responses API untuk analisis berstruktur
- Pengesahan input berstruktur pada route pelayan
- Netlify untuk deployment

Seni bina ringkas:

```text
Guru -> Aplikasi Next.js -> Route pelayan -> OpenAI
                         -> Supabase -> Dashboard guru
```

Kunci API OpenAI dan kunci berkeistimewaan Supabase hanya boleh digunakan pada bahagian pelayan.

## Keperluan awal

Sediakan perkara berikut sebelum menjalankan projek:

- Node.js versi LTS;
- npm;
- projek Supabase untuk pembangunan;
- kunci API OpenAI;
- pelayar moden yang menyokong rakaman mikrofon.

## Cara menjalankan secara lokal

1. Pasang kebergantungan:

   ```bash
   npm install
   ```

2. Salin fail contoh persekitaran sebagai `.env.local`:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Isi nilai yang diperlukan dalam `.env.local`.

4. Jalankan migrasi mengikut turutan melalui **Supabase Dashboard → SQL Editor**, bermula dengan [skema awal](./supabase/migrations/202607170001_initial_schema.sql), kemudian semua fail migrasi yang lebih baharu. Migrasi mencipta jadual, indeks, profil pengguna automatik dan polisi Row Level Security.

5. Dalam **Supabase Dashboard → Authentication → URL Configuration**, tetapkan Site URL kepada `http://localhost:3000` untuk pembangunan dan tambah `http://localhost:3000/auth/callback` sebagai Redirect URL.

6. Jalankan pelayan pembangunan:

   ```bash
   npm run dev
   ```

7. Buka [http://localhost:3000](http://localhost:3000), cipta akaun guru dan sahkan e-mel jika pengesahan e-mel diaktifkan.

Benarkan akses mikrofon apabila diminta. Untuk ujian pada telefon atau deployment, gunakan HTTPS kerana pelayar biasanya memerlukannya bagi akses mikrofon.

## Pemboleh ubah persekitaran

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
```

| Nama | Kegunaan | Pendedahan |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | URL asas aplikasi | Boleh digunakan pada pelayar |
| `NEXT_PUBLIC_SUPABASE_URL` | URL projek Supabase | Boleh digunakan pada pelayar |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci awam Supabase dengan RLS | Boleh digunakan pada pelayar |
| `OPENAI_API_KEY` | Transkripsi dan analisis AI | Pelayan sahaja |
| `OPENAI_MODEL` | Model Responses API (lalai: `gpt-5.6-luna`) | Pelayan sahaja |

Jangan commit `.env.local`. Jika mana-mana kunci pernah terdedah, batalkan dan jana kunci baharu dengan segera.

## Aliran demo cadangan

Gunakan data rekaan atau nama samaran sahaja.

**Kelas demo**

- Kelas: 3 Cemerlang
- Subjek: Matematik
- Topik: Pecahan

**Refleksi demo**

> Hari ini saya ajar pecahan. Lebih kurang lapan murid masih keliru antara pengangka dan penyebut. Ahmad dan Ali tidak fokus semasa penerangan. Sarah boleh jawab soalan mudah tetapi masih keliru apabila soalan menggunakan gambar.

**Urutan demo**

1. Pilih kelas 3 Cemerlang.
2. Rakam atau masukkan refleksi demo.
3. Semak dan betulkan transkripsi.
4. Paparkan isu pembelajaran, pemerhatian murid, bukti dan tahap keyakinan.
5. Betulkan satu butiran untuk menunjukkan kawalan guru, kemudian sahkan.
6. Jawab satu hingga tiga soalan diagnosis.
7. Jana Lesson Rescue 10 minit yang mengandungi objektif, bahan, langkah, analogi dan soalan semakan.
8. Rekod hasil sebagai `Berjaya`, `Sebahagian berjaya`, `Tidak berjaya` atau `Belum dilaksanakan`.

## Prinsip AI

- Ekstrak hanya maklumat yang disebut atau disokong oleh refleksi.
- Sertakan bukti dan tahap keyakinan bagi pemerhatian penting.
- Tandakan ketidakpastian; jangan mereka-reka maklumat yang tiada.
- Bezakan isu pembelajaran daripada pemerhatian tingkah laku.
- Jangan melabel murid sebagai malas, lemah atau bermasalah.
- Jangan membuat diagnosis perubatan, psikologi atau emosi.
- Hadkan soalan diagnosis kepada maksimum tiga soalan yang mempengaruhi intervensi.
- Pastikan semua hasil boleh diedit dan disahkan oleh guru.

## Privasi dan keselamatan

ClassPulse melibatkan maklumat murid, maka prinsip pengurangan data mesti digunakan dari awal:

- gunakan nama samaran atau kod murid untuk demo dan ujian;
- jangan simpan nombor kad pengenalan, maklumat kesihatan atau data sensitif yang tidak diperlukan;
- jangan simpan audio lebih lama daripada keperluan transkripsi;
- sediakan pilihan untuk memadam audio selepas transkripsi;
- lindungi setiap jadual Supabase dengan Row Level Security;
- pastikan guru hanya boleh mengakses kelas dan rekod miliknya;
- lakukan semua panggilan OpenAI melalui route pelayan;
- jangan hantar laporan murid secara automatik kepada pihak lain;
- benarkan guru menyunting atau memadam rekod yang tidak tepat.

Paparkan penafian berikut bersama hasil AI:

> Analisis ini ialah cadangan berdasarkan refleksi guru. Guru perlu menyemak dan mengesahkan maklumat sebelum ia disimpan atau digunakan sebagai rekod.

## Pemeriksaan sebelum dihantar

Jalankan pemeriksaan yang tersedia dalam projek:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Selain ujian automatik, uji keseluruhan aliran pada Chrome desktop, Microsoft Edge, Chrome Android dan Safari iPhone jika tersedia. Semak juga keadaan ralat seperti akses mikrofon ditolak, audio kosong, transkripsi gagal, output AI tidak lengkap dan sambungan pangkalan data terputus.

## Deployment

Deployment production menggunakan Netlify:

1. push repository ke GitHub dan sambungkan branch `main` kepada site Netlify;
2. tetapkan pemboleh ubah persekitaran public Supabase serta `OPENAI_API_KEY` di Netlify;
3. jalankan migrasi Supabase sebagai langkah berasingan sebelum deploy yang menggunakan skema baharu;
4. gunakan projek Supabase berasingan untuk staging dan production jika boleh;
5. semak Netlify Deploy Preview bagi setiap pull request;
6. deploy production dan uji semula login, analisis, simpanan serta paparan telefon.

Tanpa `OPENAI_API_KEY`, route analisis menggunakan mod demo deterministik supaya aliran UI boleh diuji secara lokal. Gunakan data rekaan pada persekitaran demo. Jangan masukkan kunci rahsia ke dalam repository atau tangkapan skrin.

## Status dan langkah seterusnya

- [x] Sediakan aplikasi Next.js, TypeScript dan Tailwind.
- [x] Sediakan klien Supabase untuk pelayar dan pelayan.
- [ ] Cipta skema pangkalan data dan aktifkan Row Level Security.
- [x] Bina dashboard serta kelas demo.
- [x] Tambah rakaman audio dan input teks alternatif.
- [ ] Integrasikan transkripsi sebenar.
- [x] Bina route Reflection Extractor dengan output berstruktur dan mod demo.
- [ ] Tambah semakan dan pengesahan guru.
- [ ] Bina Diagnostic Coach.
- [ ] Jana dan simpan Lesson Rescue.
- [ ] Tambah rekod susulan intervensi.
- [ ] Uji pada telefon dan deploy preview awal.
- [ ] Lengkapkan ujian, dokumentasi dan video demo tiga minit.

Pelan pelaksanaan penuh boleh dirujuk dalam [ClassPulse_Implementation_Roadmap.md](./ClassPulse_Implementation_Roadmap.md).

## Lesen

Lesen projek belum ditetapkan. Tambahkan fail `LICENSE` sebelum edaran awam.
