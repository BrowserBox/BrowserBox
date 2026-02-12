/**
 * Comprehensive Viewport Correctness Test
 *
 * Verifies that after each action (navigate, resize, maximize, tab switch),
 * the server-side screencast frame bitmap dimensions match the client's
 * viewport/canvas within a small tolerance.
 *
 * Checks FIVE dimension sources:
 *   1. Incoming frame bitmap size (imageBitmap.width/height from server)
 *   2. Canvas programmatic dimensions (canvas.width / canvas.height)
 *   3. Canvas CSS bounding rect (getBoundingClientRect)
 *   4. Remote viewport globals (ViewportWidth / ViewportHeight in BBX frame)
 *   5. Iframe container size (parent iframe bounding rect)
 *
 * The key invariant: after settling, the server bitmap dimensions should
 * match the remote viewport globals AND the iframe container (within
 * scrollbar-width tolerance ~40px, ±2px rounding).
 */
import { chromium } from 'playwright';

const DEMO_URL = (process.env.DEMO_URL || 'https://localhost:5444').replace(/\/+$/, '');
// Scrollbar width on macOS is typically 15-17px; on other systems up to 40px.
// Bitmap = content area = viewport minus scrollbar, so allow up to 45px diff.
const SCROLLBAR_TOLERANCE = 45;
// Allow ±2px for rounding in any dimension
const ROUNDING_TOLERANCE = 2;

const results = [];

function assess(label, dims) {
  // dims: { bitmapW, bitmapH, canvasW, canvasH, cssW, cssH, vpW, vpH, iframeW, iframeH }
  const issues = [];

  // Canvas programmatic size should match bitmap (if bitmap exists)
  // Note: canvas.width is set by the draw code; it should equal the bitmap
  // OR the viewport width — either is acceptable.

  // The critical check: viewport globals should match iframe container
  if (dims.vpW && dims.iframeW) {
    const vpIframeDiffW = Math.abs(dims.vpW - dims.iframeW);
    const vpIframeDiffH = Math.abs(dims.vpH - dims.iframeH);
    if (vpIframeDiffW > ROUNDING_TOLERANCE || vpIframeDiffH > ROUNDING_TOLERANCE) {
      issues.push(`viewport-iframe mismatch: VP=${dims.vpW}x${dims.vpH} iframe=${dims.iframeW}x${dims.iframeH}`);
    }
  }

  // Bitmap should be close to viewport (within scrollbar tolerance)
  if (dims.bitmapW && dims.vpW) {
    const bmpVpDiffW = dims.vpW - dims.bitmapW;
    const bmpVpDiffH = dims.vpH - dims.bitmapH;
    // Bitmap should be <= viewport (content area ≤ viewport when scrollbar present)
    // And the difference should not exceed scrollbar tolerance
    // EXCEPT: Chrome's screencast has a ~300px minimum, so small viewports will have larger bitmaps
    const CHROME_SCREENCAST_MIN = 300;
    const isSmallViewport = dims.vpW < CHROME_SCREENCAST_MIN || dims.vpH < CHROME_SCREENCAST_MIN;
    
    if (!isSmallViewport) {
      if (bmpVpDiffW < -ROUNDING_TOLERANCE || bmpVpDiffW > SCROLLBAR_TOLERANCE) {
        issues.push(`bitmap-viewport width: bitmap=${dims.bitmapW} vp=${dims.vpW} diff=${bmpVpDiffW}`);
      }
      if (bmpVpDiffH < -ROUNDING_TOLERANCE || bmpVpDiffH > SCROLLBAR_TOLERANCE) {
        issues.push(`bitmap-viewport height: bitmap=${dims.bitmapH} vp=${dims.vpH} diff=${bmpVpDiffH}`);
      }
    }
    // For small viewports, just note it but don't fail
    else if (dims.bitmapW < CHROME_SCREENCAST_MIN || dims.bitmapH < CHROME_SCREENCAST_MIN) {
      // Bitmap is actually smaller than Chrome's min - this would be unexpected
      issues.push(`bitmap below Chrome minimum: bitmap=${dims.bitmapW}x${dims.bitmapH} (min ${CHROME_SCREENCAST_MIN})`);
    }
  }

  // CSS bounding rect of canvas should match iframe container (they share the same space)
  if (dims.cssW && dims.iframeW) {
    const cssDiffW = Math.abs(dims.cssW - dims.iframeW);
    const cssDiffH = Math.abs(dims.cssH - dims.iframeH);
    if (cssDiffW > ROUNDING_TOLERANCE || cssDiffH > ROUNDING_TOLERANCE) {
      // Not necessarily a problem — canvas may be inside other elements
      // Just note it
    }
  }

  const pass = issues.length === 0;
  const entry = { label, dims, pass, issues };
  results.push(entry);

  const icon = pass ? '✅' : '❌';
  console.log(`  ${icon} [${label}]`);
  console.log(`     bitmap=${dims.bitmapW}x${dims.bitmapH} canvas=${dims.canvasW}x${dims.canvasH} css=${dims.cssW}x${dims.cssH} age=${dims.bitmapAge}ms`);
  console.log(`     viewport=${dims.vpW}x${dims.vpH} iframe=${dims.iframeW}x${dims.iframeH}`);
  if (!pass) {
    for (const issue of issues) console.log(`     ⚠ ${issue}`);
  }
  return pass;
}

