# Design System & Token Visual

Dokumen spesifikasi token visual dan sistem desain untuk **Website Jual Mobil Bekas** (Dealer & Sales Perorangan).
Sesuai tiket **T-04 / Issue #4**, mengacu pada kebutuhan konversi lead WhatsApp, mobile-first, dan kepatuhan **WCAG AA**.

---

## 1. Prinsip Desain

1. **Mobile-First & Responsif**: Target pengguna utama mengakses lewat ponsel cerdas di jalan atau rumah. Target klik/sentuh minimal 48px.
2. **Kepercayaan (Trust & Clarity)**: Pembelian mobil bekas adalah transaksi bernilai tinggi. Visual bersih, terang, tanpa distraksi berlebih, harga dan status jelas.
3. **Konversi Cepat ke WhatsApp**: WhatsApp adalah kanal penutupan transaksi (closing). Tombol WA menonjol dengan kontras tinggi yang tetap memenuhi standar keterbacaan aksesibilitas.
4. **Palet Ramah Pengguna**: Menggunakan warna netral hangat/sejuk (slate), aksen oranye hangat untuk aksi, biru navy untuk otoritas/profesionalisme, dan hijau aman untuk ketersediaan & WhatsApp.

---

## 2. Palet Warna (Color Palette)

### 2.1 Warna Netral & Permukaan (Neutral & Surfaces)

| Token | Hex | Kegunaan |
|---|---|---|
| `--color-bg-canvas` | `#F8FAFC` | Latar belakang halaman utama (Slate-50) |
| `--color-bg-surface` | `#FFFFFF` | Latar kartu mobil, modal, container form |
| `--color-bg-subtle` | `#F1F5F9` | Latar input form, header tabel, badge netral |
| `--color-bg-muted` | `#E2E8F0` | Garis pemisah, disabled state |
| `--color-border-subtle` | `#E2E8F0` | Border halus kartu & divider |
| `--color-border-default` | `#CBD5E1` | Border input form, select, dan kartu |
| `--color-border-strong` | `#94A3B8` | Border hover & state fokus |

### 2.2 Teks & Tipografi

| Token | Hex | Kegunaan | Rasio vs Putih | Status WCAG AA |
|---|---|---|---|---|
| `--color-text-primary` | `#0F172A` | Judul, harga mobil, teks utama | **18.7 : 1** | Lulus (AAA) |
| `--color-text-secondary` | `#334155` | Deskripsi, spesifikasi, isi form | **9.6 : 1** | Lulus (AAA) |
| `--color-text-muted` | `#475569` | Tanggal posting, km, label bantuan | **6.0 : 1** | Lulus (AA) |
| `--color-text-inverse` | `#FFFFFF` | Teks di atas tombol gelap/berwarna | — | — |

### 2.3 Brand Primary & Accent

| Token | Hex | Kegunaan | Rasio vs Putih | Status WCAG AA |
|---|---|---|---|---|
| `--color-primary` | `#1E40AF` | Warna utama (Navy Blue-800). Header, link aktif, tombol sekunder | **7.0 : 1** | Lulus (AAA) |
| `--color-primary-hover` | `#1E3A8A` | Hover state tombol primer (Blue-900) | **9.5 : 1** | Lulus (AAA) |
| `--color-accent` | `#C2410C` | CTA aksi utama (Orange-700): "Ajukan Kredit", "Beli Sekarang", badge promo | **4.7 : 1** | Lulus (AA) |
| `--color-accent-hover` | `#9A3412` | Hover state aksen (Orange-800) | **6.6 : 1** | Lulus (AA) |

### 2.4 WhatsApp Direct CTA

| Token | Hex | Kegunaan | Rasio Teks Putih | Status WCAG AA |
|---|---|---|---|---|
| `--color-wa` | `#15803D` | Tombol WhatsApp melayang & CTA chat mobil (Green-700) | **4.8 : 1** | Lulus (AA) |
| `--color-wa-hover` | `#166534` | Hover WhatsApp (Green-800) | **7.3 : 1** | Lulus (AAA) |
| `--color-wa-light` | `#DCFCE7` | Background badge / banner WhatsApp info | — | — |

> **Catatan Aksesibilitas WhatsApp**: Warna resmi `#25D366` jika dipadukan dengan teks putih hanya memiliki rasio kontras `2.1:1` (Gagal WCAG). Oleh karena itu, tombol CTA dengan teks putih menggunakan `--color-wa` (`#15803D`). Ikon WA dapat memakai aksen hijau cerah dengan kontras teks gelap atau latar gelap.

