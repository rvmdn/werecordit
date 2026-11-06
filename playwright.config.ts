import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// 1. Baca file .env jika ada (Zero-dependency .env loader)
const envFile = path.resolve(__dirname, '.env');
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

// 2. Konfigurasi Dinamis dari Environment
const browserChannel = process.env.BROWSER_CHANNEL || 'msedge';
const videoWidth = parseInt(process.env.VIDEO_WIDTH || '1280', 10);
const videoHeight = parseInt(process.env.VIDEO_HEIGHT || '720', 10);
const serverPort = process.env.PORT || '4500';
const baseURL = process.env.APP_BASE_URL || process.env.FAST_BASE_URL || `http://127.0.0.1:${serverPort}`;
const isHeadless = process.env.HEADED === '1' ? false : (process.env.HEADLESS === 'false' ? false : true);
const actionTimeout = parseInt(process.env.ACTION_TIMEOUT || '15000', 10);
const testTimeout = parseInt(process.env.TEST_TIMEOUT || '60000', 10);

export default defineConfig({
  testDir: './tests',
  timeout: testTimeout,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    [path.resolve(__dirname, 'src/reporters/werecordit-reporter.ts')]
  ],
  use: {
    baseURL,
    headless: isHeadless,
    viewport: { width: videoWidth, height: videoHeight },
    ignoreHTTPSErrors: true,
    actionTimeout,
    video: {
      mode: 'on',
      size: { width: videoWidth, height: videoHeight }
    },
    trace: 'off'
  },
  projects: [
    {
      name: browserChannel,
      use: {
        channel: browserChannel !== 'chromium' ? (browserChannel as any) : undefined,
        viewport: { width: videoWidth, height: videoHeight }
      }
    }
  ]
});
