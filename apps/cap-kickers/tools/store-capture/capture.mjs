// Store screenshot capture. One command regenerates every size x every locale.
//
//   node capture.mjs --base http://localhost:8080
//   node capture.mjs --base http://localhost:8080 --only appstore
//   node capture.mjs --base http://localhost:8080 --dump-state   (see README)
//
// Writes store-assets/screenshots/<store>-<device>/<locale>/NN-name.png and
// hard-fails if any file comes out at the wrong pixel size.
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { DEVICES, LOCALES, ROUTES } from './devices.mjs';

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };
const flag = (n) => process.argv.includes('--' + n);

const BASE = arg('base', 'http://localhost:8080');
const ONLY = arg('only', null);           // 'appstore' | 'play'
const DEVFILTER = arg('devices', null);   // comma list of device ids
const LOCFILTER = arg('locales', null);   // comma list of locales
const OUT  = path.resolve(arg('out', '../../store-assets/screenshots'));
const SETTLE = Number(arg('settle', 3000)); // ms after networkidle, for fonts/canvas

// localStorage applied before every page load. seed.json is optional; without it
// you get a fresh profile, which makes the shop/pitch screens look sparse.
const BASE_STATE = { 'capkickers.tutorial.v1': '1' };

const loadSeed = async () => {
  const f = path.resolve('./seed.json');
  if (!existsSync(f)) { console.warn('! no seed.json — capturing a FRESH profile (screens will look sparse)'); return {}; }
  return JSON.parse(await readFile(f, 'utf8'));
};

const dumpState = async (browser) => {
  const ctx = await browser.newContext({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  console.log('\nPlay the app in the window that opened. Unlock what you want in the shots.');
  console.log('Press Enter here when the save state looks right...');
  await new Promise((r) => process.stdin.once('data', r));
  const state = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  await writeFile(path.resolve('./seed.json'), JSON.stringify(state, null, 2));
  console.log('Wrote seed.json with', Object.keys(state).length, 'keys');
  await ctx.close();
};

const run = async () => {
  // CHROMIUM_PATH lets a machine with a pre-installed browser (a CI image, or a
  // sandbox that pins its own Chromium) skip `npx playwright install`.
  const browser = await chromium.launch({
    headless: !flag('dump-state'),
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  });
  if (flag('dump-state')) { await dumpState(browser); await browser.close(); return; }

  const seed = await loadSeed();
  const devices = DEVICES.filter((d) => (!ONLY || d.store === ONLY) && (!DEVFILTER || DEVFILTER.split(',').includes(d.id)));
  const locales = LOCALES.filter((l) => !LOCFILTER || LOCFILTER.split(',').includes(l));
  const problems = [];
  let n = 0;

  for (const dev of devices) {
    const [pw, ph] = dev.px, [lw, lh] = dev.logical;
    if (lw * dev.dpr !== pw || lh * dev.dpr !== ph) {
      throw new Error(`${dev.store}/${dev.id}: logical ${lw}x${lh} @${dev.dpr} != ${pw}x${ph}`);
    }
    for (const locale of locales) {
      const ctx = await browser.newContext({
        viewport: { width: lw, height: lh },
        deviceScaleFactor: dev.dpr,
        isMobile: dev.mobile,
        hasTouch: dev.mobile,
        locale,
      });
      const state = { ...BASE_STATE, ...seed, 'capkickers.locale.v1': locale };
      await ctx.addInitScript((s) => {
        try { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); } catch (e) {}
      }, state);

      const page = await ctx.newPage();
      const dir = path.join(OUT, `${dev.store}-${dev.id}`, locale);
      await mkdir(dir, { recursive: true });

      for (const [name, route] of ROUTES) {
        await page.goto(BASE + route, { waitUntil: 'networkidle' });
        await page.waitForTimeout(SETTLE);
        const file = path.join(dir, `${name}.png`);
        await page.screenshot({ path: file });          // opaque: no alpha, which the App Store forbids
        const box = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
        if (box.w !== lw || box.h !== lh) problems.push(`${dev.id}/${locale}/${name}: viewport drifted to ${box.w}x${box.h}`);
        n++;
      }
      console.log(`${dev.store}/${dev.id} ${locale.padEnd(5)} -> ${dir}`);
      await ctx.close();
    }
  }
  await browser.close();
  console.log(`\n${n} screenshots.`);
  if (problems.length) { console.error('PROBLEMS:\n' + problems.join('\n')); process.exit(1); }
  console.log('Verify pixel sizes with: node verify.mjs');
};

run().catch((e) => { console.error(e); process.exit(1); });
