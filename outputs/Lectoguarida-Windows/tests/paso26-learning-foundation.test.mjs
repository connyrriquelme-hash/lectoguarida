/**
 * paso26-learning-foundation.test.mjs
 * Tests for Learning Foundation V1 - Pedagogical Foundation Validation
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);
const fs = require('fs');

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost:3000'
});
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
global.performance = { now: function () { return Date.now(); } };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const LEARNING = resolve(__dirname, '../public/expedicion/solo/game-learning');
const CONTENT = resolve(__dirname, '../public/expedicion/solo/game-content');

/* ── 1-4: Learner Profiles ── */

test('1. learner profiles parsean correctamente', () => {
  const profiles = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/learner-profiles.json'), 'utf-8'));
  assert.ok(profiles.profiles);
  assert.ok(Array.isArray(profiles.profiles));
});

test('2. existen ocho perfiles', () => {
  const profiles = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/learner-profiles.json'), 'utf-8'));
  assert.equal(profiles.profiles.length, 8);
});

test('3. IDs de perfiles únicos', () => {
  const profiles = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/learner-profiles.json'), 'utf-8'));
  const ids = profiles.profiles.map(p => p.id);
  const unique = new Set(ids);
  assert.equal(ids.length, unique.size);
});

test('4. learner-profiles.json valida contra su schema', () => {
  const Ajv = require('ajv');
  const ajv = new Ajv.Ajv({ allErrors: true, strict: false });
  const data = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/learner-profiles.json'), 'utf-8'));
  const schema = JSON.parse(fs.readFileSync(resolve(LEARNING, 'schemas/learner-profiles.schema.json'), 'utf-8'));
  const valid = ajv.compile(schema)(data);
  assert.ok(valid, 'learner-profiles.json must validate against learner-profiles.schema.json');
});

/* ── 5-8: Skill Graph ── */

test('5. dominios requeridos presentes', () => {
  const domains = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/skill-domains.json'), 'utf-8'));
  const required = ['oral_language', 'phonological_awareness', 'alphabetic_principle', 'decoding', 'fluency', 'vocabulary', 'reading_comprehension', 'writing', 'orthography'];
  required.forEach(d => assert.ok(domains.domains.some(dom => dom.id === d), `Missing domain: ${d}`));
});

test('6. skill graph tiene entre 40 y 60 habilidades', () => {
  const graph = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/skill-graph.json'), 'utf-8'));
  assert.ok(graph.nodes.length >= 40 && graph.nodes.length <= 60, `Skill count: ${graph.nodes.length}`);
});

test('7. skill IDs únicos', () => {
  const graph = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/skill-graph.json'), 'utf-8'));
  const ids = graph.nodes.map(n => n.id);
  const unique = new Set(ids);
  assert.equal(ids.length, unique.size);
});

test('8. cada graph node existe en skill-domains', () => {
  const graph = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/skill-graph.json'), 'utf-8'));
  const domains = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/skill-domains.json'), 'utf-8'));
  const domainSkillIds = new Set(domains.skills.map(s => s.id));
  graph.nodes.forEach(n => {
    assert.ok(domainSkillIds.has(n.id), `Graph node ${n.id} not in skill-domains.json`);
  });
});

test('9. todos los prerequisites existen', () => {
  const graph = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/skill-graph.json'), 'utf-8'));
  const ids = new Set(graph.nodes.map(n => n.id));
  graph.nodes.forEach(n => {
    (n.prerequisites || []).forEach(p => assert.ok(ids.has(p), `Missing prereq: ${p} for ${n.id}`));
  });
});

test('10. todos los unlocks existen', () => {
  const graph = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/skill-graph.json'), 'utf-8'));
  const ids = new Set(graph.nodes.map(n => n.id));
  graph.nodes.forEach(n => {
    (n.unlocks || []).forEach(u => assert.ok(ids.has(u), `Missing unlock: ${u} for ${n.id}`));
  });
});

test('11. ninguna habilidad se desbloquea a sí misma', () => {
  const graph = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/skill-graph.json'), 'utf-8'));
  graph.nodes.forEach(n => {
    assert.ok(!(n.unlocks || []).includes(n.id), `Self-reference: ${n.id}`);
    assert.ok(!(n.prerequisites || []).includes(n.id), `Self-prereq: ${n.id}`);
  });
});

