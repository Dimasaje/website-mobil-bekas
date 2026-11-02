# Arsitektur Pengelolaan & Penyimpanan Foto

Dokumentasi implementasi modul upload dan pengolahan gambar mobil bekas (Issue #13).

---

## 1. Pustaka Pengolahan Gambar: Sharp (`sharp`)

Pustaka yang digunakan adalah **Sharp** (`sharp@0.35.5`).

### Alasan Pemilihan:

1. **Performa Tinggi**: Dibangun di atas pustaka C++ `libvips`, 4-8x lebih cepat daripada ImageMagick atau GraphicsMagick.
2. **Efisiensi Memori**: Mendukung streaming dan manajemen buffer hemat memori, ideal untuk server VPS maupun container ringan.
3. **Kompresi WebP Native**: Mengompres gambar ke format WebP berkualitas tinggi (default quality 80) yang mengurangi ukuran file hingga 60-80% dibanding JPEG/PNG asli tanpa degradasi visual material.
4. **Kompatibilitas Penuh dengan Bun**: Berjalan lancar di runtime Bun v1.4+ baik pada platform Windows maupun Linux (CI container).

---

## 2. Varian Ukuran Gambar

Setiap foto yang diunggah diproses menjadi 3 varian:

- **Large** (`-large.webp`): Maksimal lebar 1600px, quality 80 — untuk tampilan detail foto & lightbox modal.
- **Medium** (`-medium.webp`): Maksimal lebar 800px, quality 80 — untuk tampilan kartu listing mobil pada katalog dan beranda.
- **Thumb** (`-thumb.webp`): Maksimal lebar 400px, quality 80 — untuk thumbnail pratinjau galeri dan tabel manajemen admin.

---

## 3. Lapisan Abstraksi Penyimpanan (`StorageDriver`)

Penyimpanan dirancang dengan pola _Adapter / Storage Driver_ melalui antarmuka:

```ts
export interface StorageDriver {
  save(
    key: string,
    buffer: Buffer | Uint8Array,
    contentType: string,
  ): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
```

- **Implementasi Default**: `LocalStorageDriver` menyimpan berkas ke volume direktori lokal (`uploads/cars/{carId}/`).
- **Skalabilitas**: Di masa depan dapat diganti dengan `S3StorageDriver` (Cloudflare R2, AWS S3, atau MinIO) tanpa mengubah kode bisnis di controller/route.

---

## 4. Serving & HTTP Caching

Berkas statis diakses melalui endpoint:
`GET /uploads/*`

Header caching yang disertakan:

```http
Cache-Control: public, max-age=31536000, immutable
Content-Type: image/webp
```

Hal ini memastikan browser dan CDN menyimpan cache berkas gambar secara permanen (1 tahun).

---

## 5. Fitur Pengelolaan Foto (Khusus Admin)

1. **Upload**: `POST /api/admin/cars/:carId/photos` (mendukung unggah satu atau banyak file sekaligus, foto pertama otomatis jadi primer jika belum ada).
2. **Atur Urutan**: `PUT /api/admin/cars/:carId/photos/reorder` (menetapkan nilai integer `order`).
3. **Pilih Foto Utama**: `PATCH /api/admin/cars/:carId/photos/:photoId/primary` (menetapkan `is_primary = true` dan mengosongkan foto primer sebelumnya).
4. **Hapus Foto**: `DELETE /api/admin/cars/:carId/photos/:photoId` (menghapus record dari database serta membersihkan seluruh file varian dari penyimpanan lokal. Jika foto yang dihapus adalah foto utama, foto berikutnya otomatis dipromosikan).
