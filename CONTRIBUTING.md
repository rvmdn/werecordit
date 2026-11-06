# Panduan Kontribusi - WeRecordIt Enterprise Studio

Terima kasih telah berkontribusi pada pengembangan **WeRecordIt Enterprise Studio** di lingkungan PT Bank Negara Indonesia (Persero) Tbk.

---

## 🌿 Alur Kerja Git & Percabangan (Branching)

1. Buat branch baru dari `main`:
   - Fitur baru: `feature/nama-fitur` (misal: `feature/video-export-mp4`)
   - Perbaikan bug: `bugfix/deskripsi-bug`
   - Skenario pengujian baru: `test/nama-modul`
2. Pastikan pesan commit mengikuti format *Conventional Commits*:
   - `feat: tambah efek spotlight kustom pada visual annotator`
   - `fix: tangani kondisi elemen tidak ditemukan pada step annotation`
   - `docs: perbarui panduan konfigurasi .env`

---

## 🛠️ Menambahkan Skenario Demo Pengujian Baru

1. Buat berkas baru di folder `tests/` dengan format penamaan:
   `tests/XX-nama-skenario.spec.ts` (contoh: `03-ap-kredit-offline.spec.ts`).
2. Gunakan fixture kustom `werecordit`:
   ```typescript
   import { test, expect } from '../src/core/werecordit';

   test('Judul Skenario Demo', async ({ page, werecordit }) => {
     werecordit.setMetadata({
       title: 'Judul Resmi Demo untuk Stakeholder',
       description: 'Penjelasan tujuan langkah pengujian.',
       module: 'MODUL-BNI'
     });

     await page.goto('/halaman-target');

     await werecordit.step({
       title: 'Langkah 1: Judul Aksi',
       description: 'Penjelasan aksi untuk penonton video.',
       target: '#elemenTarget',
       highlightColor: 'emerald', // emerald | blue | amber | red
       badge: '1',
       callout: 'Balon petunjuk untuk user',
       spotlight: true,
       snip: true
     });
   });
   ```

---

## ✅ Checklist Sebelum Membuat Pull Request (PR)

- [ ] Lolos pemeriksaan tipe data TypeScript: `npm run typecheck`
- [ ] Pengujian dan perekaman video berhasil dieksekusi: `npm test`
- [ ] Berkas rahasia/kredensial lokal (`.env`, `.auth/`) **TIDAK** ter-commit ke Git.
- [ ] Berkas video besar di `output/videos/` **TIDAK** di-commit ke Git (otomatis diatur oleh `.gitignore`).
- [ ] Dokumentasi atau komentar kode diperbarui jika ada perubahan API publik.

