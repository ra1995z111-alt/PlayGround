#!/usr/bin/env bash
set -euo pipefail

CAPTURE_URL="${CAPTURE_URL:-http://127.0.0.1:${PORT:-3000}}"
CAPTURE_DIR="${CAPTURE_DIR:-/tmp/opencode/capture}"
mkdir -p "$CAPTURE_DIR"

log() {
  printf '[capture.sh] %s\n' "$*" >&2
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log "Required command not found: $cmd"
    exit 1
  fi
}

fail_with_code() {
  local code="$1"
  local message="$2"
  log "$message"
  exit "$code"
}

require_cmd curl

log "Waiting for page to respond at $CAPTURE_URL"
if ! /usr/bin/time -p bash -lc "for attempt in 1 2 3 4 5 6 7 8 9 10; do curl --silent --show-error --fail --location --max-time 10 '$CAPTURE_URL' >/dev/null 2>&1 && exit 0; sleep 1; done; exit 75" 2>&1 | sed 's/^/[http-check] /'; then
  fail_with_code 75 "Temporary navigation/browser infrastructure failure while waiting for the page"
fi

export CAPTURE_URL CAPTURE_DIR
/usr/bin/time -p node --input-type=commonjs - <<'NODE'
(async () => {
  const { chromium } = require('/home/runner/.local/share/omgithub-playwright/node_modules/playwright');
  const fs = require('fs');
  const { join } = require('path');
  const runtime = '/home/runner/.local/share/omgithub-playwright';
  const display = fs.readFileSync(join(runtime, 'display'), 'utf8').trim();
  process.env.DISPLAY ||= ':' + display;
  const url = process.env.CAPTURE_URL;
  const output = process.env.CAPTURE_DIR;
  if (!url || !output) {
    throw Object.assign(new Error('Set CAPTURE_URL and CAPTURE_DIR.'), { exitCode: 1 });
  }
  fs.mkdirSync(output, { recursive: true });
  const config = JSON.parse(fs.readFileSync(join(runtime, 'linux.json'), 'utf8'));
  const transient = error => {
    throw Object.assign(error, { exitCode: 75 });
  };
  let browser;
  try {
    browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }).catch(transient);
    for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
      const page = await browser.newPage({ viewport: { width, height } }).catch(transient);
      page.setDefaultTimeout(30000);
      const response = await page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(transient);
      if (!response?.ok()) {
        throw Object.assign(new Error(`HTTP ${response?.status()} loading preview`), { exitCode: !response || [408, 429, 500, 502, 503, 504].includes(response.status()) ? 75 : 1 });
      }
      await page.locator('body').waitFor({ state: 'visible' });
      await page.waitForFunction(() => document.fonts.status === 'loaded');
      await page.waitForTimeout(1000);
      const out = join(output, `final-${name}.png`);
      await page.screenshot({ path: out, timeout: 30000 }).catch(error => {
        if (error.name === 'TimeoutError' || !browser.isConnected()) transient(error);
        throw error;
      });
      if (!fs.existsSync(out) || fs.statSync(out).size === 0) {
        throw Object.assign(new Error(`Empty screenshot for ${name}`), { exitCode: 1 });
      }
      await page.close();
    }
  } catch (error) {
    if (error.exitCode === 75) {
      console.error('[capture.js] Temporary navigation/browser infrastructure failure');
    } else {
      console.error('[capture.js] Rendering defect');
      console.error(error);
    }
    process.exitCode = error.exitCode || 1;
  } finally {
    if (browser) await browser.close().catch(error => {
      console.error('[capture.js] Browser close failure');
      console.error(error);
      process.exitCode ||= 75;
    });
  }
})();
NODE

if [[ ! -f "$CAPTURE_DIR/final-desktop.png" ]] || [[ ! -f "$CAPTURE_DIR/final-mobile.png" ]]; then
  fail_with_code 1 "Script defect: one or more final capture images are missing"
fi

log "Saved desktop capture to $CAPTURE_DIR/final-desktop.png"
log "Saved mobile capture to $CAPTURE_DIR/final-mobile.png"
