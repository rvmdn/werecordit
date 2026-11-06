import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

export interface DemoItem {
  id: string;
  title: string;
  description: string;
  status: 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted' | 'unknown';
  durationSeconds: number;
  videoUrl: string;
  videoFileName: string;
  recordedAt: string;
  steps: Array<{
    index: number;
    title: string;
    description: string;
    timestampSeconds: number;
    badge?: string | number;
    snipUrl?: string;
  }>;
}

export default class WeRecordItReporter implements Reporter {
  private demos: DemoItem[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    const rawDemoAnnotation = test.annotations.find(a => a.type === 'werecordit_demo_data');
    let demoData: any = {};
    if (rawDemoAnnotation && rawDemoAnnotation.description) {
      try {
        demoData = JSON.parse(rawDemoAnnotation.description);
      } catch {}
    }

    const safeTitle = test.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const videoAttachment = result.attachments.find(a => a.name === 'video' || (a.contentType && a.contentType.includes('video')));
    
    let targetVideoRelPath = '';
    let targetVideoFileName = '';

    if (videoAttachment && videoAttachment.path && fs.existsSync(videoAttachment.path)) {
      const outputDir = path.resolve(process.cwd(), process.env.WERECORDIT_OUTPUT_DIR || 'output');
      const videoOutputDir = path.resolve(process.cwd(), process.env.WERECORDIT_VIDEOS_DIR || path.join(outputDir, 'videos'));
      if (!fs.existsSync(videoOutputDir)) {
        fs.mkdirSync(videoOutputDir, { recursive: true });
      }

      targetVideoFileName = `${safeTitle}.webm`;
      const finalDest = path.join(videoOutputDir, targetVideoFileName);

      try {
        fs.copyFileSync(videoAttachment.path, finalDest);
        const relDir = process.env.WERECORDIT_VIDEOS_DIR || 'output/videos';
        targetVideoRelPath = `${relDir.replace(/\\/g, '/')}/${targetVideoFileName}`;
      } catch (err: any) {
        console.error(`[WeRecordIt Reporter] Gagal menyalin video: ${err.message}`);
      }
    }

    const meta = demoData.metadata || {};
    const steps = (demoData.steps || []).map((s: any) => ({
      index: s.index,
      title: s.title,
      description: s.description,
      timestampSeconds: s.timestampSeconds,
      badge: s.badge,
      snipUrl: s.snipRelativePath ? s.snipRelativePath.replace(/\\/g, '/') : undefined
    }));

    this.demos.push({
      id: safeTitle,
      title: meta.title || test.title,
      description: meta.description || 'Skenario demo otomasi dan panduan interaktif',
      status: result.status,
      durationSeconds: Math.round((result.duration / 1000) * 10) / 10,
      videoUrl: targetVideoRelPath ? targetVideoRelPath.replace(/\\/g, '/') : '',
      videoFileName: targetVideoFileName,
      recordedAt: demoData.recordedAt || new Date().toISOString(),
      steps
    });
  }

  onEnd(result: FullResult) {
    const outputDir = path.resolve(process.cwd(), process.env.WERECORDIT_OUTPUT_DIR || 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const manifestPath = path.join(outputDir, 'manifest.json');
    let allDemos: DemoItem[] = [];

    // Baca manifest lama jika ada agar tidak terhapus saat run parsial
    if (fs.existsSync(manifestPath)) {
      try {
        const prev = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (Array.isArray(prev.demos)) {
          allDemos = prev.demos;
        }
      } catch {}
    }

    // Gabungkan demo baru (replace jika ID sama, append jika baru)
    for (const newDemo of this.demos) {
      const existingIdx = allDemos.findIndex(d => d.id === newDemo.id);
      if (existingIdx >= 0) {
        allDemos[existingIdx] = newDemo;
      } else {
        allDemos.push(newDemo);
      }
    }

    const manifest = {
      generatedAt: new Date().toISOString(),
      totalDemos: allDemos.length,
      demos: allDemos
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`\n========================================================`);
    console.log(`🎬 [WeRecordIt] Manifest Tersimpan: ${manifestPath}`);
    console.log(`📹 Total Video Demo di Katalog: ${allDemos.length}`);
    for (const d of allDemos) {
      console.log(`  - ${d.title} [${d.status.toUpperCase()}] -> ${d.videoUrl || 'No video'}`);
    }
    console.log(`========================================================\n`);
  }
}
