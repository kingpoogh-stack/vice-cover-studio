import puppeteer from '/home/hatch/workspace/makefun-entries/threejs-fps-02/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import { mkdirSync, statSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = path.join(root, 'app', 'samples');
mkdirSync(outDir, { recursive: true });
const scenes = ['boulevard', 'pier', 'harbor'];

const policyPath = '/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt';
const policySha = createHash('sha256').update(readFileSync(policyPath)).digest('hex');
const browser = await puppeteer.launch({
  executablePath: '/opt/meta-chromium/chrome',
  headless: true,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--disable-gpu-sandbox', '--allow-file-access-from-files', `--hatch-webgl-allowed-domains-file=${policyPath}`, `--hatch-webgl-allowed-domains-sha256=${policySha}`],
});
try {
  for (const name of scenes) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 960 });
    const url = 'file://' + path.join(root, 'tools', 'scene.html') + '?scene=' + name;
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(() => window.__sceneReady === true, { timeout: 30000 });
    await new Promise(r => setTimeout(r, 500));
    const outPath = path.join(outDir, name + '.jpg');
    await page.screenshot({ path: outPath, type: 'jpeg', quality: 88 });
    console.log(name + '.jpg: ' + statSync(outPath).size + ' bytes');
    await page.close();
  }
} finally {
  await browser.close();
}
