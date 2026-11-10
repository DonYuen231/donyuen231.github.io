// Renders the default social preview image (1200×630) to public/og-default.png.
// Run once with `node scripts/make-og.mjs` and commit the PNG.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const font = (pkg, file) =>
  pathToFileURL(join(root, 'node_modules', '@fontsource', pkg, 'files', file))
    .href;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'IBM Plex Sans';
    font-weight: 700;
    src: url('${font('ibm-plex-sans', 'ibm-plex-sans-latin-700-normal.woff2')}') format('woff2');
  }
  @font-face {
    font-family: 'IBM Plex Mono';
    font-weight: 500;
    src: url('${font('ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff2')}') format('woff2');
  }
  html, body { margin: 0; }
  body {
    width: 1200px;
    height: 630px;
    box-sizing: border-box;
    padding: 96px;
    background: #111827;
    color: #f9fafb;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .rule { width: 72px; height: 6px; background: #fbbf24; margin-bottom: 40px; }
  h1 { margin: 0; font: 700 112px/1.02 'IBM Plex Sans'; letter-spacing: -0.01em; }
  p { margin: 32px 0 0; font: 500 36px/1.3 'IBM Plex Mono'; color: #fbbf24; }
</style>
</head>
<body>
  <div class="rule"></div>
  <h1>Don Yuen</h1>
  <p>Projects with demos you can try</p>
</body>
</html>`;

const dir = mkdtempSync(join(tmpdir(), 'og-'));
const file = join(dir, 'og.html');
writeFileSync(file, html);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });
  await page.goto(pathToFileURL(file).href);
  const loaded = await page.evaluate(async () => {
    const faces = await Promise.all(
      ['700 16px "IBM Plex Sans"', '500 16px "IBM Plex Mono"'].map((f) =>
        document.fonts.load(f),
      ),
    );
    return faces.every((list) => list.length > 0);
  });
  if (!loaded) throw new Error('IBM Plex fonts did not load');
  const out = join(root, 'public', 'og-default.png');
  await page.screenshot({ path: out });
  console.log(`Wrote ${out}`);
} finally {
  await browser.close();
  rmSync(dir, { recursive: true, force: true });
}
