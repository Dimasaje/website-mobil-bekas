# Deploy produksi

Panduan menjalankan situs di VPS dengan Docker Compose: satu container app (Bun + API + hasil build web), PostgreSQL, dan Caddy sebagai reverse proxy yang mengurus HTTPS otomatis. Foto disimpan di volume terpisah, database di volume lain, dan migrasi berjalan otomatis setiap container app start.

```
internet ── 80/443 ──> proxy (Caddy, HTTPS otomatis)
                            │
                            └─ app:3001 (Bun: API + /uploads + SPA)
                                    │
                                    └─ db:5432 (PostgreSQL 15)
```

## 1. Prasyarat

- VPS Linux (disarankan 2 vCPU / 2 GB RAM / 20 GB disk ke atas — `sharp` butuh memori saat memproses foto).
- Docker Engine 24+ dan Docker Compose v2 (`docker compose version`).
- Domain yang bisa diatur DNS-nya. Domain produksi **belum ditetapkan**; semua contoh di bawah memakai `bintangmobil.co.id` sebagai placeholder.
- Port 80 dan 443 terbuka di firewall VPS.
- Repo sudah di-clone di VPS, mis. `/opt/website-mobil-bekas`.

## 2. DNS

Buat dua record A (atau AAAA untuk IPv6) yang menunjuk ke IP publik VPS:

| Nama | Tipe | Nilai |
| --- | --- | --- |
| `bintangmobil.co.id` | A | IP VPS |
| `www.bintangmobil.co.id` | A | IP VPS |

Tunggu propagasi sebelum menyalakan proxy; Caddy butuh domain sudah mengarah ke VPS untuk menerbitkan sertifikat.

Kalau ingin `www` juga dilayani, tambahkan baris di `Caddyfile`:

```caddyfile
www.{$SITE_DOMAIN} {
	redir https://{$SITE_DOMAIN}{uri} 308
}
```

## 3. Environment

```bash
cd /opt/website-mobil-bekas
cp .env.production.example .env
nano .env
```

Nilai yang wajib diubah:

| Variabel | Keterangan |
| --- | --- |
| `SITE_DOMAIN` | Domain tanpa `https://`; dipakai Caddy untuk sertifikat. |
| `SITE_URL` | URL publik lengkap (`https://...`). Dipakai canonical, Open Graph, sitemap, `robots.txt`. |
| `POSTGRES_PASSWORD` | Password database. Karakter khusus harus di-URL-encode (`@` → `%40`) karena dirangkai ke `DATABASE_URL`. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin awal, hanya dipakai saat seed pertama. |
| `SEED_ON_START` | `true` sekali saat instalasi awal, lalu `false`. |

`.env` tidak ikut ke image dan tidak boleh di-commit.

## 4. Rilis pertama

```bash
docker compose build
SEED_ON_START=true docker compose up -d
```

Yang terjadi:

1. `db` naik dan menunggu sampai `pg_isready` sehat.
2. `app` start → entrypoint menjalankan `bun run db:migrate` (semua migrasi `db/drizzle`), lalu `db:seed` bila `SEED_ON_START=true`, lalu API di port 3001.
3. `proxy` start → Caddy meminta sertifikat untuk `$SITE_DOMAIN`, lalu meneruskan trafik ke `app:3001`.

Periksa:

```bash
docker compose ps
docker compose logs -f app
curl -s https://bintangmobil.co.id/api/health
curl -s https://bintangmobil.co.id/api/db-check
```

Setelah admin dibuat, kembalikan `SEED_ON_START=false` di `.env` dan `docker compose up -d` sekali lagi. Seed bersifat idempoten (admin yang sudah ada tidak diubah), tetapi menjalankannya tiap boot memperlambat start.

Login admin di `https://bintangmobil.co.id/admin/login` memakai `ADMIN_EMAIL` / `ADMIN_PASSWORD` dari `.env` saat seed.

