import { buildDossier } from './vendor/makefun-app.ts';
import { mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(path.join(root, 'app'), path.join(out, 'app'), { recursive: true });
cpSync(path.join(root, 'screenshots'), path.join(out, 'screenshots'), { recursive: true });
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(path.join(out, 'dossier.json'), dossier);
