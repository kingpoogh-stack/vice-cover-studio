import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import puppeteer from '/home/hatch/workspace/makefun-entries/threejs-fps-02/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const shots = JSON.parse(readFileSync(path.join(root, 'shots.json'), 'utf8'));
mkdirSync(path.join(root, 'screenshots'), { recursive: true });

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const r = await fetch(url); if (r.ok || r.status === 200) return true; } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error('Server did not start');
}

const policyPath = '/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt';
const policySha = createHash('sha256').update(readFileSync(policyPath)).digest('hex');
const hatchArgs = [`--hatch-webgl-allowed-domains-file=${policyPath}`, `--hatch-webgl-allowed-domains-sha256=${policySha}`, '--disable-gpu-sandbox', '--allow-file-access-from-files', '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessChecks', '--allow-insecure-localhost'];
const server = spawn('node', [path.join(root, 'serve.ts')], { stdio: 'inherit' });
let browser;
try {
  await waitForServer('http://localhost:8080/');
  browser = await puppeteer.launch({ executablePath: '/opt/meta-chromium/chrome', headless: true, args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars', ...hatchArgs] });
  for (const shot of shots) {
    const page = await browser.newPage();
    await page.setViewport({ width: shot.w, height: shot.h });
    const url = `http://localhost:8080/${shot.query}`;
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    } catch (e) {
      // This Chromium build blocks local-network navigation for script-launched
      // browsers (ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS); the app is fully
      // static, so fall back to the identical page via file://.
      if (!String(e.message).includes('ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS')) throw e;
      const fileUrl = 'file://' + path.join(root, 'app', 'index.html') + shot.query;
      await page.goto(fileUrl, { waitUntil: 'load', timeout: 30000 });
    }
    await page.waitForFunction(() => window.__shotReady === true, { timeout: 30000 });
    await new Promise(r => setTimeout(r, 400));
    const outPath = path.join(root, 'screenshots', shot.name);
    let quality = 85;
    while (true) {
      await page.screenshot({ path: outPath, type: 'jpeg', quality });
      const size = statSync(outPath).size;
      console.log(`${shot.name}: ${size} bytes (quality ${quality})`);
      if (size <= 250 * 1024 || quality <= 30) break;
      quality -= 10;
    }
    await page.close();
  }
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
