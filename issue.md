# issue.md — Rencana Proyek Website Jual Mobil Bekas

> Dokumen perencanaan dan sumber kebenaran backlog. Setiap task di bagian 7 dibuat sebagai **GitHub issue baru**.
> ID lokal `T-xx` diganti dengan nomor GitHub (`#n`) setelah issue dibuat. Dokumen ini dipakai oleh developer atau model AI yang lebih murah, jadi setiap issue ditulis mandiri dan singkat.

---

## 1. Ringkasan & tujuan

Website jual mobil bekas (dealer/sales perorangan) untuk pasar Indonesia, dibuat dengan pola situs referensi <https://www.salesmitsubishi.com/>: situs sales satu orang yang mengubah pengunjung menjadi **lead lewat WhatsApp**.

Elemen referensi yang diadaptasi: hero promo + CTA WhatsApp, daftar produk dengan harga jelas, simulasi DP/cicilan, promo, galeri serah terima/testimoni, artikel, kontak, dan tombol WA/telepon yang selalu terlihat.

Perbedaan utama: setiap mobil bekas adalah **unit unik** (satu unit = satu stok, dengan status), bukan model baru. Jangan meniru branding Mitsubishi (logo, nama, warna merek, aset gambar).

**Tujuan bisnis:** pengunjung dapat menemukan mobil yang cocok dengan cepat, lalu menghubungi penjual lewat WhatsApp atau form.

**Indikator berhasil:**
- Mobil dapat ditemukan dalam maksimal 3 langkah dari beranda.
- Setiap halaman mobil memiliki CTA WhatsApp dengan pesan otomatis.
- Admin dapat menambah dan mengubah stok tanpa bantuan developer.
- Halaman terasa cepat dan nyaman di HP.

---

## 2. Input dari pemilik (isi sebelum rilis)

| Kebutuhan | Nilai |
|---|---|
| Nama showroom / sales | _(isi)_ |
| Nomor WhatsApp & telepon | _(isi)_ |
| Alamat, jam operasional, tautan peta | _(isi)_ |
| Logo (opsional) & preferensi warna | _(isi / mengikuti design system)_ |
| Domain & hosting/VPS | _(isi)_ |
| Parameter kredit awal (DP minimum, tenor, bunga) | _(isi; dapat diubah admin)_ |

---

## 3. Lingkup

**Publik:** Beranda, katalog dengan filter/sort/pagination, detail mobil, simulasi kredit, form tukar tambah/jual mobil/test drive, galeri serah terima & testimoni, artikel, kontak & lokasi, tombol WA/telepon melayang, SEO dasar.

**Admin:** login, kelola mobil (CRUD, foto, status, unggulan), kelola promo/testimoni/artikel/pengaturan situs, kelola lead, dashboard ringkas.

**Di luar lingkup:** pembayaran online, chat realtime, multi-dealer, aplikasi mobile, notifikasi email/WA otomatis, multi-bahasa.

---

## 4. Keputusan arsitektur (high level)

