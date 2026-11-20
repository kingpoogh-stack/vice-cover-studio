import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from '/home/hatch/workspace/makefun-entries/threejs-fps-02/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const root = dirname(fileURLToPath(import.meta.url));
const domainsFile = '/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt';
const sha = createHash('sha256').update(readFileSync(domainsFile)).digest('hex');
const MAX_BYTES = 250 * 1024;

function waitForServer(url, tries) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      fetch(url).then((res) => {
        if (res.ok) resolve(true);
        else if (n > 0) setTimeout(() => attempt(n - 1), 300);
        else reject(new Error('Server did not answer OK at ' + url));
      }).catch(() => {
        if (n > 0) setTimeout(() => attempt(n - 1), 300);
        else reject(new Error('Server unreachable at ' + url));
      });
    };
    attempt(tries);
  });
}

async function main() {
  const shots = JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8'));
  mkdirSync(join(root, 'screenshots'), { recursive: true });

  const server = spawn('node', ['serve.ts'], { cwd: root, stdio: 'pipe' });
  server.stdout.on('data', (d) => process.stdout.write('[server] ' + d));
  server.stderr.on('data', (d) => process.stderr.write('[server] ' + d));

  let browser = null;
  try {
    await waitForServer('http://localhost:8080/', 40);
    browser = await puppeteer.launch({
      executablePath: '/opt/meta-chromium/chrome',
      args: [
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--hatch-webgl-allowed-domains-file=' + domainsFile,
        '--hatch-webgl-allowed-domains-sha256=' + sha,
        '--no-sandbox',
        '--disable-gpu-sandbox',
        '--allow-file-access-from-files',
        '--hide-scrollbars',
        '--disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessChecks',
        '--allow-insecure-localhost',
      ],
    });
    for (const shot of shots) {
      const page = await browser.newPage();
      await page.setViewport({ width: shot.w, height: shot.h });
      const httpUrl = 'http://localhost:8080/' + shot.query;
      let loaded = true;
      try {
        await page.goto(httpUrl, { waitUntil: 'load', timeout: 30000 });
        await page.waitForFunction('window.__shotReady === true', { timeout: 20000 });
      } catch (e) {
        loaded = false;
      }
      if (!loaded) {
        const fileUrl = pathToFileURL(join(root, 'app', 'index.html')).href + shot.query;
        await page.goto(fileUrl, { waitUntil: 'load', timeout: 30000 });
        await page.waitForFunction('window.__shotReady === true', { timeout: 30000 });
      }
      await new Promise((r) => setTimeout(r, 200));
      let quality = 85;
      let buf = await page.screenshot({ type: 'jpeg', quality: quality });
      while (buf.length > MAX_BYTES && quality > 25) {
        quality -= 10;
        buf = await page.screenshot({ type: 'jpeg', quality: quality });
      }
      const out = join(root, 'screenshots', shot.name);
      writeFileSync(out, buf);
      console.log('Wrote ' + out + ' (' + buf.length + ' bytes, quality ' + quality + ')');
      await page.close();
    }
  } finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
