# Website Jual Mobil Bekas

Platform jual beli mobil bekas dengan arsitektur monorepo berbasis Bun.

## Struktur Workspace

- `web/` : Frontend React + Vite
- `api/` : Backend API Hono pada Bun runtime
- `db/` : Skema & migrasi Drizzle ORM (PostgreSQL)

## Prasyarat

- [Bun](https://bun.sh) (v1.1+)
- PostgreSQL 15 lokal

## Memulai Cepat

1. Salin konfigurasi environment:

   ```bash
   cp .env.example .env
   ```

   Sesuaikan `DATABASE_URL` jika password menggunakan karakter khusus (wajib di-URL-encode).

2. Pasang dependensi:

   ```bash
   bun install
   ```

3. Jalankan server pengembangan (web & api berjalan bersamaan):
   ```bash
   bun run dev
   ```
   - Web: http://localhost:3000
   - API: http://localhost:3001 (Health check: http://localhost:3001/api/health)

## Perintah Tersedia

| Perintah            | Keterangan                                             |
| ------------------- | ------------------------------------------------------ |
| `bun run dev`       | Menjalankan frontend `web` dan backend `api` bersamaan |
| `bun run build`     | Melakukan build untuk seluruh workspace                |
| `bun run lint`      | Memeriksa format dan style kode                        |
| `bun run typecheck` | Menjalankan pemeriksaan tipe TypeScript                |
| `bun test`          | Menjalankan seluruh unit test dengan Bun               |
