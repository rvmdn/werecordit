let currentManifest = null;
let activeDemo = null;
let isRunning = false;

const dom = {
  demoList: document.getElementById('demoList'),
  demoCountBadge: document.getElementById('demoCountBadge'),
  testSelect: document.getElementById('testSelect'),
  btnRun: document.getElementById('btnRun'),
  btnRefresh: document.getElementById('btnRefresh'),
  demoVideo: document.getElementById('demoVideo'),
  videoSubtitles: document.getElementById('videoSubtitles'),
  subBadge: document.getElementById('subBadge'),
  subText: document.getElementById('subText'),
  activeDemoTitle: document.getElementById('activeDemoTitle'),
  activeDemoDesc: document.getElementById('activeDemoDesc'),
  activeDemoStatus: document.getElementById('activeDemoStatus'),
  activeDemoDuration: document.getElementById('activeDemoDuration'),
  chapterList: document.getElementById('chapterList'),
  snipGallery: document.getElementById('snipGallery'),
  terminalLogs: document.getElementById('terminalLogs'),
  btnClearLog: document.getElementById('btnClearLog'),
  lightboxModal: document.getElementById('lightboxModal'),
  lightboxImg: document.getElementById('lightboxImg'),
  lightboxTitle: document.getElementById('lightboxTitle'),
  lightboxDesc: document.getElementById('lightboxDesc'),
  lightboxClose: document.getElementById('lightboxClose')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupLightbox();
  loadTestsList();
  loadManifest();

  dom.btnRefresh.addEventListener('click', () => {
    loadManifest(true);
  });

  dom.btnRun.addEventListener('click', handleRunDemo);

  dom.btnClearLog.addEventListener('click', () => {
    dom.terminalLogs.textContent = '$ Siap.\n';
  });

  // Track video time for dynamic subtitle & active chapter highlight
  dom.demoVideo.addEventListener('timeupdate', handleVideoTimeUpdate);
});

// Tab Navigation
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId)?.classList.add('active');
    });
  });
}

// Lightbox
function setupLightbox() {
  dom.lightboxClose.addEventListener('click', () => {
    dom.lightboxModal.classList.remove('active');
  });
  dom.lightboxModal.addEventListener('click', (e) => {
    if (e.target === dom.lightboxModal) {
      dom.lightboxModal.classList.remove('active');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dom.lightboxModal.classList.contains('active')) {
      dom.lightboxModal.classList.remove('active');
    }
  });
}

function openLightbox(imgUrl, title, desc) {
  dom.lightboxImg.src = imgUrl;
  dom.lightboxTitle.textContent = title || 'Cuplikan Evidens';
  dom.lightboxDesc.textContent = desc || '';
  dom.lightboxModal.classList.add('active');
}

// Fetch available test files
async function loadTestsList() {
  try {
    const res = await fetch('/api/tests');
    const tests = await res.json();
    dom.testSelect.innerHTML = '<option value="">Semua Skenario Demo</option>';
    tests.forEach(testFile => {
      const opt = document.createElement('option');
      opt.value = testFile;
      opt.textContent = testFile;
      dom.testSelect.appendChild(opt);
    });
  } catch (err) {
    console.warn('Gagal memuat daftar tes:', err);
  }
}

// Fetch manifest
async function loadManifest(showToast = false) {
  try {
    const res = await fetch('/api/manifest?t=' + Date.now());
    currentManifest = await res.json();
    renderDemosList(currentManifest.demos || []);
    if (showToast) {
      console.log('Manifest berhasil diperbarui');
    }
  } catch (err) {
    console.error('Gagal mengambil manifest:', err);
  }
}

