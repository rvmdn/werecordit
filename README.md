# 🎬 WeRecordIt Enterprise Studio v1.0 - Automation Testing, Snipping Tools & Video Demo Suite

**WeRecordIt** adalah perangkat lunak otomasi pengujian, perekam video demo pengguna (*user walkthrough demo*), dan simulator tangkapan layar cerdas (*snipping tools*) yang dirancang khusus untuk ekosistem pengujian aplikasi perbankan **PT Bank Negara Indonesia (Persero) Tbk**.

Jika **WeDocIt** berfokus pada produksi dokumen resmi pengujian (**Word EDV / PDF BNI**), maka **WeRecordIt** melengkapinya dengan menghasilkan **Video Demo Interaktif** dan **Galeri Cuplikan Gambar Anotasi (Snipping Tools)** siap tayang untuk *Product Owner*, *Auditor*, *End-User*, maupun *Stakeholder UAT*.

---

## 🌟 Fitur Utama

### 1. 🎥 Perekaman Video Demo Otomatis untuk User (Walkthrough Demo)
- **Kursor Virtual & Ripple Klik**: Menggerakkan kursor visual secara halus dan memberikan efek gelombang sentuhan (*click ripple*) pada tombol yang diklik, sehingga alur demo terlihat natural seperti dipandu manusia.
- **Dynamic HUD Action Banner (Subtitle Layar)**: Menampilkan banner elegan di bagian bawah layar saat video berjalan yang memuat nomor langkah, judul aksi, dan deskripsi instruksi.
- **Format Video Berkualitas Tinggi**: Merekam langsung dalam resolusi standar 720p HD (`.webm`) yang dapat langsung diputar di browser tanpa perlu plugin tambahan.

### 2. ✂️ Simulator Cerdas Snipping Tool (Visual Annotations)
- **Element Cropping & Framing**: Mengambil potongan gambar spesifik elemen sasaran (tabel, tombol modal, formulir input) secara presisi dengan padding yang pas.
- **Sorotan Warna-Warni (Highlight Glow)**:
  - 🟢 **Emerald**: Untuk aksi validasi, tombol konfirmasi, dan status berhasil.
  - 🔵 **Blue**: Untuk navigasi menu, header, dan link referensi.
  - 🟡 **Amber**: Untuk input data formulir, pencarian filter, dan peringatan.
  - 🔴 **Red**: Untuk penolakan, aksi berbahaya, atau indikator kesalahan.
- **Lencana Urutan Langkah (Step Badge)**: Menempelkan pin nomor langkah bulat (①, ②, ③, ④) tepat di atas elemen target.
- **Balon Petunjuk (Callout Tooltip)**: Menampilkan balon teks interaktif dengan arah panah yang menjelaskan fungsi tombol kepada pengguna awam (contoh: *"👉 Klik [Setujui Evidens] di sini"*).
- **Efek Spotlight (Dimming Backdrop)**: Meredupkan area latar belakang layar agar fokus pandangan tertuju tajam ke elemen yang sedang diuji.

### 3. 🖥️ WeRecordIt Studio Desktop Dashboard
- **Pemutar Video Interaktif dengan Chapter Marks**: Timeline langkah yang tersinkronisasi dengan pemutaran video. Klik kartu langkah mana pun untuk langsung melompat (*seek*) ke detik kejadian di dalam video.
- **Galeri Evidens Snipping Tool**: Kisi cuplikan evidens resolusi tinggi lengkap dengan modal pembesar gambar (*Lightbox Zoom*) dan tombol unduh.
- **Playwright Test Runner 1-Klik**: Eksekusi pengujian otomasi dan perekaman video langsung dari tombol antarmuka Studio dengan pemantauan log konsol real-time.

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### 1. Menjalankan WeRecordIt Studio
Cukup **klik dua kali** berkas launcher:
```bat
launch-werecordit.bat
```
Atau melalui terminal:
```bash
npm start
```
> Antarmuka Studio akan otomatis terbuka di browser pada alamat `http://127.0.0.1:4500`.

### 2. Menjalankan Perekaman Demo via CLI
```bash
# Jalankan seluruh skenario demo pengujian
npm test

# Jalankan hanya demo alur audit AMS FAST
npm run demo

# Jalankan demo otentikasi login SSO
npm run demo:login
```

---

## 💻 Contoh Penulisan Skenario Pengujian

Gunakan fixture kustom `werecordit` untuk menggabungkan assertion pengujian dengan perekaman video dan cuplikan snipping tool:

```typescript
import { test, expect } from '../src/core/werecordit';

test('Demo Alur Verifikasi Program Audit', async ({ page, werecordit }) => {
  werecordit.setMetadata({
    title: 'Demo Panduan Verifikasi Kas BNI AMS',
    description: 'Panduan langkah persetujuan hasil audit teller.',
    module: 'AMS-FAST-OFFLINE'
  });

  await page.goto('https://amsfast-dev.bni.co.id/audit');

  // Langkah 1: Sorot Filter dengan Spotlight & Balon Petunjuk
  await werecordit.step({
    title: 'Pilih Wilayah Kerja',
    description: 'Auditor memilih wilayah unit kerja Jakarta Senayan.',
    target: '#selectWilayah',
    highlightColor: 'amber',
    badge: '1',
    spotlight: true,
    callout: 'Pilih Wilayah 10 di sini',
    snip: true
  });

  // Langkah 2: Klik Tombol dengan Kursor Halus & Ripple
  await werecordit.step({
    title: 'Jalankan Pencarian Data',
    description: 'Menekan tombol Cari Program Pengujian.',
    target: '#btnSearch',
    highlightColor: 'emerald',
    badge: '2',
    cursorClick: true,
    action: async () => {
      await page.click('#btnSearch');
    }
  });

  // Langkah 3: Verifikasi Status dengan Snipping Tool Crop
  await werecordit.step({
    title: 'Verifikasi Status Tervalidasi',
    description: 'Memastikan lembar kerja berstatus TERSETUJUI.',
    target: '#statusBadge',
    highlightColor: 'emerald',
    badge: '3',
    snip: true
  });

  await expect(page.locator('#statusBadge')).toHaveText('TERSETUJUI');
});
```

---

## 📁 Struktur Direktori

```
werecordit/
├── launch-werecordit.bat       # Launcher 1-klik WeRecordIt Studio
├── package.json               # Konfigurasi dependensi (@playwright/test, express)
├── playwright.config.ts       # Konfigurasi Playwright (video: on, 720p HD, msedge)
├── output/
│   ├── manifest.json          # Katalog data skenario, timeline detik, dan evidens
│   ├── videos/                # Berkas rekaman video demo (.webm)
│   └── snips/                 # Cuplikan gambar snipping tool (.png beranotasi)
├── src/
│   ├── core/
│   │   ├── annotator.ts       # Script injeksi visual (HUD, spotlight, badge, callout, cursor)
│   │   └── werecordit.ts      # Playwright custom fixture & recorder controller
│   ├── reporters/
│   │   └── werecordit-reporter.ts # Reporter kustom Playwright pembuat manifest & video catalog
│   └── studio/
│       ├── server.js          # Backend server Express lokal
│       └── public/            # Antarmuka web Studio (Video Player, Chapters, Snip Lightbox)
└── tests/
    ├── 01-demo-ams-audit-flow.spec.ts  # Demo lengkap AMS FAST Audit (7 Langkah)
    └── 02-demo-login-security.spec.ts  # Demo login SSO BNI & validasi input (5 Langkah)
```

---

## ⚙️ Konfigurasi Lingkungan (`.env`)

WeRecordIt mendukung penyesuaian parameter tanpa mengubah kode program melalui berkas `.env` (salin dari `.env.example`):

```bash
# Port & Host Studio Server
PORT=4500
HOST=127.0.0.1

# URL Target Aplikasi (Default mengarah ke mock portal jika dikosongkan)
APP_BASE_URL=https://amsfast-dev.bni.co.id:8081

# Browser Channel (msedge, chrome, atau chromium)
BROWSER_CHANNEL=msedge

# Resolusi Video Demo & Viewport
VIDEO_WIDTH=1280
VIDEO_HEIGHT=720

# Kredensial Pengujian Otomasi
TEST_USER=98124
TEST_PASSWORD=P@ssw0rdBNI2026!

# Direktori Output
WERECORDIT_OUTPUT_DIR=output
WERECORDIT_VIDEOS_DIR=output/videos
WERECORDIT_SNIPS_DIR=output/snips
```

---

## 🤝 Sinergi dengan WeDocIt

| Fitur | WeDocIt (`D:\BNI\Tools\wedocit`) | WeRecordIt (`D:\BNI\Tools\werecordit`) |
| :--- | :--- | :--- |
| **Output Utama** | Dokumen Word (`.docx`) & PDF resmi EDV BNI | Video Walkthrough (`.webm`) & Cuplikan Snip (`.png`) |
| **Target Audiens** | Tim Kepatuhan Audit, ADV, Rilis Produksi | End-User, Auditor Lapangan, Product Owner, UAT |
| **Gaya Evidens** | Screenshot full-page pada tabel dokumen | Cuplikan Snipping beranotasi balon & nomor langkah |
| **Perekaman Video** | Dinonaktifkan (`video: 'off'`) | Penuh (`video: 'on'` HD 720p + HUD subtitle) |
| **Pemutar Interaktif**| Reviewer dokumen desktop | Studio Player dengan Timeline Chapters loncat per-detik |