## 5. Uji lokal tanpa domain

Deploy bisa dicoba di komputer sendiri sebelum ada VPS/domain. Pakai domain `http://localhost` supaya Caddy melayani HTTP biasa (tanpa sertifikat yang harus dipercaya browser):

```bash
cp .env.production.example .env
# ubah di .env:
#   SITE_DOMAIN=http://localhost
#   SITE_URL=http://localhost
docker compose build
SEED_ON_START=true docker compose up -d
```

Buka `http://localhost`. Perlu diperhatikan:

- Port 80 dan 443 harus bebas. Kalau dipakai (IIS, Skype, nginx, layanan lain), ubah pemetaan port `proxy` di `docker-compose.yml` menjadi `"8080:80"` dan `"8443:443"`, lalu set `SITE_DOMAIN=http://localhost:8080` dan `SITE_URL=http://localhost:8080`.
- `docker compose build` memerlukan Docker Desktop (Windows/macOS) yang sudah berjalan; kalau muncul "Docker Desktop is unable to start", restart mesin (instalasi pertama butuh WSL2 siap) atau jalankan Docker Desktop lalu tunggu sampai statusnya *running*.
- Data yang dibuat saat uji lokal hilang kalau volume dihapus: `docker compose down -v`.
- `.env` hasil uji lokal jangan dipakai di VPS — buat ulang dari `.env.production.example`.

## 6. Rilis berikutnya

```bash
cd /opt/website-mobil-bekas
git pull
docker compose build app
docker compose up -d app
```

Migrasi otomatis dijalankan oleh entrypoint sebelum API start, jadi tidak ada langkah manual. Bila migrasi gagal, container berhenti (`set -e`) dan situs menjadi 502 di proxy sampai masalahnya diperbaiki — backup dulu sebelum rilis yang mengubah skema (bagian 7).

Rollback: `git checkout <commit-lama> && docker compose build app && docker compose up -d app`. Migrasi tidak mundur otomatis; kalau rilis baru sudah mengubah skema, restore backup.

### Build selalu di dalam image

Image dibangun di Linux oleh `Dockerfile` (stage build menjalankan `bun install` dan `bun run build` di dalam image), jadi artefak apa pun yang ada di mesin pengembang tidak pernah ikut — `web/dist` dan `api/dist` dikecualikan `.dockerignore`.

Jangan build di Windows lalu menyalin hasilnya ke server atau meng-commit `dist/`: artefak build bergantung pada platform tempat ia dibuat (binding native `sharp`, resolusi modul), dan di Linux gejalanya berupa kegagalan start seperti:

```
Could not load the "sharp" module using the linux-x64 runtime
```

`api/package.json` sudah memakai `--external sharp`, jadi `sharp` di-resolve dari `node_modules` mesin yang menjalankan dan build lokal Windows tidak lagi membundel binding native. Meski begitu, aturan tetap: **jalankan `docker compose build`, jangan jalankan `bun run build` di Windows lalu mengandalkan `dist/`**. `dist/` sudah masuk `.gitignore`.

## 7. Backup

Satu perintah untuk database + foto:

```bash
./scripts/backup.sh
```

Hasil di `backups/`:

- `db-<stamp>.sql.gz` — `pg_dump --clean --if-exists`, bisa dipulihkan ke database kosong maupun berisi.
- `uploads-<stamp>.tar.gz` — seluruh isi volume foto `/app/uploads`.

Arsip lebih tua dari `BACKUP_KEEP_DAYS` (default 14) dihapus otomatis.

Script berhenti dengan status non-zero bila `pg_dump` atau `tar` gagal, dan tidak meninggalkan arsip setengah jadi: dump dan tar ditulis ke berkas sementara, diperiksa (tidak kosong, gzip valid, ada penanda `PostgreSQL database dump complete`), baru dipindahkan menjadi `db-<stamp>.sql.gz` / `uploads-<stamp>.tar.gz`. Artinya `./scripts/backup.sh && echo ok` hanya mencetak `ok` kalau kedua arsip benar-benar terbentuk.