// Render Demos in Sidebar
function renderDemosList(demos) {
  dom.demoCountBadge.textContent = demos.length;

  if (demos.length === 0) {
    dom.demoList.innerHTML = `
      <div class="empty-state">
        <p>Belum ada rekaman demo.</p>
        <p class="sub">Klik tombol "Jalankan Demo" untuk memulai rekaman visual.</p>
      </div>
    `;
    return;
  }

  dom.demoList.innerHTML = '';
  demos.forEach((demo, idx) => {
    const card = document.createElement('div');
    const isCurrentActive = activeDemo?.id === demo.id;
    card.className = `demo-item-card ${isCurrentActive ? 'active' : ''}`;
    card.setAttribute('data-demo-id', demo.id);
    card.innerHTML = `
      <div class="demo-card-title">${escapeHtml(demo.title)}</div>
      <div class="demo-card-footer">
        <span class="status-badge ${demo.status}">${demo.status}</span>
        <span>${demo.durationSeconds || 0}s • ${(demo.steps || []).length} Langkah</span>
      </div>
    `;
    card.addEventListener('click', () => selectDemo(demo, card));
    dom.demoList.appendChild(card);

    // If this demo was active previously, update reference
    if (isCurrentActive) {
      activeDemo = demo;
    }

    // Auto select first demo if none selected
    if (idx === 0 && !activeDemo) {
      selectDemo(demo, card);
    }
  });
}

// Select Demo
function selectDemo(demo, cardEl) {
  activeDemo = demo;
  document.querySelectorAll('.demo-item-card').forEach(c => c.classList.remove('active'));
  if (cardEl) {
    cardEl.classList.add('active');
  } else {
    const matching = document.querySelector(`.demo-item-card[data-demo-id="${demo.id}"]`);
    if (matching) matching.classList.add('active');
  }

  // Set Info
  dom.activeDemoTitle.textContent = demo.title || 'Demo Tanpa Judul';
  dom.activeDemoDesc.textContent = demo.description || '';
  const statusStr = (demo.status || 'READY').toUpperCase();
  dom.activeDemoStatus.textContent = statusStr;
  dom.activeDemoStatus.className = `tag-status status-${demo.status || 'ready'}`;
  dom.activeDemoDuration.textContent = `${demo.durationSeconds || 0}s`;

  // Set Video
  if (demo.videoUrl) {
    dom.demoVideo.src = `/${demo.videoUrl}`;
    dom.demoVideo.load();
    dom.videoSubtitles.style.display = 'flex';
    dom.subBadge.textContent = 'MULAI';
    dom.subText.textContent = demo.title;
  } else {
    dom.demoVideo.removeAttribute('src');
    dom.videoSubtitles.style.display = 'none';
  }

  // Render Chapters
  renderChapters(demo.steps || []);

  // Render Snip Gallery
  renderSnipGallery(demo.steps || []);
}

// Render Timeline Chapters
function renderChapters(steps) {
  if (steps.length === 0) {
    dom.chapterList.innerHTML = '<div class="empty-state">Tidak ada langkah dalam skenario ini.</div>';
    return;
  }

  dom.chapterList.innerHTML = '';
  steps.forEach(step => {
    const card = document.createElement('div');
    card.className = 'chapter-card';
    card.setAttribute('data-step-index', step.index);
    card.setAttribute('data-timestamp', step.timestampSeconds);
    card.innerHTML = `
      <div class="chapter-badge">${step.badge || step.index}</div>
      <div class="chapter-content">
        <div class="chapter-title">${escapeHtml(step.title)}</div>
        <div class="chapter-desc">${escapeHtml(step.description)}</div>
        <span class="chapter-time">⏱ ${formatSeconds(step.timestampSeconds)}</span>
      </div>
    `;

    // Click to seek video!
    card.addEventListener('click', () => {
      if (dom.demoVideo.src) {
        dom.demoVideo.currentTime = step.timestampSeconds;
        dom.demoVideo.play().catch(() => {});
      }
    });

    dom.chapterList.appendChild(card);
  });
}

