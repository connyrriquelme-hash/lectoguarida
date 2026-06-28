import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const rawUrl = process.argv[2] || '';

if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
  console.error('Uso: node tools/configure-remote-api.mjs https://tu-servidor-online.com');
  process.exit(1);
}

const cleanUrl = rawUrl.replace(/\/$/, '');
const payload = `// Configuración generada automáticamente.\nwindow.LECTOGUARIDA_REMOTE_API = ${JSON.stringify(cleanUrl)};\n`;

await writeFile(join(ROOT, 'public', 'remote-config.js'), payload, 'utf8');
console.log(`Servidor online configurado: ${cleanUrl}`);
console.log('Ahora ejecuta: npm run export:android && npm run build:apk');
