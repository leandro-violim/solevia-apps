// Composed ad + feature-graphic images, rendered from ads-template.html.
//   node ads.mjs --base http://localhost:8080
//
// Sizes verified 2026-09-06:
//   Play feature graphic  1024x500  (required, no alpha)
//   Google Ads App campaign images: 1.91:1 1200x628 | 1:1 1200x1200 | 4:5 1200x1500
//   (max 20 per ratio, jpg/png, <=5MB). Apple Ads needs NO image assets — its
//   Search Results creative is generated from the App Store product page.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { LOCALES } from './devices.mjs';

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:8080');
const ART  = arg('art', '');                       // e.g. /hero/new-key-art.jpg
const OUT  = path.resolve(arg('out', '../../store-assets/ads/image'));
const TPL  = arg('tpl', 'tools/store-capture/ads-template.html'); // served by the dev server

const SIZES = [
  ['play-feature-graphic', 1024,  500],
  ['gads-landscape',       1200,  628],
  ['gads-square',          1200, 1200],
  ['gads-portrait',        1200, 1500],
];

const run = async () => {
  const browser = await chromium.launch();
  for (const locale of LOCALES) {
    const dir = path.join(OUT, locale);
    await mkdir(dir, { recursive: true });
    for (const [name, w, h] of SIZES) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const qs = new URLSearchParams({ w, h, locale, ...(ART ? { art: ART } : {}) });
      await page.goto(`${BASE}/${TPL}?${qs}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(dir, `${name}.png`) });
      console.log(`${locale.padEnd(5)} ${name.padEnd(22)} ${w}x${h}`);
      await ctx.close();
    }
  }
  await browser.close();
  console.log('\nFeature graphic -> Play listing. gads-* -> Google Ads App campaign assets.');
  console.log('Apple Ads: nothing to upload — it reads the App Store product page.');
};
run().catch((e) => { console.error(e); process.exit(1); });
