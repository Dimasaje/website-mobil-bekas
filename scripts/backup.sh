#!/bin/sh
# Backup database + foto ke ./backups (BACKUP_DIR), lalu hapus arsip lebih tua
# dari BACKUP_KEEP_DAYS hari. Jalankan dari folder repo: ./scripts/backup.sh
set -eu

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

DIR=${BACKUP_DIR:-./backups}
KEEP=${BACKUP_KEEP_DAYS:-14}
DB_USER=${POSTGRES_USER:-postgres}
DB_NAME=${POSTGRES_DB:-website_mobil_bekas}
STAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$DIR"

echo "Backup database -> $DIR/db-$STAMP.sql.gz"
docker compose exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists |
  gzip >"$DIR/db-$STAMP.sql.gz"

echo "Backup foto    -> $DIR/uploads-$STAMP.tar.gz"
docker compose exec -T app tar czf - -C /app uploads >"$DIR/uploads-$STAMP.tar.gz"

# Arsip lama dibersihkan; restore tetap butuh file yang masih ada.
find "$DIR" -name 'db-*.sql.gz' -mtime +"$KEEP" -delete
find "$DIR" -name 'uploads-*.tar.gz' -mtime +"$KEEP" -delete

echo "Selesai. Retensi $KEEP hari."
