#!/bin/sh
# Backup database + foto ke ./backups (BACKUP_DIR), lalu hapus arsip lebih tua
# dari BACKUP_KEEP_DAYS hari. Jalankan dari folder repo: ./scripts/backup.sh
#
# Setiap langkah dicek statusnya: dump/tar ditulis ke berkas sementara, baru
# dipindahkan menjadi arsip final setelah sukses. Kegagalan apa pun membuat
# script keluar non-zero dan tidak meninggalkan arsip kosong yang tampak valid.
# (Tidak memakai pipefail karena script berjalan di /bin/sh.)
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

TMP_DB="$DIR/.db-$STAMP.sql.tmp"
TMP_UPLOADS="$DIR/.uploads-$STAMP.tar.gz.tmp"

mkdir -p "$DIR"

cleanup() {
  rm -f "$TMP_DB" "$TMP_UPLOADS"
}
trap cleanup EXIT

echo "Backup database -> $DIR/db-$STAMP.sql.gz"
if ! docker compose exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists >"$TMP_DB"; then
  echo "GAGAL: pg_dump keluar dengan status non-zero. Backup dibatalkan." >&2
  exit 1
fi
if [ ! -s "$TMP_DB" ]; then
  echo "GAGAL: dump database kosong. Backup dibatalkan." >&2
  exit 1
fi
if ! tail -n 5 "$TMP_DB" | grep -q "PostgreSQL database dump complete"; then
  echo "GAGAL: dump database tidak lengkap (tidak ada penanda selesai). Backup dibatalkan." >&2
  exit 1
fi
if ! gzip -c "$TMP_DB" >"$DIR/db-$STAMP.sql.gz"; then
  echo "GAGAL: kompresi dump database. Backup dibatalkan." >&2
  rm -f "$DIR/db-$STAMP.sql.gz"
  exit 1
fi
rm -f "$TMP_DB"

echo "Backup foto    -> $DIR/uploads-$STAMP.tar.gz"
if ! docker compose exec -T app tar czf - -C /app uploads >"$TMP_UPLOADS"; then
  echo "GAGAL: tar isi /app/uploads. Backup dibatalkan." >&2
  rm -f "$DIR/db-$STAMP.sql.gz"
  exit 1
fi
if [ ! -s "$TMP_UPLOADS" ] || ! gzip -t "$TMP_UPLOADS" 2>/dev/null; then
  echo "GAGAL: arsip foto kosong atau rusak. Backup dibatalkan." >&2
  rm -f "$DIR/db-$STAMP.sql.gz"
  exit 1
fi
mv "$TMP_UPLOADS" "$DIR/uploads-$STAMP.tar.gz"

# Arsip lama dibersihkan; restore tetap butuh file yang masih ada.
find "$DIR" -name 'db-*.sql.gz' -mtime +"$KEEP" -delete
find "$DIR" -name 'uploads-*.tar.gz' -mtime +"$KEEP" -delete

echo "Selesai. Retensi $KEEP hari."
