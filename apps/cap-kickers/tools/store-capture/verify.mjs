// Reads the PNG header of every generated file and checks it against devices.mjs.
// Run this before uploading anything: a wrong-sized screenshot is rejected at
// upload time on Play, and silently lands in the wrong slot on the App Store.
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { DEVICES, LOCALES } from './devices.mjs';

const OUT = path.resolve(process.argv[2] || '../../store-assets/screenshots');

// PNG: 8-byte signature, then IHDR length+type (8), then width/height as BE uint32.
const pngSize = async (f) => {
  const b = await readFile(f);
  if (b.length < 24 || b.readUInt32BE(12) !== 0x49484452) return null; // 'IHDR'
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

let bad = 0, ok = 0, missing = 0;
for (const dev of DEVICES) {
  for (const locale of LOCALES) {
    const dir = path.join(OUT, `${dev.store}-${dev.id}`, locale);
    if (!existsSync(dir)) { console.log(`- missing  ${dev.store}/${dev.id}/${locale}`); missing++; continue; }
    const files = (await readdir(dir)).filter((f) => f.endsWith('.png')).sort();
    for (const f of files) {
      const full = path.join(dir, f);
      const size = await pngSize(full);
      const bytes = (await stat(full)).size;
      const want = dev.px;
      if (!size || size[0] !== want[0] || size[1] !== want[1]) {
        console.log(`x WRONG   ${dev.store}/${dev.id}/${locale}/${f}  got ${size ? size.join('x') : '?'} want ${want.join('x')}`);
        bad++;
      } else {
        // Play rejects >8MB per image; App Store is more generous but keep an eye out.
        const warn = bytes > 8 * 1024 * 1024 ? '  !! >8MB, Play will reject' : '';
        console.log(`  ok      ${dev.store}/${dev.id}/${locale}/${f}  ${size.join('x')}  ${(bytes / 1e6).toFixed(1)}MB${warn}`);
        ok++;
      }
    }
    // Play minimums: phone >=2 (>=4 for promo eligibility), tablets >=4.
    const min = dev.store === 'play' ? (dev.id === 'phone' ? 4 : 4) : 1;
    if (files.length < min) console.log(`! ${dev.store}/${dev.id}/${locale}: ${files.length} shots, store wants >= ${min}`);
    if (files.length > (dev.store === 'play' ? 8 : 10)) console.log(`! ${dev.store}/${dev.id}/${locale}: too many shots`);
  }
}
console.log(`\n${ok} ok, ${bad} wrong size, ${missing} folders missing`);
process.exit(bad ? 1 : 0);
