import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CLOUDFLARE = join(ROOT, 'cloudflare');
const PUBLIC = join(ROOT, 'public');
const store = JSON.parse(await readFile(join(ROOT, 'data', 'store.json'), 'utf8'));

store.teacher = {
  id: store.teacher?.id || 'teacher-conny',
  name: store.teacher?.name || 'Conny'
};

await mkdir(CLOUDFLARE, { recursive: true });
await writeFile(
  join(CLOUDFLARE, 'seed-store.mjs'),
  `// Generado por tools/prepare-cloudflare.mjs. No contiene PIN ni contraseñas.\nexport default ${JSON.stringify(store, null, 2)};\n`,
  'utf8'
);

await copyFile(join(ROOT, 'Lectoguarida-debug.apk'), join(PUBLIC, 'Lectoguarida-debug.apk'));
console.log(`Cloudflare preparado: ${store.students.length} estudiantes y ${store.attempts.length} intentos.`);
