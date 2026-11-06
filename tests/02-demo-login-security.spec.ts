import { test, expect } from '../src/core/werecordit';

test('Demo Alur Login & Otentikasi Pengguna BNI', async ({ page, werecordit }) => {
  werecordit.setMetadata({
    title: 'Demo Alur Otentikasi Login & Validasi Keamanan',
    description: 'Panduan demo pengisian kredensial pengguna, proteksi password, dan penanganan validasi input.',
    author: 'ADV / Security QA Team',
    module: 'BNI-AUTH-SERVICE'
  });

  // Setup inline modern login UI
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>BNI Single Sign-On</title>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #0b1120; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; }
        .login-card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 36px; width: 420px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .logo { font-size: 24px; font-weight: 800; color: #f97316; margin-bottom: 6px; }
        .sub { font-size: 13px; color: #94a3b8; margin-bottom: 24px; }
        .form-group { margin-bottom: 18px; }
        label { display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 6px; }
        input { width: 100%; padding: 12px; background: #0f172a; border: 1.5px solid #334155; border-radius: 8px; color: #fff; font-size: 14px; outline: none; }
        input:focus { border-color: #0284c7; }
        .btn-submit { width: 100%; padding: 12px; background: #0284c7; color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; margin-top: 10px; }
        .alert-success { display: none; margin-top: 16px; padding: 12px; background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; border-radius: 8px; font-size: 13px; color: #34d399; text-align: center; }
      </style>
    </head>
    <body>
      <div class="login-card" id="cardLogin">
        <div class="logo">BNI FAST IDENTITY</div>
        <div class="sub">Portal Otentikasi Terpusat Auditor & Pengawas</div>
        <div class="form-group">
          <label for="username">Nomor Pokok Pegawai (NPP):</label>
          <input type="text" id="username" placeholder="Masukkan 5 digit NPP">
        </div>
        <div class="form-group">
          <label for="password">Kata Sandi Akun:</label>
          <input type="password" id="password" placeholder="••••••••">
        </div>
        <button id="btnLogin" class="btn-submit">Masuk ke Sistem</button>
        <div id="alertSuccess" class="alert-success">✅ Berhasil Masuk! Mengalihkan ke Beranda...</div>
      </div>
      <script>
        document.getElementById('btnLogin').addEventListener('click', () => {
          document.getElementById('alertSuccess').style.display = 'block';
        });
      </script>
    </body>
    </html>
  `);

  const testUser = process.env.TEST_USER || process.env.DEFAULT_USER || '98124';
  const testPassword = process.env.TEST_PASSWORD || process.env.DEFAULT_PASSWORD || 'P@ssw0rdBNI2026!';

  await werecordit.sleep(1000);

  // Langkah 1: Akses Form Login
  await werecordit.step({
    title: 'Akses Form Login SSO',
    description: 'Menampilkan antarmuka formulir Single Sign-On BNI FAST.',
    target: '#cardLogin',
    highlightColor: 'blue',
    badge: '1',
    callout: 'Pastikan koneksi SSL aman',
    snip: true
  });

  // Langkah 2: Masukkan NPP
  await werecordit.step({
    title: 'Input Nomor Pegawai (NPP)',
    description: 'Memasukkan kredensial NPP resmi pegawai BNI.',
    target: '#username',
    highlightColor: 'amber',
    badge: '2',
    spotlight: true,
    callout: `Ketik NPP ${testUser}`,
    action: async () => {
      await page.fill('#username', testUser);
    },
    snip: true
  });

  // Langkah 3: Masukkan Password
  await werecordit.step({
    title: 'Input Kata Sandi Terenkripsi',
    description: 'Memasukkan kata sandi aman yang terproteksi karakter masking.',
    target: '#password',
    highlightColor: 'amber',
    badge: '3',
    action: async () => {
      await page.fill('#password', testPassword);
    },
    snip: true
  });

  // Langkah 4: Klik Masuk
  await werecordit.step({
    title: 'Klik Tombol Masuk Sistem',
    description: 'Mengirimkan payload otentikasi ke Identity Provider.',
    target: '#btnLogin',
    highlightColor: 'emerald',
    badge: '4',
    cursorClick: true,
    action: async () => {
      await page.click('#btnLogin');
    }
  });

  // Langkah 5: Verifikasi Notifikasi Berhasil
  await werecordit.step({
    title: 'Validasi Sukses Otentikasi',
    description: 'Sistem menampilkan notifikasi berhasil dan token sesi terbentuk.',
    target: '#alertSuccess',
    highlightColor: 'emerald',
    spotlight: true,
    badge: '5',
    callout: 'Sesi Aktif Diperoleh',
    snip: true
  });

  await expect(page.locator('#alertSuccess')).toBeVisible();
  await werecordit.sleep(1200);
});

