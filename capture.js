// Capture the four screenshots listed in shots.json, inside this process:
// start our own local server, drive headless Chromium, save JPEGs that fit.
import puppeteer from '/home/hatch/workspace/makefun-entries/threejs-fps-02/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const shots = JSON.parse(readFileSync(join(repoRoot, 'shots.json'), 'utf8'));
const policyFile = '/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt';
const policyHash = createHash('sha256').update(readFileSync(policyFile)).digest('hex');
const MAX_BYTES = 250 * 1024;

const serverChild = spawn('node', ['serve.ts'], { cwd: repoRoot, stdio: 'pipe' });
let serverExited = false;
serverChild.on('exit', () => { serverExited = true; });

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const res = await fetch('http://localhost:8080/');
      if (res.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

let browser;
try {
  const up = await waitForServer();
  if (!up) throw new Error('local server did not respond on http://localhost:8080/');
  browser = await puppeteer.launch({
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
      '--hide-scrollbars',
      '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessChecks',
      '--allow-insecure-localhost',
    ],
  });
  mkdirSync(join(repoRoot, 'screenshots'), { recursive: true });
  for (const shot of shots) {
    const page = await browser.newPage();
    await page.setViewport({ width: shot.w, height: shot.h });
    const httpUrl = `http://localhost:8080/${shot.query}`;
    try {
      await page.goto(httpUrl, { waitUntil: 'load', timeout: 60000 });
    } catch (err) {
      if (String(err && err.message).includes('ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS')) {
        const fileUrl = `file://${join(repoRoot, 'app', 'index.html')}${shot.query}`;
        await page.goto(fileUrl, { waitUntil: 'load', timeout: 60000 });
      } else {
        throw err;
      }
    }
    // If the page loaded but shot mode never engaged due to a blocked navigation, fall back once.
    const readyProbe = await page.evaluate(() => window.__shotReady === true).catch(() => false);
    if (!readyProbe) {
      try {
        await page.waitForFunction(() => window.__shotReady === true, { timeout: 8000 });
      } catch {
        const fileUrl = `file://${join(repoRoot, 'app', 'index.html')}${shot.query}`;
        await page.goto(fileUrl, { waitUntil: 'load', timeout: 60000 });
        await page.waitForFunction(() => window.__shotReady === true, { timeout: 30000 });
      }
    } else {
      await page.waitForFunction(() => window.__shotReady === true, { timeout: 30000 });
    }
    await new Promise((r) => setTimeout(r, 400));
    const target = join(repoRoot, 'screenshots', shot.name);
    let quality = 85;
    for (;;) {
      await page.screenshot({ path: target, type: 'jpeg', quality });
      const size = statSync(target).size;
      if (size <= MAX_BYTES || quality <= 30) break;
      quality -= 10;
    }
    console.log(`shot ${shot.name} ${shot.w}x${shot.h} q=${quality} bytes=${statSync(target).size}`);
    await page.close();
  }
} finally {
  if (browser) await browser.close();
  if (!serverExited) serverChild.kill('SIGTERM');
}
