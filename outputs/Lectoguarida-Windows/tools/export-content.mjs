import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readings } from '../server.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PUBLIC = join(ROOT, 'public');

await mkdir(PUBLIC, { recursive: true });
const payload = `window.LECTOGUARIDA_CONTENT = ${JSON.stringify({ readings }, null, 2)};\n`;
await writeFile(join(PUBLIC, 'content.js'), payload, 'utf8');
await writeFile(join(PUBLIC, 'content.json'), JSON.stringify({ readings }), 'utf8');
const secondGrade = readings.filter((reading) => reading.grade === 2);
console.log(`Contenido exportado: ${secondGrade.length} niveles de 2.º básico, ${secondGrade.length * 3} actividades.`);