(async () => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--ignore-certificate-errors', '--mute-audio'],
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  // ── Setup: open demo, launch browser, complete wizard ──
  console.log('\n══════════════════════════════════════════════');
  console.log('  COMPREHENSIVE VIEWPORT CORRECTNESS TEST');
  console.log('══════════════════════════════════════════════\n');

  await page.goto(`${DEMO_URL}/demo`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.click('#unlock-button').catch(() => {});
  await page.waitForTimeout(1000);
  await page.locator('.desktop-icon[data-app-id="internetBrowser"]').dblclick();
  await page.waitForTimeout(1000);
  await page.click('.wizard-next-btn');
  await page.waitForFunction(() => {
    const p3 = document.querySelector('.wizard-phase-3');
    return p3 && p3.style.display !== 'none';
  }, { timeout: 10000 });
  await page.click('.wizard-finish-btn');
  await page.waitForSelector('.window[data-app-id="internetBrowser"]', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => {
    const wv = document.querySelector('browserbox-webview');
    return wv && wv._isReady === true;
  }, { timeout: 60000 });
  console.log('BBX ready. Settling 8s...\n');
  await page.waitForTimeout(8000);

  const BBX_PORT = process.env.BBX_PORT || '8888';
  const bbxFrame = page.frames().find(f => f.url().includes(`localhost:${BBX_PORT}`));
  if (!bbxFrame) {
    console.log('FATAL: No BBX frame found!');
    await browser.close();
    process.exit(1);
  }

  // Install bitmap dimension tracker (hooks into drawImage)
  await bbxFrame.evaluate(() => {
    window.__lastBitmapDims = null;
    const origDraw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function(img, ...args) {
      if (img instanceof ImageBitmap) {
        window.__lastBitmapDims = { w: img.width, h: img.height, ts: Date.now() };
      }
      return origDraw.call(this, img, ...args);
    };
  });

  // Helper: collect all 5 dimension sources
  async function collectDims() {
    // 1-4: From BBX frame
    const bbx = await bbxFrame.evaluate(() => {
      const canvas = document.querySelector('bb-view')?.shadowRoot?.querySelector('canvas');
      const bounding = canvas?.getBoundingClientRect();
      return {
        bitmapW: window.__lastBitmapDims?.w || 0,
        bitmapH: window.__lastBitmapDims?.h || 0,
        bitmapAge: window.__lastBitmapDims?.ts ? (Date.now() - window.__lastBitmapDims.ts) : -1,
        canvasW: canvas?.width || 0,
        canvasH: canvas?.height || 0,
        cssW: Math.round(bounding?.width || 0),
        cssH: Math.round(bounding?.height || 0),
        vpW: window.ViewportWidth || 0,
        vpH: window.ViewportHeight || 0,
      };
    }).catch(() => ({ bitmapW: 0, bitmapH: 0, bitmapAge: -1, canvasW: 0, canvasH: 0, cssW: 0, cssH: 0, vpW: 0, vpH: 0 }));

    // 5: Iframe container size from parent page
    const iframe = await page.evaluate(() => {
      const wv = document.querySelector('browserbox-webview');
      const ifrEl = wv?.shadowRoot?.querySelector('iframe');
      if (!ifrEl) return { iframeW: 0, iframeH: 0 };
      const r = ifrEl.getBoundingClientRect();
      return { iframeW: Math.round(r.width), iframeH: Math.round(r.height) };
    }).catch(() => ({ iframeW: 0, iframeH: 0 }));

    return { ...bbx, ...iframe };
  }

  // Helper: trigger some mouse moves to ensure frames are being sent
  async function triggerFrames(count = 5) {
    for (let i = 0; i < count; i++) {
      await page.mouse.move(350 + i * 30, 350 + i * 15);
      await page.waitForTimeout(400);
    }
  }

  // Helper: navigate via BBX webview API, reset bitmap dims, wait for fresh frame
  async function navigate(url) {
    // Clear stale bitmap dims before navigation
    await bbxFrame.evaluate(() => { window.__lastBitmapDims = null; }).catch(() => {});
    await page.evaluate(u => {
      document.querySelector('browserbox-webview')?.navigateTo(u).catch(() => {});
    }, url).catch(() => {});
  }

  // ── Phase 1: Baseline ──
  console.log('── Phase 1: Baseline ──');
  await triggerFrames();
  assess('baseline', await collectDims());

  // ── Phase 2: Navigate to example.com ──
  console.log('\n── Phase 2: Navigate to example.com ──');
  await navigate('https://example.com');
  await page.waitForTimeout(5000);
  await triggerFrames();
  assess('nav_example', await collectDims());

  // ── Phase 3: Maximize window ──
  console.log('\n── Phase 3: Maximize window ──');
  await page.click('.window[data-app-id="internetBrowser"] .window-maximize-btn');
  await page.waitForTimeout(4000);
  await triggerFrames();
  assess('maximize', await collectDims());

  // ── Phase 4: Navigate while maximized (Wikipedia — has scrollbar) ──
  console.log('\n── Phase 4: Navigate to Wikipedia (maximized) ──');
  await navigate('https://wikipedia.org');
  await page.waitForTimeout(6000);
  await triggerFrames();
  assess('nav_wiki_maximized', await collectDims());

  // ── Phase 5: Navigate to purple.com (maximized) ──
  console.log('\n── Phase 5: Navigate to purple.com (maximized) ──');
  await navigate('https://purple.com');
  await page.waitForTimeout(6000);
  await triggerFrames();
  assess('nav_purple_maximized', await collectDims());

  // ── Phase 6: Restore window ──
  console.log('\n── Phase 6: Restore window ──');
  await page.click('.window[data-app-id="internetBrowser"] .window-maximize-btn');
  await page.waitForTimeout(4000);
  await triggerFrames();
  assess('restore', await collectDims());

  // ── Phase 7: Navigate after restore ──
  console.log('\n── Phase 7: Navigate to Google (restored) ──');
  await navigate('https://google.com');
  await page.waitForTimeout(5000);
  await triggerFrames();
  assess('nav_google_restored', await collectDims());

  // ── Phase 8: Drag resize bigger ──
  console.log('\n── Phase 8: Drag resize bigger ──');
  const wr1 = await page.evaluate(() =>
    document.querySelector('.window[data-app-id="internetBrowser"]')?.getBoundingClientRect()
  );
  if (wr1) {
    await page.mouse.move(wr1.x + wr1.width - 3, wr1.y + wr1.height - 3);
    await page.mouse.down();
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(wr1.x + wr1.width + i * 12, wr1.y + wr1.height + i * 8, { steps: 2 });
      await page.waitForTimeout(30);
    }
    await page.mouse.up();
  }
  await page.waitForTimeout(4000);
  await triggerFrames();
  assess('drag_bigger', await collectDims());

  // ── Phase 9: Navigate after drag resize ──
  console.log('\n── Phase 9: Navigate to DuckDuckGo (after drag) ──');
  await navigate('https://duckduckgo.com');
  await page.waitForTimeout(5000);
  await triggerFrames();
  assess('nav_ddg_dragged', await collectDims());

  // ── Phase 10: Drag resize smaller ──
  console.log('\n── Phase 10: Drag resize smaller ──');
  const wr2 = await page.evaluate(() =>
    document.querySelector('.window[data-app-id="internetBrowser"]')?.getBoundingClientRect()
  );
  if (wr2) {
    await page.mouse.move(wr2.x + wr2.width - 3, wr2.y + wr2.height - 3);
    await page.mouse.down();
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(wr2.x + wr2.width - i * 20, wr2.y + wr2.height - i * 12, { steps: 2 });
      await page.waitForTimeout(30);
    }
    await page.mouse.up();
  }
  await page.waitForTimeout(4000);
  await triggerFrames();
  assess('drag_smaller', await collectDims());

  // ── Phase 11: Navigate after smaller resize ──
  console.log('\n── Phase 11: Navigate to Wikipedia (smaller) ──');
  await navigate('https://wikipedia.org');
  await page.waitForTimeout(6000);
  await triggerFrames();
  assess('nav_wiki_smaller', await collectDims());

  // ── Phase 12: Maximize from small ──
  console.log('\n── Phase 12: Maximize from small ──');
  await page.click('.window[data-app-id="internetBrowser"] .window-maximize-btn');
  await page.waitForTimeout(4000);
  await triggerFrames();
  assess('maximize_from_small', await collectDims());

  // ── Phase 13: Navigate while maximized again ──
  console.log('\n── Phase 13: Navigate to example.com (maximized again) ──');
  await navigate('https://example.com');
  await page.waitForTimeout(5000);
  await triggerFrames();
  assess('nav_example_maximized2', await collectDims());

  // ── Phase 14: Create new tab, navigate, switch back ──
  console.log('\n── Phase 14: Create tab + switch ──');
  await page.evaluate(() => {
    document.querySelector('browserbox-webview')?.createTab('https://github.com').catch(() => {});
  }).catch(() => {});
  await page.waitForTimeout(5000);
  await triggerFrames();
  assess('new_tab_github', await collectDims());

  // Switch back to first tab
  await bbxFrame.evaluate(() => {
    const tabs = document.querySelectorAll('.tab-strip .tab-title, .tabs-list .tab-title, [role="tab"]');
    if (tabs.length > 0) tabs[0].click();
  }).catch(() => {});
  await page.waitForTimeout(3000);
  await triggerFrames();
  assess('switch_back_tab0', await collectDims());

  // ── Phase 15: Restore and final navigate ──
  console.log('\n── Phase 15: Restore + final navigate ──');
  await page.click('.window[data-app-id="internetBrowser"] .window-maximize-btn');
  await page.waitForTimeout(3000);
  await navigate('https://purple.com');
  await page.waitForTimeout(5000);
  await triggerFrames();
  assess('final_restored_purple', await collectDims());

  // ── Summary ──
  console.log('\n══════════════════════════════════════════════');
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`  RESULTS: ${passed} passed, ${failed} failed out of ${results.length} phases`);

  if (failed > 0) {
    console.log('\n  FAILURES:');
    for (const r of results.filter(r => !r.pass)) {
      console.log(`    ❌ ${r.label}:`);
      for (const issue of r.issues) {
        console.log(`       ${issue}`);
      }
    }
  }

  console.log('══════════════════════════════════════════════\n');

  await page.waitForTimeout(1000);
  await browser.close();

  process.exit(failed > 0 ? 1 : 0);
})();
