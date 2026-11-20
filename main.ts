import { mkdir, cp, writeFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-ignore - vendor module provided by make.fun
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

await mkdir(outputDir, { recursive: true });

await cp(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true, force: true });
await cp(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true, force: true });

const limits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

const dossier: string = await buildDossier(outputDir, limits);
const dossierPath = join(outputDir, 'dossier.json');
await writeFile(dossierPath, dossier, 'utf8');
async function countFiles(dir: string): Promise<number> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  let total = 0;
  for (const entry of entries) {
    if (entry.isDirectory()) total += await countFiles(join(dir, entry.name));
    else if (entry.isFile()) total += 1;
  }
  return total;
}
const appFileCount = await countFiles(join(outputDir, 'app'));
const screenshotFileCount = await countFiles(join(outputDir, 'screenshots'));
console.log(`Dossier written: ${Buffer.byteLength(dossier, 'utf8')} bytes to ${dossierPath} (verified app files: ${appFileCount}, screenshot files: ${screenshotFileCount})`);
