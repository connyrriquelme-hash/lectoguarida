import fs from 'node:fs';
import path from 'node:path';

const roots = [
  path.resolve('public'),
  path.resolve('cloudflare'),
  path.resolve('tools')
];

const BAD_PATTERNS = [
  '�',
  '�',
  '�x',
  '�',
  '�',
  '\uFFFD'
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(js|mjs|html|css|json|txt)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

function countBad(text) {
  return BAD_PATTERNS.reduce((count, pattern) => count + (text.includes(pattern) ? 1 : 0), 0);
}

function repairText(text) {
  const candidates = [text];
  let current = text;
  for (let i = 0; i < 3; i += 1) {
    current = Buffer.from(current, 'latin1').toString('utf8');
    candidates.push(current);
  }
  return candidates.reduce((best, candidate) => (countBad(candidate) < countBad(best) ? candidate : best));
}

let changed = 0;
for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  for (const file of walk(root)) {
    const original = fs.readFileSync(file, 'utf8');
    const repaired = repairText(original);
    if (repaired !== original) {
      fs.writeFileSync(file, repaired, 'utf8');
      changed += 1;
      console.log(`Repaired: ${path.relative(process.cwd(), file)}`);
    }
  }
}

console.log(`Repair finished. Files changed: ${changed}`);
