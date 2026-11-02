# Website Jual Mobil Bekas

Platform jual beli mobil bekas dengan arsitektur monorepo berbasis Bun.

## Struktur Workspace

- `web/` : Frontend React + Vite
- `api/` : Backend API Hono pada Bun runtime
- `db/` : Skema & migrasi Drizzle ORM (PostgreSQL)

## Prasyarat

- [Bun](https://bun.sh) (v1.1+)
- PostgreSQL 15 lokal (sudah aktif sebagai service Windows, Docker Compose hanya untuk produksi pada T-36)

## Pemilihan Driver Database & Alasan

- **Driver:** Bun Native SQL (`drizzle-orm/bun-sql`)
- **Alasan Pemilihan:**
  1. Driver C++ bawaan Bun runtime (`import { SQL } from "bun"`), berkinerja tinggi tanpa overhead shim/layer Node.js.
  2. Didukung secara resmi oleh Drizzle ORM (`drizzle-orm/bun-sql` & migrator).
  3. Mengurangi dependensi eksternal (mengikuti prinsip minimalis dan efisiensi monorepo Bun).

## Memulai Cepat

1. Salin konfigurasi environment:

   ```bash
   cp .env.example .env
   ```

   Pastikan nilai `DATABASE_URL` diatur dengan benar:

   ```env
   DATABASE_URL=postgres://postgres:password%40example@localhost:5432/website_mobil_bekas
   ```

   _Catatan:_ Karakter khusus pada password (seperti `@`) wajib di-URL-encode (misal `@` menjadi `%40`).

2. Pasang dependensi:

   ```bash
   bun install
   ```

3. Jalankan migrasi database:

   ```bash
   bun run db:migrate
   ```

4. Jalankan server pengembangan (web & api berjalan bersamaan):
   ```bash
   bun run dev
   ```
   - Web: http://localhost:3000
   - API: http://localhost:3001
   - API Health: http://localhost:3001/api/health
   - API Database Check: http://localhost:3001/api/db-check

## Perintah Database & Drizzle

| Perintah              | Keterangan                                                         |
| --------------------- | ------------------------------------------------------------------ |
| `bun run db:generate` | Menghasilkan berkas migrasi SQL baru dari skema TypeScript         |
| `bun run db:migrate`  | Menjalankan migrasi SQL ke database PostgreSQL                     |
| `bun run db:push`     | Mendorong perubahan skema langsung ke database (skema prototyping) |
| `bun run db:studio`   | Membuka UI web Drizzle Studio untuk inspeksi database              |

## Perintah Lainnya

| Perintah            | Keterangan                                             |
| ------------------- | ------------------------------------------------------ |
| `bun run dev`       | Menjalankan frontend `web` dan backend `api` bersamaan |
| `bun run build`     | Melakukan build untuk seluruh workspace                |
| `bun run lint`      | Memeriksa format dan style kode                        |
| `bun run typecheck` | Menjalankan pemeriksaan tipe TypeScript                |
| `bun test`          | Menjalankan seluruh unit test dengan Bun               |