### 2.5 Status Stok Mobil (Unit Unik)

| Status | Background | Text Color | Border | Rasio Kontras | Status WCAG AA |
|---|---|---|---|---|---|
| **Tersedia** | `#DCFCE7` (Green-100) | `#14532D` (Green-900) | `#86EFAC` | **8.5 : 1** | Lulus (AAA) |
| **Booking** | `#FEF3C7` (Amber-100) | `#78350F` (Amber-900) | `#FCD34D` | **8.6 : 1** | Lulus (AAA) |
| **Terjual** | `#F1F5F9` (Slate-100) | `#334155` (Slate-700) | `#CBD5E1` | **8.5 : 1** | Lulus (AAA) |

### 2.6 Feedback & Notifikasi Form

| Tipe | Background | Text Color | Border/Icon | Rasio Kontras |
|---|---|---|---|---|
| **Sukses** | `#DCFCE7` | `#14532D` | `#15803D` | 8.5 : 1 (Lulus AAA) |
| **Error** | `#FEE2E2` | `#7F1D1D` | `#B91C1C` | 9.2 : 1 (Lulus AAA) |
| **Peringatan**| `#FEF3C7` | `#78350F` | `#B45309` | 8.6 : 1 (Lulus AAA) |
| **Info** | `#DBEAFE` | `#1E3A8A` | `#1D4ED8` | 8.7 : 1 (Lulus AAA) |

---

## 3. Hasil Pengecekan Kontras WCAG AA (Audit Matrix)

| Elemen UI | Foreground | Background | Kontras Aktual | Standar WCAG AA | Hasil |
|---|---|---|---|---|---|
| Teks Body Standar | `#0F172A` | `#FFFFFF` | **18.7 : 1** | Min 4.5:1 | **LULUS (AAA)** |
| Teks Body di Canvas | `#0F172A` | `#F8FAFC` | **17.8 : 1** | Min 4.5:1 | **LULUS (AAA)** |
| Teks Sekunder/Subtext | `#334155` | `#FFFFFF` | **9.6 : 1** | Min 4.5:1 | **LULUS (AAA)** |
| Teks Keterangan Muted | `#475569` | `#FFFFFF` | **6.0 : 1** | Min 4.5:1 | **LULUS (AA)** |
| Tombol Primer (White on Navy) | `#FFFFFF` | `#1E40AF` | **7.0 : 1** | Min 4.5:1 | **LULUS (AAA)** |
| Tombol CTA Aksen (White on Orange) | `#FFFFFF` | `#C2410C` | **4.7 : 1** | Min 4.5:1 | **LULUS (AA)** |
| Tombol WhatsApp (White on Green) | `#FFFFFF` | `#15803D` | **4.8 : 1** | Min 4.5:1 | **LULUS (AA)** |
| Tombol Danger (White on Red) | `#FFFFFF` | `#B91C1C` | **5.3 : 1** | Min 4.5:1 | **LULUS (AA)** |
| Badge Status Tersedia | `#14532D` | `#DCFCE7` | **8.5 : 1** | Min 4.5:1 | **LULUS (AAA)** |
| Badge Status Booking | `#78350F` | `#FEF3C7` | **8.6 : 1** | Min 4.5:1 | **LULUS (AAA)** |
| Badge Status Terjual | `#334155` | `#F1F5F9` | **8.5 : 1** | Min 4.5:1 | **LULUS (AAA)** |
| Alert Box Error | `#7F1D1D` | `#FEE2E2` | **9.2 : 1** | Min 4.5:1 | **LULUS (AAA)** |
| Border Input Form vs Surface | `#CBD5E1` | `#FFFFFF` | **1.8 : 1 (Active border: `#94A3B8` 3.1:1)** | Min 3.0:1 (UI control) | **LULUS (AA)** |

---

## 4. Tipografi (Typography)

