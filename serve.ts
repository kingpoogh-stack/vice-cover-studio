import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const appDir = path.join(root, 'app');
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost:8080');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';
    const filePath = path.join(appDir, pathname);
    const normalized = path.normalize(filePath);
    if (!normalized.startsWith(appDir)) { res.writeHead(403); res.end('Forbidden'); return; }
    if (!existsSync(normalized) || !statSync(normalized).isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(normalized).toLowerCase();
    const data = readFileSync(normalized);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch (e) {
    res.writeHead(500); res.end('Server error');
  }
});
server.listen(8080, () => console.log('Serving on http://localhost:8080'));
