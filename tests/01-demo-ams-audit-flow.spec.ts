import { test, expect } from '../src/core/werecordit';
import * as path from 'path';

test('Demo Alur Verifikasi Audit Non-Kredit BNI', async ({ page, werecordit }) => {
  werecordit.setMetadata({
    title: 'Demo Panduan Verifikasi Audit Kas BNI AMS FAST',
    description: 'Panduan visual langkah demi langkah untuk verifikasi dan persetujuan lembar kerja audit kas teller.',
    author: 'ADV / QA Automation Team',
    module: 'AMS-FAST-AUDIT-OFFLINE'
  });

  // Fleksibel: mendukung live URL portal BNI atau lokal mock portal
  const localMockPath = path.resolve(__dirname, '../src/studio/public/mock-bni-portal.html').replace(/\\/g, '/');
  const targetUrl = process.env.APP_BASE_URL || `file:///${localMockPath}`;
  await page.goto(targetUrl);
  await werecordit.sleep(1000);

  // Langkah 1: Akses Halaman
  await werecordit.step({
    title: 'Akses Portal Audit Offline',
    description: 'Pengguna membuka dashboard Pelaksanaan Audit Non-Kredit BNI AMS FAST.',
    target: '.bni-navbar',
    highlightColor: 'blue',
    badge: '1',
    callout: 'Sesi Auditor FASTIA25 Aktif',
    snip: true
  });

  // Langkah 2: Atur Filter Pencarian
  await werecordit.step({
    title: 'Pilih Wilayah & Filter Unit',
    description: 'Auditor memilih wilayah unit kerja Jakarta Senayan dan nomor referensi program.',
    target: '#filterCard',
    highlightColor: 'amber',
    badge: '2',
    spotlight: true,
    callout: 'Pastikan filter terisi sesuai penugasan',
    snip: true
  });

  // Langkah 3: Klik Cari
  await werecordit.step({
    title: 'Tampilkan Program Pengujian',
    description: 'Menekan tombol Tampilkan Program untuk memuat lembar kerja audit.',
    target: '#btnSearch',
    highlightColor: 'emerald',
    badge: '3',
    cursorClick: true,
    action: async () => {
      await page.click('#btnSearch');
    }
  });

  // Langkah 4: Pilih Baris Audit
  await werecordit.step({
    title: 'Pemeriksaan Baris Kas Petty Cash',
    description: 'Memeriksa detail nomor referensi AP-NK-001 dengan status DRAFT.',
    target: '#row-1',
    highlightColor: 'emerald',
    badge: '4',
    callout: 'Status awal: DRAFT',
    snip: true
  });

  // Langkah 5: Buka Modal Verifikasi
  await werecordit.step({
    title: 'Klik Tombol Verifikasi',
    description: 'Membuka lembar konfirmasi dan persetujuan temuan audit kas.',
    target: '#btnDetail-1',
    highlightColor: 'blue',
    badge: '5',
    cursorClick: true,
    action: async () => {
      await page.click('#btnDetail-1');
    }
  });

  // Langkah 6: Konfirmasi Persetujuan di Modal
  await werecordit.step({
    title: 'Persetujuan Lembar Kerja Audit',
    description: 'Auditor membaca kepatuhan saldo kas fisik dan menyetujui evidens.',
    target: '#modalCard',
    highlightColor: 'emerald',
    spotlight: true,
    badge: '6',
    callout: '👉 Klik [Setujui Evidens]',
    snip: true,
    action: async () => {
      await page.click('#btnModalApprove');
    }
  });

  // Langkah 7: Hasil Akhir Valid
  await werecordit.step({
    title: 'Verifikasi Status Tersetujui',
    description: 'Sistem berhasil memperbarui status lembar kerja menjadi TERSETUJUI.',
    target: '#row-1 .badge-status',
    highlightColor: 'emerald',
    badge: '7',
    callout: '✅ Berhasil tervalidasi!',
    snip: true
  });

  // Assertion validasi Playwright
  const badgeText = await page.locator('#row-1 .badge-status').textContent();
  expect(badgeText).toContain('TERSETUJUI');

  await werecordit.sleep(1200);
});