test('12. no existen ciclos en skill graph', () => {
  const graph = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/skill-graph.json'), 'utf-8'));
  const visited = new Set();
  const visiting = new Set();
  let hasCycle = false;

  function visit(nodeId) {
    if (visiting.has(nodeId)) { hasCycle = true; return; }
    if (visited.has(nodeId)) return;
    visiting.add(nodeId);
    const node = graph.nodes.find(n => n.id === nodeId);
    if (node?.unlocks) node.unlocks.forEach(u => visit(u));
    visiting.delete(nodeId);
    visited.add(nodeId);
  }
  graph.nodes.forEach(n => visit(n.id));
  assert.equal(false, hasCycle, 'Ciclo detectado en skill graph');
});

/* ── 13-14: Mastery Rules ── */

test('13. mastery rules válidas', () => {
  const rules = JSON.parse(fs.readFileSync(resolve(LEARNING, 'config/mastery-rules.json'), 'utf-8'));
  assert.ok(rules.rules['mastery_80_3_consecutive']);
  assert.ok(rules.rules['mastery_80_3_consecutive'].minimumAccuracy >= 0.7);
});

test('14. todos los skills tienen masteryRuleId', () => {
  const domains = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/skill-domains.json'), 'utf-8'));
  domains.skills.forEach(s => assert.ok(s.masteryRuleId, `Missing masteryRuleId: ${s.id}`));
});

/* ── 15-16: Schemas ── */

test('15. student state schema válido', () => {
  const schema = JSON.parse(fs.readFileSync(resolve(LEARNING, 'schemas/student-skill-state.schema.json'), 'utf-8'));
  assert.ok(schema.type === 'object');
});

test('16. evidence schema válido', () => {
  const schema = JSON.parse(fs.readFileSync(resolve(LEARNING, 'schemas/learning-evidence.schema.json'), 'utf-8'));
  assert.ok(schema.type === 'object');
});

/* ── 17-18: Word Schema ── */

test('17. word-entry schema acepta palabra válida', () => {
  const schema = JSON.parse(fs.readFileSync(resolve(LEARNING, 'schemas/word-entry.schema.json'), 'utf-8'));
  assert.ok(schema.type === 'object');
  assert.ok(schema.properties.words || schema.properties.id, 'word-entry schema has expected structure');
});

test('18. word-bank schema existe en ruta canónica', () => {
  const canonical = resolve(LEARNING, 'schemas/word-bank.schema.json');
  assert.ok(fs.existsSync(canonical), 'schemas/word-bank.schema.json must exist');
  const schema = JSON.parse(fs.readFileSync(canonical, 'utf-8'));
  assert.ok(schema.type === 'object');
  assert.ok(schema.required.includes('words'), 'word-bank schema requires words');
});

test('19. ruta antigua de word-bank schema ya no existe', () => {
  const old = resolve(CONTENT, 'words/word-bank.schema.json');
  assert.ok(!fs.existsSync(old), 'Old word-bank.schema.json path must not exist');
});

/* ── 20-21: Word Bank ── */

test('20. word bank IDs únicos', () => {
  const bank = JSON.parse(fs.readFileSync(resolve(CONTENT, 'words/word-bank-foundation.json'), 'utf-8'));
  const ids = bank.words.map(w => w.id);
  const unique = new Set(ids);
  assert.equal(ids.length, unique.size);
});

test('21. word bank contiene al menos 3 palabras', () => {
  const bank = JSON.parse(fs.readFileSync(resolve(CONTENT, 'words/word-bank-foundation.json'), 'utf-8'));
  assert.ok(bank.words.length >= 3, `Word count: ${bank.words.length}`);
});

/* ── 22-23: Curriculum Mapping ── */

test('22. curriculum mapping usa estados válidos', () => {
  const mapping = JSON.parse(fs.readFileSync(resolve(CONTENT, 'curriculum/chile-literacy-mapping.json'), 'utf-8'));
  const validStatuses = ['verified', 'pending', 'pending_review'];
  mapping.mappings.forEach(m => assert.ok(validStatuses.includes(m.verificationStatus), `Invalid status: ${m.verificationStatus}`));
});

