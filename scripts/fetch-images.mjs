// Baixa imagens listadas em src/content/images.json para src/assets/images
import { mkdir, writeFile, access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const imagesJsonPath = path.join(root, 'src', 'content', 'images.json');
const destDir = path.join(root, 'src', 'assets', 'images');

async function ensureDir(p) { await mkdir(p, { recursive: true }); }

async function fileExists(p) {
  try { await access(p, constants.F_OK); return true; } catch { return false; }
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar ${url}: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

async function main() {
  await ensureDir(destDir);
  const jsonRaw = await readFile(imagesJsonPath, 'utf-8');
  const list = JSON.parse(jsonRaw);
  for (const item of list) {
    const out = path.join(destDir, item.filename);
    if (await fileExists(out)) {
      console.log(`✔ Já existe: ${item.filename}`);
      continue;
    }
    console.log(`↓ Baixando: ${item.filename}`);
    const buf = await download(item.url);
    await writeFile(out, buf);
    console.log(`  → OK (${(buf.length/1024).toFixed(1)} KB)`);
  }
  console.log('Concluído.');
}

main().catch(err => { console.error(err); process.exit(1); });