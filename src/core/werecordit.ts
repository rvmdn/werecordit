import { test as base, Page, Locator, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ANNOTATOR_SCRIPT } from './annotator';

export interface StepAnnotationOptions {
  title: string;
  description: string;
  target?: Locator | string;
  highlightColor?: 'emerald' | 'blue' | 'amber' | 'red';
  badge?: string | number;
  callout?: string;
  spotlight?: boolean;
  snip?: boolean | 'crop' | 'full';
  padding?: number;
  cursorClick?: boolean;
  action?: () => Promise<any>;
  pauseMs?: number;
}

export interface DemoMetadata {
  title: string;
  description?: string;
  author?: string;
  module?: string;
  targetApp?: string;
}

export interface RecordedStepInfo {
  index: number;
  title: string;
  description: string;
  timestampSeconds: number;
  badge?: string | number;
  snipPath?: string;
  snipRelativePath?: string;
  targetSelector?: string;
}

export class WeRecordItContext {
  private page: Page;
  private testInfo: TestInfo;
  private startTime: number;
  private stepIndex: number = 0;
  private steps: RecordedStepInfo[] = [];
  private metadata: DemoMetadata = { title: 'User Demo Walkthrough' };
  private initialized: boolean = false;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.testInfo = testInfo;
    this.startTime = Date.now();
  }

  async init() {
    if (this.initialized) return;
    await this.page.addInitScript(ANNOTATOR_SCRIPT);
    // In case page is already loaded:
    await this.page.evaluate(ANNOTATOR_SCRIPT).catch(() => {});
    this.initialized = true;
  }

  setMetadata(meta: DemoMetadata) {
    this.metadata = { ...this.metadata, ...meta };
  }

  getMetadata(): DemoMetadata {
    return this.metadata;
  }

  getSteps(): RecordedStepInfo[] {
    return this.steps;
  }

  /**
   * Helper untuk jeda waktu visual agar video demo nyaman ditonton manusia
   */
  async sleep(ms: number = 1000) {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Langkah Utama: Menampilkan HUD, Sorotan Elemen, Kursor, Snipping Tool, dan Aksi
   */
  async step(options: StepAnnotationOptions) {
    await this.init();
    this.stepIndex++;
    const currentStepNum = this.stepIndex;
    const currentSec = Math.max(0, (Date.now() - this.startTime) / 1000);

    // 1. Tampilkan HUD Banner di video
    await this.page.evaluate(
      ({ num, title, desc }) => {
        (window as any).__werecordit_annotator?.showBanner(num, 0, title, desc);
      },
      { num: currentStepNum, title: options.title, desc: options.description }
    ).catch(() => {});

    let targetCoords: { x: number; y: number; rect: any } | null = null;
    let targetSelectorStr = '';

    // 2. Soroti Elemen Target (Highlight, Callout, Badge, Spotlight)
    if (options.target) {
      if (typeof options.target === 'string') {
        targetSelectorStr = options.target;
        targetCoords = await this.page.evaluate(
          ({ sel, color, badge, callout, spotlight }) => {
            return (window as any).__werecordit_annotator?.highlightTarget(sel, {
              color,
              badge,
              callout,
              spotlight
            });
          },
          {
            sel: options.target,
            color: options.highlightColor || 'emerald',
            badge: options.badge !== undefined ? String(options.badge) : String(currentStepNum),
            callout: options.callout,
            spotlight: options.spotlight === true
          }
        ).catch(() => null);
      } else {
        // Locator
        try {
          await options.target.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
          const box = await options.target.boundingBox();
          if (box) {
            targetCoords = {
              x: box.x + box.width / 2,
              y: box.y + box.height / 2,
              rect: box
            };
            await options.target.evaluate(
              (el, { color, badge, callout, spotlight }) => {
                (window as any).__werecordit_annotator?.highlightTarget(el, {
                  color,
                  badge,
                  callout,
                  spotlight
                });
              },
              {
                color: options.highlightColor || 'emerald',
                badge: options.badge !== undefined ? String(options.badge) : String(currentStepNum),
                callout: options.callout,
                spotlight: options.spotlight === true
              }
            ).catch(() => {});
          }
        } catch {}
      }
    }

    // 3. Efek Kursor Virtual & Animasi Gerak
    if (targetCoords) {
      await this.page.evaluate(
        ({ x, y }) => {
          (window as any).__werecordit_annotator?.showCursor(x, y);
          (window as any).__werecordit_annotator?.triggerRipple(x, y);
        },
        { x: targetCoords.x, y: targetCoords.y }
      ).catch(() => {});
    }

    // Beri waktu sejenak agar penonton video sempat melihat anotasi
    const pauseBefore = options.pauseMs || 1000;
    await this.page.waitForTimeout(Math.min(pauseBefore, 1200));

    // 4. Ambil Cuplikan Snipping Tool (jika diminta)
    let savedSnipPath = '';
    let savedSnipRelPath = '';
    const shouldSnip = options.snip !== false;

    if (shouldSnip) {
      const snipDir = path.resolve(process.cwd(), process.env.WERECORDIT_SNIPS_DIR || 'output/snips');
      if (!fs.existsSync(snipDir)) {
        fs.mkdirSync(snipDir, { recursive: true });
      }

      const safeTestName = (this.testInfo.title || 'demo').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const safeStepTitle = options.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase().substring(0, 30);
      const filename = `${safeTestName}_step_${String(currentStepNum).padStart(2, '0')}_${safeStepTitle}.png`;
      savedSnipPath = path.join(snipDir, filename);
      savedSnipRelPath = `output/snips/${filename}`;

      if (options.snip === 'crop' && options.target && typeof options.target !== 'string') {
        // Crop khusus elemen
        try {
          await options.target.screenshot({ path: savedSnipPath });
        } catch {
          await this.page.screenshot({ path: savedSnipPath });
        }
      } else {
        // Viewport screenshot lengkap dengan seluruh anotasi Snipping Tool
        await this.page.screenshot({ path: savedSnipPath });
      }

      // Attach ke testInfo Playwright
      await this.testInfo.attach(`Snip #${currentStepNum} - ${options.title}`, {
        path: savedSnipPath,
        contentType: 'image/png'
      });
    }

    // Catat informasi langkah untuk chapter video & galeri
    const stepRecord: RecordedStepInfo = {
      index: currentStepNum,
      title: options.title,
      description: options.description,
      timestampSeconds: Math.round(currentSec * 10) / 10,
      badge: options.badge || currentStepNum,
      snipPath: savedSnipPath,
      snipRelativePath: savedSnipRelPath,
      targetSelector: targetSelectorStr
    };
    this.steps.push(stepRecord);

    // 5. Eksekusi Aksi jika ada
    if (typeof options.action === 'function') {
      await options.action();
    } else if (options.cursorClick && options.target) {
      if (typeof options.target === 'string') {
        await this.page.click(options.target).catch(() => {});
      } else {
        await options.target.click().catch(() => {});
      }
    }

    // Beri jeda visual setelah aksi
    await this.page.waitForTimeout(600);

    // 6. Bersihkan sorotan agar siap ke langkah berikutnya
    await this.page.evaluate(() => {
      (window as any).__werecordit_annotator?.clearHighlights();
    }).catch(() => {});
  }

  /**
   * Snipping tool mandiri untuk mengambil cuplikan elemen tertentu kapan saja
   */
  async snipElement(target: Locator | string, label: string): Promise<string> {
    const snipDir = path.resolve(process.cwd(), process.env.WERECORDIT_SNIPS_DIR || 'output/snips');
    if (!fs.existsSync(snipDir)) {
      fs.mkdirSync(snipDir, { recursive: true });
    }
    const filename = `snip_${Date.now()}_${label.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
    const fullPath = path.join(snipDir, filename);

    if (typeof target === 'string') {
      const loc = this.page.locator(target).first();
      await loc.screenshot({ path: fullPath });
    } else {
      await target.screenshot({ path: fullPath });
    }
    return fullPath;
  }

  /**
   * Menyimpan manifest data demo skenario untuk dibaca oleh WeRecordIt Studio UI
   */
  async finishDemo(videoPath?: string) {
    // Sembunyikan HUD Banner di akhir demo
    await this.page.evaluate(() => {
      (window as any).__werecordit_annotator?.hideBanner();
      (window as any).__werecordit_annotator?.clearHighlights();
    }).catch(() => {});

    // Simpan metadata ke testInfo annotations
    this.testInfo.annotations.push({
      type: 'werecordit_demo_data',
      description: JSON.stringify({
        metadata: this.metadata,
        steps: this.steps,
        durationSeconds: Math.round(((Date.now() - this.startTime) / 1000) * 10) / 10,
        recordedAt: new Date().toISOString()
      })
    });
  }
}

export const test = base.extend<{ werecordit: WeRecordItContext }>({
  werecordit: async ({ page }, use, testInfo) => {
    const context = new WeRecordItContext(page, testInfo);
    await use(context);
    await context.finishDemo();
  }
});

export { expect } from '@playwright/test';