// Render Snipping Tool Gallery
function renderSnipGallery(steps) {
  const snips = steps.filter(s => s.snipUrl);
  if (snips.length === 0) {
    dom.snipGallery.innerHTML = '<div class="empty-state">Belum ada evidens snipping tersimpan untuk skenario ini.</div>';
    return;
  }

  dom.snipGallery.innerHTML = '';
  snips.forEach(snip => {
    const card = document.createElement('div');
    card.className = 'snip-card';
    card.innerHTML = `
      <div class="snip-thumb-wrap">
        <span class="snip-badge-float">Langkah ${snip.badge || snip.index}</span>
        <img class="snip-thumb" src="/${snip.snipUrl}" alt="${escapeHtml(snip.title)}" loading="lazy">
      </div>
      <div class="snip-info">
        <div class="snip-title">${escapeHtml(snip.title)}</div>
        <div class="snip-desc">${escapeHtml(snip.description)}</div>
        <div class="snip-actions">
          <a href="/${snip.snipUrl}" download class="btn btn-sm">Unduh Evidens</a>
        </div>
      </div>
    `;

    // Click thumbnail to open lightbox
    const thumbWrap = card.querySelector('.snip-thumb-wrap');
    thumbWrap.addEventListener('click', () => {
      openLightbox(`/${snip.snipUrl}`, snip.title, snip.description);
    });

    dom.snipGallery.appendChild(card);
  });
}

// Dynamic Subtitle & Chapter Highlight during playback
function handleVideoTimeUpdate() {
  if (!activeDemo || !activeDemo.steps || activeDemo.steps.length === 0) return;
  const curTime = dom.demoVideo.currentTime;

  let activeStep = null;
  for (let i = 0; i < activeDemo.steps.length; i++) {
    const step = activeDemo.steps[i];
    const nextStep = activeDemo.steps[i + 1];
    if (curTime >= step.timestampSeconds && (!nextStep || curTime < nextStep.timestampSeconds)) {
      activeStep = step;
      break;
    }
  }

  if (activeStep) {
    dom.subBadge.textContent = `LANGKAH ${activeStep.badge || activeStep.index}`;
    dom.subText.textContent = `${activeStep.title} — ${activeStep.description}`;

    // Highlight chapter card by step index
    document.querySelectorAll('.chapter-card').forEach(card => {
      const idx = parseInt(card.getAttribute('data-step-index') || '0', 10);
      if (idx === activeStep.index) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }
}

// Run Playwright Demo Runner
function handleRunDemo() {
  if (isRunning) {
    alert('Proses pengujian sedang berjalan! Harap tunggu hingga selesai.');
    return;
  }

  isRunning = true;

  // Switch to console tab
  document.querySelector('[data-tab="consoleTab"]').click();
  dom.terminalLogs.textContent = '$ Menghubungkan ke Playwright Demo Runner...\n';
  dom.btnRun.disabled = true;
  dom.testSelect.disabled = true;
  dom.btnRun.innerHTML = '<span>Sedang Merekam...</span>';

  const testFile = dom.testSelect.value;

  fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testFile })
  }).then(response => {
    if (!response.ok) {
      return response.json().then(errData => {
        throw new Error(errData.error || `HTTP error ${response.status}`);
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    function finishRun() {
      isRunning = false;
      dom.btnRun.disabled = false;
      dom.testSelect.disabled = false;
      dom.btnRun.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>Jalankan Demo</span>
      `;
      loadManifest(true);
    }

    function readChunk() {
      reader.read().then(({ done, value }) => {
        if (done) {
          finishRun();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // keep unfinished chunk

        for (const block of lines) {
          if (!block.trim()) continue;
          const matchData = block.match(/data: (.*)/);
          if (matchData) {
            try {
              const data = JSON.parse(matchData[1]);
              if (typeof data === 'string') {
                dom.terminalLogs.textContent += data;
                dom.terminalLogs.scrollTop = dom.terminalLogs.scrollHeight;
              } else if (data && data.code !== undefined) {
                dom.terminalLogs.textContent += `\n[Selesai] Kode keluar: ${data.code}\n`;
              }
            } catch(e) {
              dom.terminalLogs.textContent += matchData[1] + '\n';
            }
          }
        }

        readChunk();
      }).catch(err => {
        dom.terminalLogs.textContent += `\n[Error Stream]: ${err.message}\n`;
        finishRun();
      });
    }

    readChunk();
  }).catch(err => {
    dom.terminalLogs.textContent += `\n[Koneksi Gagal]: ${err.message}\n`;
    isRunning = false;
    dom.btnRun.disabled = false;
    dom.testSelect.disabled = false;
    dom.btnRun.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
      <span>Jalankan Demo</span>
    `;
  });
}

function formatSeconds(sec) {
  if (sec === null || sec === undefined || isNaN(sec)) return '00:00';
  const total = Math.max(0, Math.round(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
