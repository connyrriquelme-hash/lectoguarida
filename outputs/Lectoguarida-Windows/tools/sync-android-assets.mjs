import { copyFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PUBLIC = join(ROOT, 'public');
const ANDROID_PUBLIC = join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'public');

async function copyTree(from, to) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from)) {
    if (entry === 'Lectoguarida-debug.apk') continue;
    const source = join(from, entry);
    const target = join(to, entry);
    const info = await stat(source);
    if (info.isDirectory()) await copyTree(source, target);
    else await copyFile(source, target);
  }
}

await rm(ANDROID_PUBLIC, { recursive: true, force: true });
await copyTree(PUBLIC, ANDROID_PUBLIC);
console.log('Assets Android sincronizados.');
