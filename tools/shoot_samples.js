// Render the three built-in sample photos from the Three.js scenes.
import puppeteer from '/home/hatch/workspace/makefun-entries/threejs-fps-02/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const policyFile = '/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt';
const policyHash = createHash('sha256').update(readFileSync(policyFile)).digest('hex');

const browser = await puppeteer.launch({
  executablePath: '/opt/meta-chromium/chrome',
  headless: true,
  args: [
    '--no-sandbox',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    `--hatch-webgl-allowed-domains-file=${policyFile}`,
    `--hatch-webgl-allowed-domains-sha256=${policyHash}`,
    '--disable-gpu-sandbox',
    '--allow-file-access-from-files',
  ],
});

mkdirSync(join(repoRoot, 'app', 'samples'), { recursive: true });
for (const sceneName of ['boulevard', 'harbor', 'pier']) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const sceneUrl = `file://${join(repoRoot, 'tools', 'scene.html')}?scene=${sceneName}`;
  await page.goto(sceneUrl, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__sceneReady === true, { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const target = join(repoRoot, 'app', 'samples', `${sceneName}.jpg`);
  await page.screenshot({ path: target, type: 'jpeg', quality: 88 });
  console.log(`sample ${sceneName} -> ${target}`);
  await page.close();
}
await browser.close();
