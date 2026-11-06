# 📋 Changelog - WeRecordIt Enterprise Studio

Semua pembaruan, perubahan, dan riwayat rilis pada proyek **WeRecordIt Enterprise Studio** dicatat secara berkala dalam dokumen ini.

Format pencatatan mengacu pada panduan [Keep a Changelog](https://keepachangelog.com/id/1.0.0/) dan menganut prinsip [Semantic Versioning (SemVer)](https://semver.org/).

---

## 📌 Standar Penomoran Versi (`v1.x.y`)

> **Format:** `v1.x.y`
> - **`x` (Perubahan Fitur/Minor):** Naik `+1` (`v1.(x+1).0`) jika terdapat penambahan fitur perekaman baru, modul annotator baru, integrasi portal baru, atau upgrade arsitektur besar.
> - **`y` (Perbaikan/Patch):** Naik `+1` (`v1.x.(y+1)`) untuk perbaikan bug (*bugfix*), perbaikan styling antarmuka UI, optimasi script launcher, atau penyesuaian konfigurasi kecil.

---

## [Unreleased] - Rencana Pembaruan Mendatang
### Planned
- **MP4 Direct Transcoder**: Dukungan konversi otomatis WebM ke format MP4 native untuk kompatibilitas pemutar video Windows lawas.
- **AI Voice Narration (TTS)**: Opsi penambahan narasi suara berbahasa Indonesia pada video demo berdasarkan deskripsi langkah pengujian.
- **Direct WeDocIt Integration**: Tombol 1-klik untuk menyinkronkan cuplikan evidens beranotasi WeRecordIt langsung ke generator Word EDV BNI di WeDocIt.

---

## [v1.0.0] - 2026-11-06
### Initial Enterprise Release

#### Added
- **🎥 Playwright Automated Video Recording Engine**:
  - Perekaman video walkthrough demo beresolusi 720p HD (`.webm`) secara otomatis saat skenario pengujian dieksekusi.
  - Dukungan multi-channel browser: Microsoft Edge (`msedge`), Google Chrome (`chrome`), dan Chromium.
- **✂️ Visual In-Page Annotator (`src/core/annotator.ts`)**:
  - **Dynamic HUD Action Banner**: Banner subtitle mengambang di bawah layar dengan efek kaca (*backdrop blur*) yang memuat nomor langkah, judul, dan deskripsi aksi.
  - **Step Badges (①, ②, ③)**: Pin nomor urut langkah bulat dengan penempatan otomatis di atas elemen yang sedang diuji.
  - **Callout Speech Bubble**: Balon petunjuk instruksi dengan pendeteksian posisi cerdas (otomatis pindah ke bawah jika elemen berada di tepi atas layar agar tidak terpotong).
  - **Spotlight Dimming**: Latar belakang layar meredup agar pandangan penonton video fokus ke elemen target.
  - **Virtual Cursor & Click Ripple**: Kursor mouse visual yang bergerak halus disertai efek gelombang klik sentuhan.
- **📸 Smart Snipping Tools (`src/core/werecordit.ts`)**:
  - Kemampuan crop spesifik elemen target atau tangkapan layar penuh dengan seluruh anotasi visual tersimpan rapi dalam format `.png` di `output/snips/`.
- **📊 Smart Catalog Reporter (`src/reporters/werecordit-reporter.ts`)**:
  - Reporter kustom Playwright yang otomatis mencatat linimasa detik (*timestamps*) per langkah skenario.
  - **Smart Merge Manifest**: Mempertahankan katalog video lama saat menjalankan skenario pengujian parsial sehingga daftar demo tidak terhapus.
- **🖥️ WeRecordIt Studio Desktop Dashboard (`src/studio/`)**:
  - **Pemutar Video & Timeline Bab (Chapters)**: Pengguna dapat mengklik kartu langkah untuk langsung melompat (*seek*) ke detik kejadian di dalam video.
  - **Galeri Evidens Snipping Tool**: Kisi cuplikan tangkapan layar lengkap dengan modal pembesar (*Lightbox Zoom*) dan tombol unduh.
  - **Runner Konsol 1-Klik**: Menjalankan skenario dari UI dengan streaming output terminal real-time.
  - **Embedded Enterprise Dark Theme**: Antarmuka responsif tanpa ketergantungan internet eksternal font CDN.
- **🚀 1-Click Desktop Launchers**:
  - Berkas [`launch-werecordit.bat`](file:///D:/BNI/Tools/werecordit/launch-werecordit.bat) & [`launch-werecordit.ps1`](file:///D:/BNI/Tools/werecordit/launch-werecordit.ps1) dengan deteksi multi-path browser Edge/Chrome.
  - Berkas pembuat shortcut Desktop [`create-shortcut.ps1`](file:///D:/BNI/Tools/werecordit/create-shortcut.ps1) berbasis path dinamis (`$PSScriptRoot`).
- **🛡️ Enterprise Security & Governance**:
  - Berkas [`.gitignore`](file:///D:/BNI/Tools/werecordit/.gitignore) ketat untuk mencegah kebocoran kredensial dan menjaga repository tetap ramping dari file video besar.
  - Berkas konfigurasi [`.env.example`](file:///D:/BNI/Tools/werecordit/.env.example) dengan parser mandiri tanpa dependensi pihak ketiga.
  - Otomasi CI/CD via [`.github/workflows/ci.yml`](file:///D:/BNI/Tools/werecordit/.github/workflows/ci.yml) (Matrix Node 18, 20, 22).
  - Penegakan tipe data ketat TypeScript via [`tsconfig.json`](file:///D:/BNI/Tools/werecordit/tsconfig.json) (100% Typecheck passed).
  - Dokumen lisensi resmi [`LICENSE`](file:///D:/BNI/Tools/werecordit/LICENSE) dan panduan kontribusi tim [`CONTRIBUTING.md`](file:///D:/BNI/Tools/werecordit/CONTRIBUTING.md).
- **🧪 Ready-to-Use Demo Scenarios**:
  - `tests/01-demo-ams-audit-flow.spec.ts`: Alur pengujian verifikasi audit non-kredit AMS FAST (7 Langkah).
  - `tests/02-demo-login-security.spec.ts`: Alur otentikasi Single Sign-On dan validasi password BNI (5 Langkah).
  - Mock Portal Mandiri: `src/studio/public/mock-bni-portal.html`.