| Area | Keputusan | Alasan |
|---|---|---|
| Runtime & tooling | **Bun** (runtime, package manager, test runner) | Sesuai kebutuhan; satu tool untuk semua |
| Struktur repo | Monorepo sederhana dengan Bun workspaces: `web/` (React), `api/` (server), `db/` (skema & migrasi Drizzle) | Pemisahan jelas, mudah dikerjakan per issue |
| Frontend | **ReactJS** + Vite, React Router, Tailwind CSS (token dari design system dipetakan ke tema) | Umum, mudah dikerjakan model murah |
| Backend | Server Bun dengan **Hono** sebagai router tipis, validasi **Zod** | Ringan dan native untuk Bun |
| Database | **PostgreSQL** + **Drizzle ORM** (driver kompatibel Bun, diputuskan di #2) | Sesuai kebutuhan |
| Auth admin | Login email/password, hash password, session cookie `httpOnly` | Cukup untuk 1–3 admin |
| Foto mobil | Upload ke penyimpanan lokal (volume server) lewat lapisan abstraksi, otomatis dikompres dan di-resize | Murah; mudah dipindah ke object storage nanti |
| SEO | Server menyisipkan meta tag/Open Graph per halaman ke HTML awal, ditambah sitemap dinamis | SPA murni lemah untuk SEO listing mobil |
| WhatsApp | Link `wa.me` dengan pesan template; nomor dari pengaturan situs | Tanpa biaya API, sama seperti situs referensi |
| Simulasi kredit | Dihitung di sisi klien dengan parameter dari pengaturan; selalu berlabel **estimasi** | Bukan penawaran resmi |
| Deployment | Docker Compose (app + PostgreSQL + volume foto) di VPS, HTTPS lewat reverse proxy | Sederhana dan terkontrol |

**Dependency tambahan yang disetujui:** Vite, React Router, Tailwind CSS, Hono, Zod, pustaka pemrosesan gambar (dipilih di #13). Selain itu, **wajib ada alasan tertulis di issue terkait**.

---

## 5. Model data (high level)

`brands`, `cars` (status: draft / tersedia / booking / terjual; flag unggulan; slug unik), `car_photos` (urutan, foto utama), `promos`, `testimonials`, `articles` (draft/terbit), `leads` (tipe: tukar_tambah / test_drive / kontak / simulasi; status: baru / dihubungi / selesai; catatan), `site_settings`, `admin_users`, `sessions`.

---

## 6. Konvensi kerja

**Alur role:** Planning → Design → Developer → Testing. Backend (M2) boleh dikerjakan paralel dengan Desain (M1). Frontend (M3) menunggu desain dan API yang relevan.

**Label GitHub:** `role:planning` `role:design` `role:developer` `role:testing` · `type:feature` `type:bug` `type:chore` · `blocked`.

**Milestone GitHub:** M0 Fondasi · M1 Desain · M2 Backend & Data · M3 Frontend Publik · M4 Admin · M5 SEO, Performa & Deploy · M6 QA & Rilis.

**Branch & commit:** satu issue = satu branch `feat/<nomor>-<slug>`; commit menyebut `Closes #<nomor>`.

**Definition of Done (berlaku untuk semua issue):**
- Semua kriteria di issue terpenuhi.
- Lint, typecheck, dan tes lulus.
- Tidak ada dependency di luar daftar yang disetujui tanpa alasan tertulis.
- Komentar ringkas di issue (apa yang dibuat, lokasi hasil), lalu serahkan ke role berikutnya.
- Issue ambigu: **tanya Planning, jangan menebak**.

**Bug:** ditemukan Testing → issue baru `type:bug` berisi langkah reproduksi, hasil diharapkan vs aktual, dan rujukan issue asal.

---

## 7. Milestone & daftar issue

Format: `ID · judul` — label · dependensi · GitHub.

### M0 — Fondasi

#### #1 · Inisialisasi repo & workspace Bun
`role:developer` `type:chore` · Dependensi: — · GitHub: #1

Menyiapkan kerangka repo agar semua issue berikutnya punya tempat kerja yang jelas.
- [ ] Struktur `web/`, `api/`, `db/` dengan Bun workspaces
- [ ] Script root: `dev`, `build`, `lint`, `typecheck`, `test`
- [ ] `.env.example` dan `README.md` berisi cara menjalankan proyek
- [ ] `.env` masuk `.gitignore`; tidak ada password atau secret yang ikut ter-commit ke repo
- [ ] `bun install` lalu `bun run dev` menjalankan web dan api

#### #2 · PostgreSQL lokal & konfigurasi Drizzle
`role:developer` `type:chore` · Dependensi: #1 · GitHub: #1

- [ ] Pengembangan memakai PostgreSQL lokal yang sudah terpasang (PostgreSQL 15), terhubung lewat `DATABASE_URL` di `.env`; contoh format ada di `.env.example` (karakter khusus pada password harus di-URL-encode)
- [ ] Docker Compose tidak dibutuhkan untuk pengembangan; hanya dipakai untuk produksi (#36)
- [ ] Konfigurasi Drizzle (generate dan migrate) dengan script di root
- [ ] Driver PostgreSQL yang kompatibel Bun dipilih dan alasannya dicatat di README
- [ ] Koneksi dari `api` berhasil diuji

#### #3 · CI dasar
`role:developer` `type:chore` · Dependensi: #1 · GitHub: #2

- [ ] GitHub Actions pada push/PR menjalankan install, lint, typecheck, test
- [ ] Pipeline gagal bila salah satu langkah gagal

---

### M1 — Desain

Semua hasil desain disimpan di `docs/design/`. Tampilan harus **mobile-first**, terang, bersih, dan ramah pengguna.

#### #4 · Design system & token
`role:design` `type:chore` · Dependensi: — · GitHub: #3

- [ ] Palet: latar netral terang, **satu** warna primer tepercaya, **satu** warna aksen untuk CTA utama, warna status stok (tersedia/booking/terjual) dan warna feedback (sukses/error)
- [ ] Tipografi, spacing, radius, dan bayangan
- [ ] Kontras teks memenuhi WCAG AA (dicatat hasil pengecekannya)
- [ ] Output: `docs/design/tokens.md` dan `docs/design/tokens.css` (CSS variables)

#### #5 · Komponen & pola UI
`role:design` `type:chore` · Dependensi: #4 · GitHub: #4

- [ ] Mockup HTML statis `docs/design/components.html`: tombol, input/select/slider, kartu mobil, badge status, header/navigasi, footer, tombol WA/telepon melayang, pagination, panel filter (drawer di mobile), alert/toast
- [ ] Setiap komponen punya state: default, hover, fokus, disabled, error
- [ ] Target sentuh cukup besar untuk HP

#### #6 · Mockup Beranda, Katalog, Detail Mobil
`role:design` `type:feature` · Dependensi: #4, #5 · GitHub: #5

- [ ] Tiga halaman dalam tampilan mobile dan desktop di `docs/design/pages/`
- [ ] Harga, status, dan CTA WhatsApp terlihat jelas tanpa scroll berlebihan
- [ ] Foto mobil menjadi fokus utama

#### #7 · Mockup Simulasi Kredit, Tukar Tambah, Testimoni, Artikel, Kontak
`role:design` `type:feature` · Dependensi: #4, #5 · GitHub: #6

- [ ] Mockup mobile dan desktop untuk lima halaman tersebut, termasuk state sukses/error form
- [ ] Label "estimasi" pada simulasi kredit tampak jelas

#### #8 · Mockup Admin
`role:design` `type:feature` · Dependensi: #4, #5 · GitHub: #7

- [ ] Login, dashboard ringkas, daftar mobil, form mobil (termasuk upload & urutan foto), kelola konten, daftar & detail lead
- [ ] Layout admin nyaman dipakai di laptop dan tetap terbaca di HP

---

### M2 — Backend & Data

#### #9 · Skema database & seed
`role:developer` `type:feature` · Dependensi: #2 · GitHub: #8

- [ ] Skema Drizzle untuk semua entitas di bagian 5, lengkap dengan relasi dan index untuk filter (merek, harga, tahun, status, slug unik)
- [ ] Migrasi dari database kosong berhasil
- [ ] Seed idempoten: 1 admin (dari env), merek umum, ±10 mobil contoh, pengaturan situs default
- [ ] Ringkasan skema di `docs/data-model.md`

#### #10 · API server dasar
`role:developer` `type:chore` · Dependensi: #2 · GitHub: #9

- [ ] Server Hono dengan struktur route, validasi Zod, dan format error konsisten
- [ ] Konfigurasi env tervalidasi dan security header dasar
- [ ] Endpoint `/api/health` dengan tes

#### #11 · Autentikasi admin
`role:developer` `type:feature` · Dependensi: #9, #10 · GitHub: #10

- [ ] Login, logout, dan "saya siapa" dengan session cookie `httpOnly`
- [ ] Password di-hash; batas percobaan login dasar
- [ ] Semua route `/api/admin/*` ditolak tanpa sesi valid
- [ ] Tes untuk alur sukses dan gagal

#### #12 · API publik mobil
`role:developer` `type:feature` · Dependensi: #9, #10 · GitHub: #11

- [ ] Daftar mobil dengan filter (merek, rentang harga, tahun, transmisi, bahan bakar, kata kunci), sort (terbaru, harga, tahun, kilometer), dan pagination
- [ ] Detail mobil berdasarkan slug
- [ ] Endpoint opsi filter (daftar merek dan rentang nilai)
- [ ] Mobil berstatus draft tidak pernah tampil di publik

#### #13 · Upload & pengelolaan foto
`role:developer` `type:feature` · Dependensi: #9, #10, #11 · GitHub: #12

- [ ] Upload khusus admin dengan validasi tipe dan ukuran file
- [ ] Gambar dikompres dan dibuat dalam beberapa ukuran; pustaka yang dipakai dicatat alasannya
- [ ] Penyimpanan lewat lapisan abstraksi (default: volume lokal), disajikan dengan cache header
- [ ] Atur urutan dan foto utama; hapus foto membersihkan filenya

#### #14 · API admin mobil
`role:developer` `type:feature` · Dependensi: #11, #13 · GitHub: #13

- [ ] CRUD mobil dengan validasi; slug otomatis dan unik
- [ ] Ubah status (draft/tersedia/booking/terjual) dan tandai unggulan
- [ ] Penghapusan berupa arsip, bukan hilang permanen

#### #15 · API konten & pengaturan situs
`role:developer` `type:feature` · Dependensi: #11 · GitHub: #14

- [ ] Publik: promo aktif, testimoni, artikel terbit (list dan detail via slug), pengaturan situs publik (nomor WA/telepon, alamat, parameter kredit, teks hero)
- [ ] Admin: CRUD promo, testimoni, artikel (draft/terbit), dan pengaturan situs

#### #16 · API lead
`role:developer` `type:feature` · Dependensi: #9, #10, #11 · GitHub: #15

- [ ] Endpoint publik untuk mengirim lead (tukar_tambah, test_drive, kontak, simulasi) dengan validasi nomor HP Indonesia
- [ ] Perlindungan spam dasar (honeypot dan rate limit)
- [ ] Admin: daftar (filter tipe/status), detail, ubah status, catatan

#### #17 · Verifikasi API
`role:testing` `type:chore` · Dependensi: #11, #12, #13, #14, #15, #16 · GitHub: #16

- [ ] Tes otomatis (`bun test`) mencakup kriteria #9 s.d. #16, termasuk kasus tanpa login dan input tidak valid
- [ ] Temuan dibuat sebagai issue `type:bug`; ringkasan hasil ditulis di komentar issue ini

---

### M3 — Frontend Publik

#### #18 · Fondasi frontend
`role:developer` `type:chore` · Dependensi: #1, #4, #5 · GitHub: #17

- [ ] Vite + React + React Router + Tailwind dengan token dari #4
- [ ] Layout (header, footer) dan komponen dasar sesuai #5
- [ ] API client, serta state loading, error, kosong, dan halaman 404

#### #19 · CTA global & util WhatsApp
`role:developer` `type:feature` · Dependensi: #15, #18 · GitHub: #18

- [ ] Util pembuat link `wa.me` dengan nomor dari pengaturan dan template pesan per konteks (umum, mobil tertentu, simulasi)
- [ ] Tombol WA dan telepon melayang di semua halaman publik, tidak menutupi konten penting di HP

#### #20 · Halaman Beranda
`role:developer` `type:feature` · Dependensi: #6, #12, #15, #19 · GitHub: #19

- [ ] Hero promo + CTA, pencarian cepat (merek, rentang harga, tahun) yang membuka katalog
- [ ] Mobil unggulan, keunggulan layanan, promo, ringkasan testimoni/galeri, artikel terbaru
- [ ] Sesuai mockup #6

#### #21 · Halaman Katalog
`role:developer` `type:feature` · Dependensi: #6, #12, #18 · GitHub: #20

- [ ] Grid kartu mobil; filter (drawer di mobile), sort, pagination
- [ ] Filter tersimpan di URL sehingga hasil bisa dibagikan
- [ ] State loading (skeleton) dan hasil kosong

#### #22 · Halaman Detail Mobil
`role:developer` `type:feature` · Dependensi: #6, #12, #19 · GitHub: #21

- [ ] Galeri foto (geser di mobile, perbesar), spesifikasi, kondisi, harga, dan status
- [ ] CTA WhatsApp dengan pesan otomatis berisi nama dan link mobil
- [ ] Mobil serupa; tampilan 404 untuk slug tidak ditemukan

#### #23 · Simulasi Kredit
`role:developer` `type:feature` · Dependensi: #7, #15, #18, #19 · GitHub: #22

- [ ] Kalkulator (harga, DP, tenor) menghasilkan estimasi cicilan per bulan
- [ ] Parameter default dari pengaturan situs; label **estimasi** dan disclaimer terlihat jelas
- [ ] Dapat dibuka dari detail mobil dengan harga terisi; hasil dapat dikirim ke WhatsApp
- [ ] Rumus dicatat singkat dan diuji dengan unit test

#### #24 · Form Tukar Tambah / Jual Mobil / Test Drive
`role:developer` `type:feature` · Dependensi: #7, #16, #18, #19 · GitHub: #23

- [ ] Form terhubung ke API lead dengan validasi di klien dan server
- [ ] State sukses dan error sesuai mockup; opsi lanjut ke WhatsApp setelah kirim

#### #25 · Testimoni/Galeri, Artikel, Kontak
`role:developer` `type:feature` · Dependensi: #7, #15, #18 · GitHub: #24

- [ ] Galeri serah terima dan testimoni
- [ ] Artikel: daftar dan detail
- [ ] Kontak: alamat, jam operasional, tautan peta/petunjuk arah, tombol WA dan telepon

#### #26 · Verifikasi Beranda, Katalog, Detail & CTA
`role:testing` `type:chore` · Dependensi: #19, #20, #21, #22 · GitHub: #25

- [ ] Skenario diuji di tampilan HP dan desktop: pencarian cepat, filter/sort/pagination, URL filter, galeri, link WhatsApp yang benar
- [ ] Temuan dibuat sebagai issue `type:bug`

#### #27 · Verifikasi Simulasi, Form & Konten
`role:testing` `type:chore` · Dependensi: #23, #24, #25 · GitHub: #26

- [ ] Hitungan simulasi sesuai rumus pada beberapa contoh angka
- [ ] Form: kasus valid dan tidak valid; data benar-benar tersimpan sebagai lead
- [ ] Halaman konten tampil benar dan tidak ada tautan rusak

---

### M4 — Admin

#### #28 · Shell admin & login
`role:developer` `type:feature` · Dependensi: #8, #11, #18 · GitHub: #27

- [ ] Halaman login, layout admin, logout
- [ ] Guard route: pengguna tanpa sesi diarahkan ke login; sesi kedaluwarsa ditangani dengan jelas

#### #29 · Admin kelola mobil
`role:developer` `type:feature` · Dependensi: #8, #14, #28 · GitHub: #28

- [ ] Daftar dengan pencarian dan filter status
- [ ] Form tambah/ubah semua field, upload dan urut foto, pilih foto utama
- [ ] Ubah status cepat, tandai unggulan, arsipkan

#### #30 · Admin konten & pengaturan situs
`role:developer` `type:feature` · Dependensi: #8, #15, #28 · GitHub: #29

- [ ] CRUD promo, testimoni (dengan foto), dan artikel (editor sederhana, draft/terbit)
- [ ] Halaman pengaturan situs (kontak, parameter kredit, teks hero)

#### #31 · Admin kelola lead
`role:developer` `type:feature` · Dependensi: #8, #16, #28 · GitHub: #30

- [ ] Daftar dengan filter tipe/status, halaman detail, ubah status, catatan
- [ ] Tombol hubungi lewat WhatsApp/telepon dari detail lead

#### #32 · Dashboard ringkas
`role:developer` `type:feature` · Dependensi: #8, #28, #29, #31 · GitHub: #31

- [ ] Jumlah mobil per status, jumlah lead baru, daftar lead terbaru, pintasan ke tindakan utama

#### #33 · Verifikasi Admin & alur lead end-to-end
`role:testing` `type:chore` · Dependensi: #29, #30, #31, #32, #24 · GitHub: #32

- [ ] Alur lengkap: login → tambah mobil → tampil di situs publik → kirim lead dari publik → muncul di admin → ubah status
- [ ] Akses admin ditolak tanpa login
- [ ] Temuan dibuat sebagai issue `type:bug`

---

### M5 — SEO, Performa & Deploy

#### #34 · SEO dasar
`role:developer` `type:feature` · Dependensi: #20, #21, #22, #25 · GitHub: #33

- [ ] Title, description, dan Open Graph per halaman, termasuk detail mobil, tersedia di HTML awal dari server
- [ ] `sitemap.xml` dinamis, `robots.txt`, canonical URL
- [ ] Structured data (JSON-LD) untuk detail mobil

#### #35 · Optimasi performa
`role:developer` `type:chore` · Dependensi: #20, #21, #22 · GitHub: #34

- [ ] Gambar lazy-load dan responsif (memakai ukuran dari #13)
- [ ] Code-splitting per halaman dan cache header untuk aset statis
- [ ] Target awal (Lighthouse mobile): Performance ≥ 80, Accessibility dan SEO ≥ 90 pada Beranda, Katalog, Detail

#### #36 · Deployment
`role:developer` `type:chore` · Dependensi: #3, #29 · GitHub: #35

- [ ] Dockerfile dan Docker Compose produksi (app, PostgreSQL, volume foto)
- [ ] Konfigurasi env produksi, HTTPS lewat reverse proxy, migrasi otomatis saat rilis
- [ ] Backup database terjadwal dan cara restore
- [ ] Panduan lengkap di `docs/deploy.md`

#### #37 · Verifikasi SEO, performa & deploy
`role:testing` `type:chore` · Dependensi: #34, #35, #36 · GitHub: #36

- [ ] Meta/OG/sitemap diperiksa pada beberapa halaman
- [ ] Skor Lighthouse dicatat dan dibandingkan dengan target
- [ ] Deploy ke staging berhasil mengikuti `docs/deploy.md`; restore backup berhasil dicoba

---

### M6 — QA & Rilis

#### #38 · Verifikasi aksesibilitas & responsif
`role:testing` `type:chore` · Dependensi: #37 · GitHub: #37

- [ ] Kontras AA, navigasi keyboard, label form, dan teks alternatif foto
- [ ] Diuji pada lebar 360, 768, dan 1280 px tanpa scroll horizontal

#### #39 · Regresi final & checklist rilis
`role:testing` `type:chore` · Dependensi: #38 · GitHub: #38

- [ ] Seluruh skenario utama diulang di staging
- [ ] Tidak ada bug berprioritas tinggi yang terbuka
- [ ] Smoke test pasca-rilis di produksi dicatat

#### #40 · Review akhir & backlog fase 2
`role:planning` `type:chore` · Dependensi: #39 · GitHub: #39

- [ ] Hasil dibandingkan dengan tujuan di bagian 1; milestone dan issue yang selesai ditutup
- [ ] Ide fase 2 dicatat di `issue.md` (belum dibuat sebagai issue), misalnya notifikasi lead, perbandingan mobil, wishlist, multi-bahasa

---

## 8. Asumsi & risiko

| Hal | Catatan |
|---|---|
| Satu showroom, 1–3 admin | Jika bertambah, auth dan role perlu ditinjau ulang |
| Lead hanya tersimpan di database dan dibuka lewat admin | Tanpa notifikasi otomatis, admin harus rutin mengecek; notifikasi masuk fase 2 |
| Simulasi kredit hanya estimasi | Wajib berlabel jelas agar tidak dianggap penawaran resmi |
| Foto di penyimpanan lokal | Wajib ikut di-backup; pindah ke object storage bila stok bertambah besar |
| SEO untuk SPA | Mitigasi lewat #34; periksa ulang hasil di #37 |
| Hak atas foto dan konten | Pastikan pemilik memiliki izin untuk foto mobil, testimoni, dan artikel yang dipublikasikan |
| Lisensi alat bantu | Cek syarat lisensi OpenBot bila proyek ini untuk bisnis |

---

## 9. Ringkasan jumlah issue

| Role | Jumlah |
|---|---|
| Design | 5 |
| Developer | 27 |
| Testing | 7 |
| Planning | 1 |
| **Total** | **40** |

