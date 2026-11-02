#!/bin/sh
# Dijalankan sebagai ENTRYPOINT container app. Migrasi selalu dijalankan agar
# rilis baru tidak perlu langkah manual; seed hanya bila SEED_ON_START=true
# (dipakai sekali saat instalasi awal untuk membuat admin dari ADMIN_*).
set -eu

echo "Menjalankan migrasi database..."
bun run db:migrate

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "Menjalankan seed data awal..."
  bun run db:seed
fi

exec "$@"
