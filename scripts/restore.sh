#!/bin/sh
# Restore database (dan opsional foto) dari hasil scripts/backup.sh.
#   ./scripts/restore.sh backups/db-20260101-030000.sql.gz
#   ./scripts/restore.sh backups/db-20260101-030000.sql.gz backups/uploads-20260101-030000.tar.gz
# PERINGATAN: menimpa data yang ada (dump memakai --clean --if-exists).
#
# Seperti backup.sh, setiap langkah dicek: gunzip ditulis ke berkas sementara,
# diverifikasi, baru diumpankan ke psql. Kegagalan gunzip/psql membuat script
# keluar non-zero. Tidak ada pipeline di sini, jadi `pipefail` tidak diperlukan
# dan script tetap POSIX sh.
set -eu

cd "$(dirname "$0")/.."

FILE=${1:-}
UPLOADS=${2:-}
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Pakai: $0 <berkas db-*.sql.gz> [berkas uploads-*.tar.gz]" >&2
  exit 1
fi
if [ -n "$UPLOADS" ] && [ ! -f "$UPLOADS" ]; then
  echo "Berkas uploads tidak ditemukan: $UPLOADS" >&2
  exit 1
fi

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

DB_USER=${POSTGRES_USER:-postgres}
DB_NAME=${POSTGRES_DB:-website_mobil_bekas}
TMP_SQL=$(mktemp)
TMP_TAIL=$(mktemp)
trap 'rm -f "$TMP_SQL" "$TMP_TAIL"' EXIT

echo "Memeriksa arsip $FILE..."
if ! gzip -t "$FILE" 2>/dev/null; then
  echo "GAGAL: $FILE bukan gzip yang valid." >&2
  exit 1
fi
if ! gunzip -c "$FILE" >"$TMP_SQL"; then
  echo "GAGAL: dekompresi $FILE." >&2
  exit 1
fi
if [ ! -s "$TMP_SQL" ]; then
  echo "GAGAL: dump database kosong." >&2
  exit 1
fi
if ! tail -n 5 "$TMP_SQL" >"$TMP_TAIL"; then
  echo "GAGAL: membaca ujung dump database." >&2
  exit 1
fi
if ! grep -q "PostgreSQL database dump complete" "$TMP_TAIL"; then
  echo "GAGAL: dump database tidak lengkap (tidak ada penanda selesai)." >&2
  exit 1
fi

if [ -n "$UPLOADS" ] && ! gzip -t "$UPLOADS" 2>/dev/null; then
  echo "GAGAL: $UPLOADS bukan arsip gzip yang valid." >&2
  exit 1
fi

echo "PERINGATAN: seluruh data di database '$DB_NAME' akan ditimpa oleh $FILE."
printf "Ketik 'restore' untuk melanjutkan: "
read -r JAWAB
if [ "$JAWAB" != "restore" ]; then
  echo "Dibatalkan."
  exit 1
fi

echo "Menghentikan app agar tidak ada penulisan selama restore..."
docker compose stop app

echo "Restore database..."
if ! docker compose exec -T db psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" <"$TMP_SQL"; then
  echo "GAGAL: restore database. App tetap berhenti; periksa log lalu jalankan 'docker compose start app'." >&2
  exit 1
fi

if [ -n "$UPLOADS" ]; then
  # Container sekali pakai: entrypoint diganti sh supaya migrasi tidak ikut jalan,
  # tetapi volume uploads tetap ter-mount.
  echo "Restore foto dari $UPLOADS..."
  docker compose run --rm -T --no-deps --entrypoint sh app -c 'rm -rf /app/uploads'
  docker compose run --rm -T --no-deps --entrypoint sh app -c 'tar xzf - -C /app' <"$UPLOADS"
fi

echo "Menyalakan app (entrypoint menjalankan migrasi, termasuk yang belum ada di backup)..."
docker compose start app

echo "Restore selesai."
