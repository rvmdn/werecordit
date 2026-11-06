const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// 1. Baca file .env jika ada (Zero-dependency .env loader)
const ROOT_DIR = path.resolve(__dirname, '../../');
const envFile = path.join(ROOT_DIR, '.env');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

const app = express();
const PORT = process.env.PORT || 4500;
const HOST = process.env.HOST || '127.0.0.1';

const outputDir = path.resolve(ROOT_DIR, process.env.WERECORDIT_OUTPUT_DIR || 'output');
const videosDir = path.resolve(ROOT_DIR, process.env.WERECORDIT_VIDEOS_DIR || 'output/videos');
const snipsDir = path.resolve(ROOT_DIR, process.env.WERECORDIT_SNIPS_DIR || 'output/snips');

// Ensure output directories exist
[outputDir, videosDir, snipsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use(express.json());

// Serve static assets with no-cache headers to prevent stale 0-byte caching
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  }
}));
app.use('/output/videos', express.static(videosDir));
app.use('/output/snips', express.static(snipsDir));
app.use('/output', express.static(outputDir));

// API: Ping health check
app.get('/api/ping', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, app: 'WeRecordIt Studio', port: PORT, host: HOST });
});

// API: Get manifest
app.get('/api/manifest', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  const manifestPath = path.join(outputDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      return res.json(data);
    } catch (e) {
      return res.status(500).json({ error: 'Gagal membaca manifest.json' });
    }
  }
  res.json({ generatedAt: null, totalDemos: 0, demos: [] });
});

// API: List tests
app.get('/api/tests', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const testsDir = path.join(ROOT_DIR, 'tests');
  if (!fs.existsSync(testsDir)) {
    return res.json([]);
  }
  const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.spec.ts'));
  res.json(files);
});

// API: Run test demo
let currentProcess = null;
app.post('/api/run', (req, res) => {
  const testFile = req.body && req.body.testFile ? String(req.body.testFile).trim() : '';
  if (currentProcess) {
    return res.status(409).json({ error: 'Proses pengujian sedang berjalan' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const args = ['playwright', 'test'];
  if (testFile) {
    args.push(path.join('tests', testFile));
  }

  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'npx.cmd' : 'npx';

  const sendEvent = (event, data) => {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {}
  };

  sendEvent('log', `▶ Memulai eksekusi demo: ${cmd} ${args.join(' ')}\n\n`);

  try {
    currentProcess = spawn(cmd, args, {
      cwd: ROOT_DIR,
      shell: true,
      env: { ...process.env, RECORD_VIDEO: '1' }
    });

    currentProcess.stdout.on('data', (chunk) => {
      sendEvent('log', chunk.toString());
    });

    currentProcess.stderr.on('data', (chunk) => {
      sendEvent('log', chunk.toString());
    });

    currentProcess.on('error', (err) => {
      sendEvent('log', `\n[System Error]: ${err.message}\n`);
      currentProcess = null;
      res.end();
    });

    currentProcess.on('close', (code) => {
      currentProcess = null;
      sendEvent('done', { code, success: code === 0 });
      res.end();
    });

    req.on('close', () => {
      if (currentProcess) {
        try { currentProcess.kill(); } catch {}
        currentProcess = null;
      }
    });
  } catch (err) {
    sendEvent('log', `\n[Gagal Menjalankan]: ${err.message}\n`);
    currentProcess = null;
    res.end();
  }
});

const server = app.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🎬 WeRecordIt Studio berjalan di: http://${HOST}:${PORT}`);
  console.log(`======================================================\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} sudah digunakan oleh proses lain.`);
  } else {
    console.error(`Server error:`, err);
  }
});
