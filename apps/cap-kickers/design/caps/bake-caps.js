const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const HTML = "file://" + path.resolve(
  "/Users/leandroviolim/Developer/solevia-cap-kickers/apps/cap-kickers/design/caps/bake-metal-cap.html",
);
const OUT = "/Users/leandroviolim/Developer/solevia-cap-kickers/apps/cap-kickers/public/caps-sprites";
const IDS = ["metal-silver", "metal-red", "metal-blue", "metal-green", "metal-orange", "metal-purple"];
const SIZE = Number(process.argv[2] || 256); // on-screen cap is ~80px; 256 = ~3x, plenty

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ channel: "chrome", headless: true });
  const page = await b.newPage();
  for (const id of IDS) {
    await page.goto(`${HTML}?id=${id}`, { waitUntil: "load" });
    await page.waitForFunction(() => window.__ready === true, { timeout: 4000 }).catch(() => {});
    // Downscale the 512 render to SIZE and export WebP (keeps alpha).
    const dataUrl = await page.evaluate((size) => {
      const src = document.getElementById("c");
      const d = document.createElement("canvas");
      d.width = size; d.height = size;
      const x = d.getContext("2d");
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
      x.drawImage(src, 0, 0, size, size);
      return d.toDataURL("image/webp", 0.85);
    }, SIZE);
    const base64 = dataUrl.replace(/^data:image\/webp;base64,/, "");
    const file = `${OUT}/${id}.webp`;
    fs.writeFileSync(file, Buffer.from(base64, "base64"));
    console.log(`wrote ${id}.webp  ${fs.statSync(file).size} bytes  (${SIZE}px)`);
  }
  await b.close();
})();
