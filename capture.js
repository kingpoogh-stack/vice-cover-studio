import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from '/home/hatch/workspace/makefun-entries/threejs-fps-02/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const DOMAINS_FILE = '/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt';
const domainsContent = await readFile(DOMAINS_FILE, 'utf8').catch(() => '');
const domainsSha = createHash('sha256').update(domainsContent).digest('hex');
const MAX_BYTES = 250 * 1024;

async function waitForServer(url, tries) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

async function main() {
  const shots = JSON.parse(await readFile(join(repoRoot, 'shots.json'), 'utf8'));
  await mkdir(join(repoRoot, 'screenshots'), { recursive: true });

  const server = spawn('node', ['serve.ts'], { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));

  let browser;
  try {
    const ok = await waitForServer('http://localhost:8080/', 40);
    if (!ok) throw new Error('Server did not start');

    browser = await puppeteer.launch({
      executablePath: '/opt/meta-chromium/chrome',
      args: [
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        `--hatch-webgl-allowed-domains-file=${DOMAINS_FILE}`,
        `--hatch-webgl-allowed-domains-sha256=${domainsSha}`,
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
      const url = 'http://localhost:8080/' + shot.query;
      let loaded = false;
      try {
        await page.goto(url, { waitUntil: 'load', timeout: 30000 });
        await page.waitForFunction(() => window.__shotReady === true, { timeout: 20000 });
        loaded = true;
      } catch {
        const fileUrl = pathToFileURL(join(repoRoot, 'app', 'index.html')).href + shot.query;
        await page.goto(fileUrl, { waitUntil: 'load', timeout: 30000 });
        await page.waitForFunction(() => window.__shotReady === true, { timeout: 30000 });
        loaded = true;
      }
      await new Promise((r) => setTimeout(r, 200));
      let quality = 85;
      let buffer = await page.screenshot({ type: 'jpeg', quality });
      while (buffer.length > MAX_BYTES && quality > 25) {
        quality -= 10;
        buffer = await page.screenshot({ type: 'jpeg', quality });
      }
      const outPath = join(repoRoot, 'screenshots', shot.name);
      await writeFile(outPath, buffer);
      console.log(`${outPath} ${buffer.length} bytes quality ${quality}`);
      await page.close();
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    try { server.kill('SIGTERM'); } catch {}
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