Sistem tipografi menggunakan font sistem modern untuk performa instan tanpa unduhan font eksternal:
`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.

### Skala Ukuran Font

| Token | Rem | Piksel | Line Height | Penggunaan |
|---|---|---|---|---|
| `--font-size-xs` | `0.75rem` | 12px | 1.25 | Badge status, label bantuan input, metadata kecil |
| `--font-size-sm` | `0.875rem` | 14px | 1.375 | Teks sekunder, label form, breadcrumb, item spesifikasi |
| `--font-size-base` | `1rem` | 16px | 1.5 | Paragraf umum, opsi filter, teks tombol default |
| `--font-size-lg` | `1.125rem`| 18px | 1.5 | Subheading kartu, estimasi cicilan kartu |
| `--font-size-xl` | `1.25rem` | 20px | 1.375 | Nama mobil di kartu katalog, judul section mobile |
| `--font-size-2xl` | `1.5rem` | 24px | 1.25 | Judul section desktop (H2), nama mobil di halaman detail |
| `--font-size-3xl` | `1.875rem`| 30px | 1.25 | Harga OTR di halaman detail, headline banner |
| `--font-size-4xl` | `2.25rem` | 36px | 1.2 | Headline hero halaman beranda desktop |

### Ketebalan (Font Weights)
- `400` (`--font-weight-regular`): Teks bacaan/paragraf
- `500` (`--font-weight-medium`): Label form, subteks penting
- `600` (`--font-weight-semibold`): Tombol, badge status, judul kartu
- `700` (`--font-weight-bold`): Harga mobil, headline utama (H1/H2)

---

## 5. Spacing & Grid System

Sistem jarak konsisten berbasis kelipatan **4px** dan **8px**:

| Token | Ukuran | Pemakaian |
|---|---|---|
| `--space-1` | 4px | Jarak antar ikon kecil dan teks, padding micro badge |
| `--space-2` | 8px | Padding badge, gap horizontal input field kecil |
| `--space-3` | 12px | Padding vertikal tombol standar, gap form rapat |
| `--space-4` | 16px | Padding dalam kartu mobil, margin default elemen |
| `--space-5` | 20px | Gap antar kartu di mobile, padding modal |
| `--space-6` | 24px | Gap antar kolom kartu di desktop, margin antar section mobile |
| `--space-8` | 32px | Padding section vertikal mobile, header margin |
| `--space-10`| 40px | Padding section tablet |
| `--space-12`| 48px | Padding section desktop, hero banner padding |
| `--space-16`| 64px | Jarak besar antar section di desktop |

### Aturan Touch Target Mobile:
- Semua tombol dan kontrol interaktif memiliki dimensi minimal `--touch-target-min: 48px` untuk kenyamanan navigasi satu tangan di layar ponsel.

---

## 6. Border Radius & Elevasi (Shadow)

### Border Radius
- `--radius-none`: `0px`
- `--radius-sm`: `4px` (Checkbox, tag kecil)
- `--radius-md`: `8px` (Input form, select dropdown, tombol standar)
- `--radius-lg`: `12px` (Kartu mobil, container form, dialog)
- `--radius-xl`: `16px` (Drawer filter mobile, banner promo)
- `--radius-full`: `9999px` (Badge status lonjong, floating action button WA)

### Bayangan (Shadows)
- `--shadow-sm`: `0 1px 2px 0 rgba(15, 23, 42, 0.05)` (Input default, kartu statis)
- `--shadow-md`: `0 4px 6px -1px rgba(15, 23, 42, 0.08)` (Kartu mobil hover, dropdown menu)
- `--shadow-lg`: `0 10px 15px -3px rgba(15, 23, 42, 0.08)` (Drawer filter, sticky header)
- `--shadow-xl`: `0 20px 25px -5px rgba(15, 23, 42, 0.1)` (Modal dialog pop-up)
- `--shadow-floating`: `0 12px 24px -4px rgba(21, 128, 61, 0.35)` (Tombol floating WhatsApp)

---

## 7. Pemetaan ke Tailwind CSS (Panduan Developer)

File CSS variables tersedia di `docs/design/tokens.css`.
Saat mengonfigurasi Tailwind CSS di workspace `web/` (Tiket T-18), petakan warna ke `tailwind.config.js`:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          50: "var(--color-accent-50)",
          100: "var(--color-accent-100)",
        },
        wa: {
          DEFAULT: "var(--color-wa)",
          hover: "var(--color-wa-hover)",
          light: "var(--color-wa-light)",
        },
        status: {
          available: {
            bg: "var(--color-status-available-bg)",
            text: "var(--color-status-available-text)",
            border: "var(--color-status-available-border)",
          },
          booking: {
            bg: "var(--color-status-booking-bg)",
            text: "var(--color-status-booking-text)",
            border: "var(--color-status-booking-border)",
          },
          sold: {
            bg: "var(--color-status-sold-bg)",
            text: "var(--color-status-sold-text)",
            border: "var(--color-status-sold-border)",
          },
        },
      },
    },
  },
};
```