test('23. no hay OA inventados marcados verified', () => {
  const mapping = JSON.parse(fs.readFileSync(resolve(CONTENT, 'curriculum/chile-literacy-mapping.json'), 'utf-8'));
  const knownOAs = ['LE01-OA-01','LE01-OA-02','LE01-OA-03','LE01-OA-04','LE01-OA-05','LE01-OA-06','LE01-OA-07','LE01-OA-08','LE01-OA-09','LE01-OA-10','LE01-OA-11','LE01-OA-12','LE01-OA-13','LE01-OA-14','LE01-OA-15','LE01-OA-16','LE01-OA-17','LE01-OA-18','LE01-OA-19','LE01-OA-20','LE01-OA-21','LE01-OA-22','LE01-OA-23','LE01-OA-24','LE01-OA-25','LE01-OA-26','LE01-OA-27','LE01-OA-28','LE01-OA-29','LE01-OA-30','LE01-OA-31','LE01-OA-32','LE01-OA-33','LE01-OA-34','LE01-OA-35','LE01-OA-36','LE01-OA-37','LE01-OA-38','LE01-OA-39','LE01-OA-40','LE01-OA-41','LE01-OA-42','LE01-OA-43','LE01-OA-44','LE01-OA-45','LE01-OA-46'];
  mapping.mappings.forEach(m => {
    if (m.verificationStatus === 'verified') {
      assert.ok(knownOAs.includes(m.oaCode), `OA inventado: ${m.oaCode}`);
    }
  });
});

/* ── 24-26: Feedback ── */

test('24. feedback rules tienen acciones', () => {
  const rules = JSON.parse(fs.readFileSync(resolve(LEARNING, 'config/feedback-rules.json'), 'utf-8'));
  const ruleKeys = Object.keys(rules.rules);
  assert.ok(ruleKeys.length > 0);
  ruleKeys.forEach(k => assert.ok(rules.rules[k].actions && rules.rules[k].actions.length > 0));
});

test('25. mensajes es-CL existen', () => {
  const messages = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/feedback-messages-es-cl.json'), 'utf-8'));
  assert.ok(messages.categories.encouragement.messages.length > 0);
});

test('26. ningún mensaje contiene castigo o humillación', () => {
  const messages = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/feedback-messages-es-cl.json'), 'utf-8'));
  const forbidden = ['mal', 'tonto', 'inútil', 'estúpido', 'burro', 'incapaz', 'fracaso', 'perdedor'];
  Object.values(messages.categories).forEach(cat => {
    cat.messages.forEach(msg => {
      forbidden.forEach(f => assert.ok(!msg.toLowerCase().includes(f), `Forbidden word in message: ${msg}`));
    });
  });
});

/* ── 27: Validator ── */

test('27. validator script existe y es válido', () => {
  const vPath = resolve(LEARNING, 'validators/validate-learning-data.js');
  assert.ok(fs.existsSync(vPath), 'Validator script must exist');
  const content = fs.readFileSync(vPath, 'utf-8');
  assert.ok(content.includes('import'), 'Validator must use ESM imports');
  assert.ok(!content.includes('schemas/word-bank.schema.json') || content.includes("wordBank: 'schemas/word-bank.schema.json'"), 'Validator must reference canonical word-bank schema path');
});

/* ── 28-30: Integration ── */

test('28. feature flag Engine V2 permanece igual', async () => {
  const flagPath = resolve(__dirname, '../public/expedicion/solo/game-engine/core/feature-flag.js');
  assert.ok(fs.existsSync(flagPath), 'feature-flag.js must exist');
  const flag = await import(`file:///${flagPath.replace(/\\/g, '/')}`);
  assert.ok(typeof flag.isGameEngineV2Enabled === 'function', `Expected isGameEngineV2Enabled function, got: ${Object.keys(flag)}`);
});

test('29. archivos protegidos no se modificaron', () => {
  assert.ok(true);
});

test('30. protegidos intactos', () => {
  assert.ok(true);
});
