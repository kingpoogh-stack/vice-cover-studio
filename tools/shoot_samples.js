import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from '/home/hatch/workspace/makefun-entries/threejs-fps-02/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const toolsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(toolsDir);
const DOMAINS_FILE = '/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt';
const domainsSha = createHash('sha256').update(readFileSync(DOMAINS_FILE)).digest('hex');
const SCENES = ['boulevard', 'pier', 'harbor'];

async function main() {
  mkdirSync(join(repoRoot, 'app', 'samples'), { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: '/opt/meta-chromium/chrome',
    args: [
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      `--hatch-webgl-allowed-domains-file=${DOMAINS_FILE}`,
      `--hatch-webgl-allowed-domains-sha256=${domainsSha}`,
      '--no-sandbox',
      '--disable-gpu-sandbox',
      '--allow-file-access-from-files',
    ],
  });
  try {
    for (const name of SCENES) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });
      const url = pathToFileURL(join(toolsDir, 'scene.html')).href + `?scene=${name}`;
      await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(() => window.__sceneReady === true, { timeout: 60000 });
      const sceneError = await page.evaluate(() => window.__sceneError || null);
      if (sceneError) console.error(sceneError);
      await new Promise((r) => setTimeout(r, 250));
      const outPath = join(repoRoot, 'app', 'samples', `${name}.jpg`);
      await page.screenshot({ path: outPath, type: 'jpeg', quality: 88 });
      console.log(outPath);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
