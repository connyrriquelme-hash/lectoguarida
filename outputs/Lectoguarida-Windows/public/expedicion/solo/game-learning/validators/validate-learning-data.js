#!/usr/bin/env node
/**
 * Validador de datos pedagógicos - Lectoguarida Learning Foundation V1
 * Valida JSON, schemas, IDs únicos, referencias, mastery, word bank, curriculum, etc.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ajv = new Ajv({ allErrors: true, strict: false });
const ROOT = path.join(__dirname, '..', '..', '..', '..', '..', 'public', 'expedicion', 'solo', 'game-learning');

const FILES = {
  learnerProfiles: 'data/learner-profiles.json',
  learningDomains: 'data/skill-domains.json',
  skillGraph: 'data/skill-graph.json',
  masteryRules: 'config/mastery-rules.json',
  feedbackRules: 'config/feedback-rules.json',
  feedbackMessages: 'data/feedback-messages-es-cl.json',
  wordBank: '../game-content/words/word-bank-foundation.json',
  curriculumMapping: '../game-content/curriculum/chile-literacy-mapping.json',
};

const SCHEMAS = {
  learnerProfiles: 'schemas/learner-profiles.schema.json',
  skillGraph: 'schemas/skill-graph.schema.json',
  studentState: 'schemas/student-skill-state.schema.json',
  evidence: 'schemas/learning-evidence.schema.json',
  mission: 'schemas/learning-mission.schema.json',
  wordEntry: 'schemas/word-entry.schema.json',
  wordBank: 'schemas/word-bank.schema.json',
};

function loadJSON(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    return { exists: false, data: null, error: `File not found: ${relativePath}` };
  }
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const data = JSON.parse(content);
    return { exists: true, data, error: null };
  } catch (e) {
    return { exists: true, data: null, error: `JSON parse error: ${e.message}` };
  }
}

function validateJSON(data, schema, fileName) {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  if (!valid) {
    console.error(`  ❌ ${fileName}: Schema validation failed`);
    validate.errors.forEach(err => {
      console.error(`    - ${err.instancePath} ${err.message}`);
    });
    return false;
  }
  return true;
}

function checkUniqueIds(data, idField, fileName) {
  const ids = data.map(item => item[idField]);
  const duplicates = ids.filter((id, index) => data.findIndex(d => d[idField] === id) !== index);
  if (duplicates.length > 0) {
    console.error(`  ❌ ${fileName}: Duplicate ${idField}s found:`, [...new Set(duplicates)]);
    return false;
  }
  return true;
}

function detectSelfReferences(nodes) {
  const selfRefs = [];
  nodes.forEach(n => {
    if (n.unlocks && n.unlocks.includes(n.id)) selfRefs.push(n.id);
    if (n.prerequisites && n.prerequisites.includes(n.id)) selfRefs.push(n.id);
  });
  return [...new Set(selfRefs)];
}

function detectCycles(nodes) {
  const visited = new Set();
  const recStack = new Set();
  const cycles = [];

  function dfs(nodeId) {
    visited.add(nodeId);
    recStack.add(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node && node.unlocks) {
      for (const unlock of node.unlocks) {
        if (!visited.has(unlock)) {
          if (dfs(unlock)) return true;
        } else if (recStack.has(unlock)) {
          cycles.push(nodeId + ' -> ' + unlock);
          return true;
        }
      }
    }
    recStack.delete(nodeId);
    return false;
  }

  nodes.forEach(node => {
    if (!visited.has(node.id)) dfs(node.id);
  });
  return cycles;
}

async function main() {
  console.log('🔍 Validando Learning Foundation Data...\n');
  let exitCode = 0;

  // 1. Load all JSON files
  console.log('📂 Cargando archivos...');
  const files = {};
  for (const [key, relPath] of Object.entries(FILES)) {
    const result = loadJSON(relPath);
    if (!result.exists) {
      console.error(`  ❌ Missing file: ${relPath}`);
      process.exit(1);
    }
    if (result.error) {
      console.error(`  ❌ Parse error in ${relPath}: ${result.error}`);
      process.exit(1);
    }
    files[key] = result.data;
    console.log(`  ✅ ${relPath}`);
  }

  // 2. Load schemas
  console.log('\n📋 Cargando schemas...');
  const schemas = {};
  for (const [key, relPath] of Object.entries(SCHEMAS)) {
    const result = loadJSON(relPath);
    if (!result.exists) {
      console.error(`  ❌ Missing schema: ${relPath}`);
      process.exit(1);
    }
    if (result.error) {
      console.error(`  ❌ Parse error in schema ${relPath}: ${result.error}`);
      process.exit(1);
    }
    schemas[key] = result.data;
    console.log(`  ✅ ${relPath}`);
  }

  // 3. Validate JSON schemas
  console.log('\n🔍 Validando schemas JSON...');
  let schemaErrors = 0;

  if (!validateJSON(files.learnerProfiles, schemas.learnerProfiles, 'learner-profiles.json')) schemaErrors++;
  if (!validateJSON(files.skillGraph, schemas.skillGraph, 'skill-graph.json')) schemaErrors++;

  if (schemaErrors > 0) {
    console.error(`  ❌ ${schemaErrors} schema validation errors`);
    exitCode = 1;
  } else {
    console.log('  ✅ All JSON schemas valid');
  }

  // 4. Check unique IDs
  console.log('\n🔑 Verificando IDs únicos...');
  if (!checkUniqueIds(files.learnerProfiles.profiles, 'id', 'learner-profiles.json')) exitCode = 1;
  if (!checkUniqueIds(files.learningDomains.domains, 'id', 'skill-domains.json')) exitCode = 1;
  if (!checkUniqueIds(files.skillGraph.nodes, 'id', 'skill-graph.json')) exitCode = 1;

  // 5. Check references
  console.log('\n🔗 Verificando referencias...');
  const domainSkillIds = new Set(files.learningDomains.skills.map(s => s.id));
  const graphNodeIds = new Set(files.skillGraph.nodes.map(s => s.id));

  // 5a. Every graph node must exist in skill-domains.json
  files.skillGraph.nodes.forEach(node => {
    if (!domainSkillIds.has(node.id)) {
      console.error(`  ❌ skill-graph.json: Node ${node.id} not found in skill-domains.json`);
      exitCode = 1;
    }
  });

  // 5b. Check prerequisites and unlocks exist
  files.skillGraph.nodes.forEach(skill => {
    (skill.prerequisites || []).forEach(prereq => {
      if (!graphNodeIds.has(prereq)) {
        console.error(`  ❌ skill-graph.json: ${skill.id} references missing prerequisite ${prereq}`);
        exitCode = 1;
      }
    });
    (skill.unlocks || []).forEach(unlock => {
      if (!graphNodeIds.has(unlock)) {
        console.error(`  ❌ skill-graph.json: ${skill.id} unlocks missing skill ${unlock}`);
        exitCode = 1;
      }
    });
  });

  // 5c. Check domainId references
  const domainIds = new Set(files.learningDomains.domains.map(d => d.id));
  files.skillGraph.nodes.forEach(node => {
    if (!domainIds.has(node.domainId)) {
      console.error(`  ❌ skill-graph.json: Node ${node.id} references invalid domainId ${node.domainId}`);
      exitCode = 1;
    }
  });

  // 5d. Self-references
  console.log('\n🔄 Verificando autorreferencias...');
  const selfRefs = detectSelfReferences(files.skillGraph.nodes);
  if (selfRefs.length > 0) {
    console.error(`  ❌ Self-references found: ${selfRefs.join(', ')}`);
    exitCode = 1;
  } else {
    console.log('  ✅ Sin autorreferencias');
  }

  // 5e. Cycles
  console.log('\n🔄 Verificando ciclos en skill graph...');
  const cycles = detectCycles(files.skillGraph.nodes);
  if (cycles.length > 0) {
    console.error('  ❌ Ciclos detectados:');
    cycles.forEach(c => console.error(`    ${c}`));
    exitCode = 1;
  } else {
    console.log('  ✅ Sin ciclos en skill-graph.json');
  }

  // 5f. All masteryRuleId references must exist
  console.log('\n🔗 Verificando referencias mastery...');
  const masteryRuleIds = new Set(Object.keys(files.masteryRules.rules));
  const invalidMasteryRefs = [];
  files.learningDomains.skills.forEach(s => {
    if (s.masteryRuleId && !masteryRuleIds.has(s.masteryRuleId)) {
      invalidMasteryRefs.push({ skill: s.id, rule: s.masteryRuleId });
    }
  });
  if (invalidMasteryRefs.length > 0) {
    console.error('  ❌ Invalid mastery references:');
    invalidMasteryRefs.forEach(r => console.error(`    ${r.skill} -> ${r.rule}`));
    exitCode = 1;
  } else {
    console.log('  ✅ All masteryRuleId references valid');
  }

  // 6. Mastery rules validation
  console.log('\n📐 Validando mastery rules...');
  const masteryRules = files.masteryRules.rules;
  const ruleIds = Object.keys(masteryRules);

  // 6a. Rule IDs must match keys
  ruleIds.forEach(key => {
    if (masteryRules[key].id !== key) {
      console.error(`  ❌ mastery-rules.json: Rule key '${key}' has id '${masteryRules[key].id}'`);
      exitCode = 1;
    }
  });

  // 6b. Criteria weights must sum to 1 (tolerance 0.001)
  ruleIds.forEach(key => {
    const rule = masteryRules[key];
    if (rule.criteria) {
      const weights = Object.values(rule.criteria).map(c => typeof c === 'object' ? c.weight : c);
      const sum = weights.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1) > 0.001) {
        console.error(`  ❌ mastery-rules.json: ${key} criteria weights sum to ${sum}, expected 1`);
        exitCode = 1;
      }
    }
  });

  // 6c. Proportions between 0 and 1
  ruleIds.forEach(key => {
    const rule = masteryRules[key];
    ['minimumAccuracy', 'minimumIndependentAccuracy', 'maximumHintRate', 'minimumRetentionAccuracy', 'minimumRatio'].forEach(field => {
      if (rule[field] !== undefined && (rule[field] < 0 || rule[field] > 1)) {
        console.error(`  ❌ mastery-rules.json: ${key}.${field} = ${rule[field]}, expected 0-1`);
        exitCode = 1;
      }
    });
  });

  // 6d. minimumAttempts >= 1, minimumSessions >= 1
  ruleIds.forEach(key => {
    const rule = masteryRules[key];
    if (rule.minimumAttempts !== undefined && rule.minimumAttempts < 1) {
      console.error(`  ❌ mastery-rules.json: ${key}.minimumAttempts = ${rule.minimumAttempts}, expected >= 1`);
      exitCode = 1;
    }
    if (rule.minimumSessions !== undefined && rule.minimumSessions < 1) {
      console.error(`  ❌ mastery-rules.json: ${key}.minimumSessions = ${rule.minimumSessions}, expected >= 1`);
      exitCode = 1;
    }
  });

  console.log(`  ✅ ${ruleIds.length} mastery rules, no duplicate keys`);

  // 7. Word bank validation
  console.log('\n📚 Validando banco de palabras...');
  const wordCount = files.wordBank.words.length;
  if (wordCount !== 300) {
    console.error(`  ❌ Word bank has ${wordCount}/300 words (expected exactly 300)`);
    exitCode = 1;
  } else {
    console.log(`  ✅ Word bank: ${wordCount} words`);
  }

  // 7a. Unique IDs
  if (!checkUniqueIds(files.wordBank.words, 'id', 'word-bank-foundation.json')) exitCode = 1;

  // 7b. Unique normalized
  const norms = files.wordBank.words.map(w => w.normalized);
  const normDups = norms.filter((n, i) => norms.indexOf(n) !== i);
  if (normDups.length > 0) {
    console.error(`  ❌ word-bank-foundation.json: Duplicate normalized values:`, [...new Set(normDups)]);
    exitCode = 1;
  }

  // 7c. Syllable count coherence
  let syllableErrors = 0;
  files.wordBank.words.forEach(w => {
    if (w.syllableCount !== w.syllables.length) {
      console.error(`  ❌ word-bank: ${w.id} syllableCount=${w.syllableCount} but syllables.length=${w.syllables.length}`);
      syllableErrors++;
    }
  });
  if (syllableErrors > 0) {
    exitCode = 1;
  } else {
    console.log('  ✅ All syllable counts coherent');
  }

  // 7d. Minimum 80% imageable (difficulty <= 3 as proxy)
  const imageableCount = files.wordBank.words.filter(w => w.difficulty <= 3).length;
  const imageablePercent = Math.round(imageableCount / wordCount * 100);
  if (imageablePercent < 80) {
    console.error(`  ❌ Word bank: ${imageablePercent}% imageable (expected >= 80%)`);
    exitCode = 1;
  } else {
    console.log(`  ✅ Imageable: ${imageableCount}/${wordCount} (${imageablePercent}%)`);
  }

  // 7e. New words should be pending_review
  const reviewedCount = files.wordBank.words.filter(w => w.status === 'reviewed').length;
  if (reviewedCount > 0) {
    console.error(`  ❌ Word bank: ${reviewedCount} words marked as reviewed (new words should be pending_review)`);
    exitCode = 1;
  }

  // 8. Curriculum validation
  console.log('\n📋 Validando currículo...');
  const mappings = files.curriculumMapping.mappings;

  // 8a. Exact duplicates (skillId + level + subject + oaCode)
  const exactKeys = mappings.map(m => `${m.skillId}|${m.level}|${m.subject}|${m.oaCode}`);
  const exactDups = exactKeys.filter((k, i) => exactKeys.indexOf(k) !== i);
  if (exactDups.length > 0) {
    console.error(`  ❌ Curriculum: ${exactDups.length} exact duplicate(s) found`);
    exitCode = 1;
  } else {
    console.log('  ✅ No exact curriculum duplicates');
  }

  // 8b. Verified mappings must have sourceUrl
  const verifiedNoSource = mappings.filter(m => m.verificationStatus === 'verified' && (!m.sourceUrl || m.sourceUrl === ''));
  if (verifiedNoSource.length > 0) {
    console.error(`  ❌ Curriculum: ${verifiedNoSource.length} verified mappings without sourceUrl`);
    verifiedNoSource.forEach(m => console.error(`    ${m.skillId} -> ${m.oaCode}`));
    exitCode = 1;
  }

  // 8c. Verified mappings must have oaCode
  const verifiedNoOA = mappings.filter(m => m.verificationStatus === 'verified' && (!m.oaCode || m.oaCode === ''));
  if (verifiedNoOA.length > 0) {
    console.error(`  ❌ Curriculum: ${verifiedNoOA.length} verified mappings without oaCode`);
    exitCode = 1;
  }

  console.log(`  ✅ ${mappings.length} curriculum mappings`);

  // 9. Standard mission schema removed
  console.log('\n🗑️  Verificando eliminación de standard-mission.schema.json...');
  const stdMissionPath = path.join(ROOT, 'schemas', 'standard-mission.schema.json');
  if (fs.existsSync(stdMissionPath)) {
    console.error('  ❌ standard-mission.schema.json still exists');
    exitCode = 1;
  } else {
    console.log('  ✅ standard-mission.schema.json removed');
  }

  // 10. Final result
  console.log('\n' + '='.repeat(50));
  if (exitCode === 0) {
    console.log('✅ VALIDACIÓN EXITOSA - Learning Foundation V1');
  } else {
    console.log('❌ VALIDACIÓN FALLIDA - Revisar errores arriba');
  }
  console.log('='.repeat(50));

  process.exit(exitCode);
}

main().catch(e => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});
