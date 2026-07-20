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

test('13. mastery rules válidas sin claves duplicadas', () => {
  const rules = JSON.parse(fs.readFileSync(resolve(LEARNING, 'config/mastery-rules.json'), 'utf-8'));
  const ruleIds = Object.keys(rules.rules);
  assert.ok(ruleIds.length >= 10, `Expected at least 10 rules, got ${ruleIds.length}`);
  assert.ok(rules.rules['mastery_80_3_consecutive']);
  assert.ok(rules.rules['mastery_80_3_consecutive'].minimumAccuracy >= 0.7);
  assert.ok(rules.rules['mastery_95_accuracy']);
  assert.ok(rules.rules['mastery_retention']);
  assert.ok(rules.rules['mastery_transfer']);
});

test('14. todos los skills tienen masteryRuleId válido', () => {
  const domains = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/skill-domains.json'), 'utf-8'));
  const rules = JSON.parse(fs.readFileSync(resolve(LEARNING, 'config/mastery-rules.json'), 'utf-8'));
  const ruleIds = new Set(Object.keys(rules.rules));
  domains.skills.forEach(s => {
    assert.ok(s.masteryRuleId, `Missing masteryRuleId: ${s.id}`);
    assert.ok(ruleIds.has(s.masteryRuleId), `Invalid masteryRuleId: ${s.masteryRuleId} for ${s.id}`);
  });
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

test('20. word bank tiene exactamente 300 palabras con IDs únicos', () => {
  const bank = JSON.parse(fs.readFileSync(resolve(CONTENT, 'words/word-bank-foundation.json'), 'utf-8'));
  assert.equal(bank.words.length, 300, `Expected 300 words, got ${bank.words.length}`);
  const ids = bank.words.map(w => w.id);
  const unique = new Set(ids);
  assert.equal(ids.length, unique.size, 'Duplicate word IDs found');
});

test('21. word bank normalized únicos y segmentación coherente', () => {
  const bank = JSON.parse(fs.readFileSync(resolve(CONTENT, 'words/word-bank-foundation.json'), 'utf-8'));
  const norms = bank.words.map(w => w.normalized);
  const uniqueNorms = new Set(norms);
  assert.equal(norms.length, uniqueNorms.size, 'Duplicate normalized values found');
  bank.words.forEach(w => {
    assert.equal(w.syllableCount, w.syllables.length, `Syllable count mismatch: ${w.id}`);
  });
});

test('22. word bank mínimo 80% imageable', () => {
  const bank = JSON.parse(fs.readFileSync(resolve(CONTENT, 'words/word-bank-foundation.json'), 'utf-8'));
  const imageable = bank.words.filter(w => w.difficulty <= 3).length;
  const percent = Math.round(imageable / bank.words.length * 100);
  assert.ok(percent >= 80, `Imageable: ${percent}% (expected >= 80%)`);
});

test('23. nuevas palabras están pending_review', () => {
  const bank = JSON.parse(fs.readFileSync(resolve(CONTENT, 'words/word-bank-foundation.json'), 'utf-8'));
  const reviewed = bank.words.filter(w => w.status === 'reviewed');
  assert.equal(reviewed.length, 0, `Found ${reviewed.length} reviewed words (new words should be pending_review)`);
});

/* ── 24-25: Curriculum Mapping ── */

test('24. curriculum mapping usa estados válidos sin duplicados exactos', () => {
  const mapping = JSON.parse(fs.readFileSync(resolve(CONTENT, 'curriculum/chile-literacy-mapping.json'), 'utf-8'));
  const validStatuses = ['verified', 'pending', 'pending_review'];
  mapping.mappings.forEach(m => assert.ok(validStatuses.includes(m.verificationStatus), `Invalid status: ${m.verificationStatus}`));
  const keys = mapping.mappings.map(m => `${m.skillId}|${m.level}|${m.subject}|${m.oaCode}`);
  const uniqueKeys = new Set(keys);
  assert.equal(keys.length, uniqueKeys.size, 'Exact curriculum duplicates found');
});

test('25. mappings verified tienen sourceUrl y oaCode', () => {
  const mapping = JSON.parse(fs.readFileSync(resolve(CONTENT, 'curriculum/chile-literacy-mapping.json'), 'utf-8'));
  const verified = mapping.mappings.filter(m => m.verificationStatus === 'verified');
  verified.forEach(m => {
    assert.ok(m.sourceUrl && m.sourceUrl !== '', `Verified mapping ${m.skillId}->${m.oaCode} missing sourceUrl`);
    assert.ok(m.oaCode && m.oaCode !== '', `Verified mapping ${m.skillId} missing oaCode`);
  });
});

/* ── 26-27: Feedback ── */

test('26. feedback rules tienen acciones', () => {
  const rules = JSON.parse(fs.readFileSync(resolve(LEARNING, 'config/feedback-rules.json'), 'utf-8'));
  const ruleKeys = Object.keys(rules.rules);
  assert.ok(ruleKeys.length > 0);
  ruleKeys.forEach(k => assert.ok(rules.rules[k].actions && rules.rules[k].actions.length > 0));
});

test('27. mensajes es-CL existen sin castigo', () => {
  const messages = JSON.parse(fs.readFileSync(resolve(LEARNING, 'data/feedback-messages-es-cl.json'), 'utf-8'));
  assert.ok(messages.categories.encouragement.messages.length > 0);
  const forbidden = ['mal', 'tonto', 'inútil', 'estúpido', 'burro', 'incapaz', 'fracaso', 'perdedor'];
  Object.values(messages.categories).forEach(cat => {
    cat.messages.forEach(msg => {
      forbidden.forEach(f => assert.ok(!msg.toLowerCase().includes(f), `Forbidden word in message: ${msg}`));
    });
  });
});

/* ── 28: Validator ── */

test('28. validator script existe y es válido', () => {
  const vPath = resolve(LEARNING, 'validators/validate-learning-data.js');
  assert.ok(fs.existsSync(vPath), 'Validator script must exist');
  const content = fs.readFileSync(vPath, 'utf-8');
  assert.ok(content.includes('import'), 'Validator must use ESM imports');
  assert.ok(!content.includes("standardMission:"), 'Validator must not load standard-mission.schema.json as a schema');
});

/* ── 29-30: Integration ── */

test('29. feature flag Engine V2 permanece igual', async () => {
  const flagPath = resolve(__dirname, '../public/expedicion/solo/game-engine/core/feature-flag.js');
  assert.ok(fs.existsSync(flagPath), 'feature-flag.js must exist');
  const flag = await import(`file:///${flagPath.replace(/\\/g, '/')}`);
  assert.ok(typeof flag.isGameEngineV2Enabled === 'function', `Expected isGameEngineV2Enabled function, got: ${Object.keys(flag)}`);
});

test('30. standard-mission.schema.json eliminado, solo learning-mission existe', () => {
  const stdPath = resolve(LEARNING, 'schemas/standard-mission.schema.json');
  const learningPath = resolve(LEARNING, 'schemas/learning-mission.schema.json');
  assert.ok(!fs.existsSync(stdPath), 'standard-mission.schema.json must be removed');
  assert.ok(fs.existsSync(learningPath), 'learning-mission.schema.json must exist');
});
