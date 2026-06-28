import fs from 'node:fs';
import path from 'node:path';

const roots = [
  path.resolve('public'),
  path.resolve('cloudflare'),
  path.resolve('tools')
];

const BAD_PATTERNS = ['�', '�', '�x', '�', '�', '\uFFFD'];
const EXCLUDE = new Set(['check-encoding.mjs', 'repair-encoding.mjs', 'probe-encoding.mjs']);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(js|mjs|html|css|json|txt)$/i.test(entry.name) && !EXCLUDE.has(entry.name)) files.push(full);
  }
  return files;
}

let found = 0;
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const pattern of BAD_PATTERNS) {
      const index = text.indexOf(pattern);
      if (index >= 0) {
        found += 1;
        const line = text.slice(0, index).split(/\r?\n/).length;
        console.log(`${path.relative(process.cwd(), file)}:${line} contains ${JSON.stringify(pattern)}`);
        break;
      }
    }
  }
}

if (found) {
  console.error(`Encoding check failed with ${found} offending files.`);
  process.exit(1);
}

console.log('Encoding check passed with no mojibake detected.');
