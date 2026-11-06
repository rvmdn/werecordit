/**
 * WeRecordIt - In-Page Visual Annotator & Demo HUD
 * Injected into the browser DOM to produce rich visual cues during video recording and snipping.
 */

export const ANNOTATOR_SCRIPT = `
(function() {
  if (window.__werecordit_annotator) return;

  const STATE = {
    activeElements: [],
    spotlightEl: null,
    bannerEl: null,
    cursorEl: null,
    stepCounter: 0
  };

  function ensureStyles() {
    if (document.getElementById('werecordit-styles')) return;
    const style = document.createElement('style');
    style.id = 'werecordit-styles';
    style.textContent = \`
      /* Demo HUD Banner */
      .werecordit-banner {
        position: fixed !important;
        bottom: 24px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        z-index: 2147483647 !important;
        background: rgba(11, 17, 32, 0.94) !important;
        backdrop-filter: blur(14px) !important;
        -webkit-backdrop-filter: blur(14px) !important;
        color: #f8fafc !important;
        border: 1px solid rgba(255, 255, 255, 0.18) !important;
        border-radius: 12px !important;
        padding: 12px 22px !important;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        font-size: 13px !important;
        display: flex !important;
        align-items: center !important;
        gap: 14px !important;
        min-width: 380px !important;
        max-width: 85vw !important;
        animation: werecordit-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        pointer-events: none !important;
      }

      .werecordit-banner-badge {
        background: linear-gradient(135deg, #0284c7, #0369a1) !important;
        color: #ffffff !important;
        font-weight: 800 !important;
        font-size: 11px !important;
        padding: 4px 10px !important;
        border-radius: 9999px !important;
        letter-spacing: 0.6px !important;
        text-transform: uppercase !important;
        flex-shrink: 0 !important;
        box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4) !important;
      }

      .werecordit-banner-content {
        display: flex !important;
        flex-direction: column !important;
        gap: 2px !important;
        overflow: hidden !important;
      }

      .werecordit-banner-title {
        font-weight: 700 !important;
        font-size: 14px !important;
        color: #38bdf8 !important;
        white-space: nowrap !important;
        text-overflow: ellipsis !important;
        overflow: hidden !important;
      }

      .werecordit-banner-desc {
        font-size: 12px !important;
        color: #cbd5e1 !important;
        line-height: 1.4 !important;
      }

      /* Highlight Box */
      .werecordit-highlight {
        outline-offset: 3px !important;
        transition: outline 0.2s ease, box-shadow 0.2s ease !important;
      }

      .werecordit-hl-emerald {
        outline: 3.5px solid #10b981 !important;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.9) !important;
      }
      .werecordit-hl-blue {
        outline: 3.5px solid #0284c7 !important;
        box-shadow: 0 0 20px rgba(2, 132, 199, 0.9) !important;
      }
      .werecordit-hl-amber {
        outline: 3.5px solid #f59e0b !important;
        box-shadow: 0 0 20px rgba(245, 158, 11, 0.9) !important;
      }
      .werecordit-hl-red {
        outline: 3.5px solid #ef4444 !important;
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.9) !important;
      }

      /* Step Badge */
      .werecordit-step-badge {
        position: absolute !important;
        z-index: 2147483646 !important;
        background: #ef4444 !important;
        color: #ffffff !important;
        font-size: 13px !important;
        font-weight: 800 !important;
        width: 26px !important;
        height: 26px !important;
        line-height: 26px !important;
        text-align: center !important;
        border-radius: 50% !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 2.5px #ffffff !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        transform: translate(-50%, -50%) !important;
        pointer-events: none !important;
        animation: werecordit-pop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
      }

      /* Callout Balloon */
      .werecordit-callout {
        position: absolute !important;
        z-index: 2147483646 !important;
        background: #0f172a !important;
        color: #ffffff !important;
        padding: 7px 13px !important;
        border-radius: 8px !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.15) !important;
        border-left: 4px solid #38bdf8 !important;
        pointer-events: none !important;
        white-space: nowrap !important;
        animation: werecordit-pop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
      }
      .werecordit-callout-top::after {
        content: "" !important;
        position: absolute !important;
        top: 100% !important;
        left: 20px !important;
        border-width: 6px !important;
        border-style: solid !important;
        border-color: #0f172a transparent transparent transparent !important;
      }
      .werecordit-callout-bottom::after {
        content: "" !important;
        position: absolute !important;
        bottom: 100% !important;
        left: 20px !important;
        border-width: 6px !important;
        border-style: solid !important;
        border-color: transparent transparent #0f172a transparent !important;
      }

      /* Spotlight Dimming Backdrop */
      .werecordit-spotlight-backdrop {
        position: fixed !important;
        inset: 0 !important;
        background: rgba(7, 11, 20, 0.65) !important;
        z-index: 2147483640 !important;
        pointer-events: none !important;
        transition: opacity 0.25s ease !important;
      }

      /* Virtual Cursor & Click Ripple */
      .werecordit-cursor {
        position: fixed !important;
        z-index: 2147483647 !important;
        width: 24px !important;
        height: 24px !important;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="%230284c7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>') no-repeat center center !important;
        background-size: contain !important;
        pointer-events: none !important;
        transition: left 0.35s cubic-bezier(0.22, 1, 0.36, 1), top 0.35s cubic-bezier(0.22, 1, 0.36, 1) !important;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.6)) !important;
      }

      .werecordit-ripple {
        position: fixed !important;
        z-index: 2147483646 !important;
        border-radius: 50% !important;
        background: rgba(14, 165, 233, 0.45) !important;
        border: 2px solid #38bdf8 !important;
        transform: translate(-50%, -50%) scale(0) !important;
        pointer-events: none !important;
        animation: werecordit-ripple-effect 0.6s ease-out forwards !important;
      }

      @keyframes werecordit-slide-up {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }

      @keyframes werecordit-pop {
        from { opacity: 0; transform: scale(0.6); }
        to { opacity: 1; transform: scale(1); }
      }

      @keyframes werecordit-ripple-effect {
        0% { transform: translate(-50%, -50%) scale(0.1); opacity: 1; width: 12px; height: 12px; }
        100% { transform: translate(-50%, -50%) scale(4); opacity: 0; width: 30px; height: 30px; }
      }
    \`;
    document.head.appendChild(style);
  }

  window.__werecordit_annotator = {
    showBanner: function(stepNum, totalSteps, title, description) {
      ensureStyles();
      if (!STATE.bannerEl) {
        STATE.bannerEl = document.createElement('div');
        STATE.bannerEl.className = 'werecordit-banner';
        document.body.appendChild(STATE.bannerEl);
      }
      const badgeText = totalSteps ? \`LANGKAH \${stepNum} / \${totalSteps}\` : \`LANGKAH \${stepNum}\`;
      STATE.bannerEl.innerHTML = \`
        <span class="werecordit-banner-badge">\${badgeText}</span>
        <div class="werecordit-banner-content">
          <div class="werecordit-banner-title">\${title || ''}</div>
          <div class="werecordit-banner-desc">\${description || ''}</div>
        </div>
      \`;
      STATE.bannerEl.style.display = 'flex';
    },

    hideBanner: function() {
      if (STATE.bannerEl) {
        STATE.bannerEl.style.display = 'none';
      }
    },

    highlightTarget: function(selectorOrEl, options) {
      ensureStyles();
      const el = typeof selectorOrEl === 'string' ? document.querySelector(selectorOrEl) : selectorOrEl;
      if (!el) return null;

      options = options || {};
      const color = options.color || 'emerald';
      const badgeText = options.badge;
      const calloutText = options.callout;
      const enableSpotlight = options.spotlight === true;

      // Spotlight backdrop
      if (enableSpotlight) {
        if (!STATE.spotlightEl) {
          STATE.spotlightEl = document.createElement('div');
          STATE.spotlightEl.className = 'werecordit-spotlight-backdrop';
          document.body.appendChild(STATE.spotlightEl);
        }
        STATE.spotlightEl.style.display = 'block';
        el.style.position = 'relative';
        el.style.zIndex = '2147483642';
      }

      // Add highlight class
      el.classList.add('werecordit-highlight', \`werecordit-hl-\${color}\`);

      const rect = el.getBoundingClientRect();
      const createdNodes = [];

      // Step badge
      if (badgeText !== undefined && badgeText !== null) {
        const badge = document.createElement('div');
        badge.className = 'werecordit-step-badge';
        badge.textContent = String(badgeText);
        badge.style.left = \`\${rect.left + window.scrollX}px\`;
        badge.style.top = \`\${rect.top + window.scrollY}px\`;
        document.body.appendChild(badge);
        createdNodes.push(badge);
      }

      // Callout tooltip
      if (calloutText) {
        const callout = document.createElement('div');
        const placeBelow = rect.top < 50;
        callout.className = placeBelow ? 'werecordit-callout werecordit-callout-bottom' : 'werecordit-callout werecordit-callout-top';
        callout.textContent = calloutText;
        callout.style.left = \`\${rect.left + window.scrollX}px\`;
        callout.style.top = placeBelow
          ? \`\${rect.bottom + window.scrollY + 10}px\`
          : \`\${Math.max(10, rect.top + window.scrollY - 38)}px\`;
        document.body.appendChild(callout);
        createdNodes.push(callout);
      }

      STATE.activeElements.push({
        element: el,
        createdNodes: createdNodes,
        colorClass: \`werecordit-hl-\${color}\`,
        hadSpotlight: enableSpotlight,
        origZIndex: el.style.zIndex,
        origPosition: el.style.position
      });

      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      };
    },

    clearHighlights: function() {
      if (STATE.spotlightEl) {
        STATE.spotlightEl.style.display = 'none';
      }
      for (const item of STATE.activeElements) {
        try {
          item.element.classList.remove('werecordit-highlight', item.colorClass);
          if (item.hadSpotlight) {
            item.element.style.zIndex = item.origZIndex || '';
            item.element.style.position = item.origPosition || '';
          }
          item.createdNodes.forEach(node => node.remove());
        } catch(e) {}
      }
      STATE.activeElements = [];
    },

    showCursor: function(x, y) {
      ensureStyles();
      if (!STATE.cursorEl) {
        STATE.cursorEl = document.createElement('div');
        STATE.cursorEl.className = 'werecordit-cursor';
        document.body.appendChild(STATE.cursorEl);
      }
      STATE.cursorEl.style.left = \`\${x}px\`;
      STATE.cursorEl.style.top = \`\${y}px\`;
      STATE.cursorEl.style.display = 'block';
    },

    triggerRipple: function(x, y) {
      ensureStyles();
      const ripple = document.createElement('div');
      ripple.className = 'werecordit-ripple';
      ripple.style.left = \`\${x}px\`;
      ripple.style.top = \`\${y}px\`;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    }
  };
})();
`;