Jadwalkan harian lewat cron VPS, mis. pukul 03:00:

```cron
0 3 * * * cd /opt/website-mobil-bekas && ./scripts/backup.sh >> /var/log/mobil-backup.log 2>&1
```

Salin `backups/` ke luar VPS (object storage, `rsync` ke mesin lain) — backup yang hanya ada di VPS yang sama tidak melindungi dari kehilangan disk.

## 8. Restore

```bash
# database saja
./scripts/restore.sh backups/db-20260101-030000.sql.gz

# database + foto
./scripts/restore.sh backups/db-20260101-030000.sql.gz backups/uploads-20260101-030000.tar.gz
```

Script memeriksa dulu bahwa arsip adalah gzip valid, tidak kosong, dan dump lengkap (`-- PostgreSQL database dump complete`); kalau tidak, script berhenti sebelum menyentuh database. Setelah konfirmasi (ketik `restore`), `app` dihentikan, data dipulihkan, lalu `app` dinyalakan kembali. Restore menimpa data yang ada dan tidak bisa dibatalkan. Bila `psql` gagal, script keluar non-zero dan `app` tetap berhenti — periksa pesan error, lalu `docker compose start app` untuk menyalakan lagi.

`docker compose start app` menjalankan ulang entrypoint, jadi `bun run db:migrate` ikut berjalan setelah restore. Kalau backup berasal dari versi skema lama, migrasi yang belum ada diterapkan otomatis saat itu.

Memulihkan dari database kosong (mis. VPS baru):

```bash
docker compose up -d db
./scripts/restore.sh backups/db-....sql.gz
docker compose up -d
```

## 9. Operasional

| Kebutuhan | Perintah |
| --- | --- |
| Lihat log app | `docker compose logs -f app` |
| Lihat log proxy / sertifikat | `docker compose logs -f proxy` |
| Restart app | `docker compose restart app` |
| Masuk shell app | `docker compose exec app sh` |
| Masuk psql | `docker compose exec db psql -U postgres -d website_mobil_bekas` |
| Ukuran volume foto | `docker compose exec app du -sh /app/uploads` |
| Hentikan semua | `docker compose down` (volume tetap; `down -v` menghapus data) |
| Seed manual | `docker compose exec app bun run db:seed` |

## 10. Troubleshooting

**Sertifikat tidak terbit.** Cek `docker compose logs proxy`. Penyebab umum: DNS belum mengarah ke VPS, port 80/443 tertutup, atau domain sudah dipakai proses lain (hentikan nginx/apache di host).

**App restart berulang.** `docker compose logs app` — biasanya `DATABASE_URL` salah (password tidak di-URL-encode) atau migrasi gagal. `db` harus `healthy` sebelum app start; cek `docker compose ps`.

**502 dari proxy.** `app` belum siap atau mati. `docker compose logs app`, lalu `docker compose ps`.

**Upload foto gagal / hilang setelah redeploy.** Pastikan volume `uploads` ter-mount (`docker compose config` menampilkan `uploads:/app/uploads`). Jangan `docker compose down -v` kecuali memang ingin menghapus data.

**Gambar tidak muncul setelah restore.** Isi volume harus di `/app/uploads`; arsip backup menaruh folder `uploads/`, jadi ekstrak dengan `-C /app` (sudah dilakukan `restore.sh`).

**Halaman 404 untuk rute SPA.** Pastikan image memuat `web/dist` (`WEB_DIST_DIR=/app/web/dist` sudah di-set di Dockerfile). Kalau build web gagal, image tidak akan berisi `index.html` dan semua rute selain `/api` jadi 404.

**Disk penuh.** `docker system df`, lalu hapus image lama: `docker image prune -f`. Arsip backup lama ada di `backups/`.
