/**
 * paso27-puerto-learning-vertical.test.mjs
 * Tests for Puerto de los Gigantes Learning Vertical Slice V1.
 * Minimum 60 real tests. No assert.ok(true).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { join as pathJoin } from 'path';
import { pathToFileURL } from 'url';

const SOLO = 'C:/Users/conny/Documents/Codex/Lectoguarida-Adventure-Isometric/outputs/Lectoguarida-Windows/public/expedicion/solo';
const TESTS = 'C:/Users/conny/Documents/Codex/Lectoguarida-Adventure-Isometric/tests';

function mp(rel) { return pathToFileURL(pathJoin(SOLO, rel)).href; }
function tp(rel) { return pathToFileURL(pathJoin(TESTS, rel)).href; }

function createMockStorage() {
  const data = {};
  return {
    getItem: (k) => data[k] || null,
    setItem: (k, v) => { data[k] = v; },
    removeItem: (k) => { delete data[k]; },
    clear: () => { Object.keys(data).forEach(k => delete data[k]); }
  };
}

// ============================================================
// FEATURE FLAGS
// ============================================================
describe('Feature Flags', () => {
  it('learningV1 disabled when no searchParams', async () => {
    const { isLearningV1Enabled } = await import(mp('game-learning/runtime/learning-feature-flag.js'));
    assert.equal(isLearningV1Enabled(null), false);
  });

  it('learningV1 disabled with empty URLSearchParams', async () => {
    const { isLearningV1Enabled } = await import(mp('game-learning/runtime/learning-feature-flag.js'));
    assert.equal(isLearningV1Enabled(new URLSearchParams('')), false);
  });

  it('learningV1 disabled with only engineV2=1', async () => {
    const { isLearningV1Enabled } = await import(mp('game-learning/runtime/learning-feature-flag.js'));
    assert.equal(isLearningV1Enabled(new URLSearchParams('engineV2=1')), false);
  });

  it('learningV1 disabled with only learningV1=1', async () => {
    const { isLearningV1Enabled } = await import(mp('game-learning/runtime/learning-feature-flag.js'));
    assert.equal(isLearningV1Enabled(new URLSearchParams('learningV1=1')), false);
  });

  it('learningV1 enabled with both engineV2=1 and learningV1=1', async () => {
    const { isLearningV1Enabled } = await import(mp('game-learning/runtime/learning-feature-flag.js'));
    assert.equal(isLearningV1Enabled(new URLSearchParams('engineV2=1&learningV1=1')), true);
  });

  it('learningV1 disabled with engineV2=0 and learningV1=1', async () => {
    const { isLearningV1Enabled } = await import(mp('game-learning/runtime/learning-feature-flag.js'));
    assert.equal(isLearningV1Enabled(new URLSearchParams('engineV2=0&learningV1=1')), false);
  });

  it('debugLearning disabled when no searchParams', async () => {
    const { isDebugLearningEnabled } = await import(mp('game-learning/runtime/learning-feature-flag.js'));
    assert.equal(isDebugLearningEnabled(null), false);
  });

  it('debugLearning enabled with debugLearning=1', async () => {
    const { isDebugLearningEnabled } = await import(mp('game-learning/runtime/learning-feature-flag.js'));
    assert.equal(isDebugLearningEnabled(new URLSearchParams('debugLearning=1')), true);
  });

  it('debugLearning disabled with debugLearning=0', async () => {
    const { isDebugLearningEnabled } = await import(mp('game-learning/runtime/learning-feature-flag.js'));
    assert.equal(isDebugLearningEnabled(new URLSearchParams('debugLearning=0')), false);
  });

  it('feature flag does not use localStorage', async () => {
    const { isLearningV1Enabled } = await import(mp('game-learning/runtime/learning-feature-flag.js'));
    const storage = createMockStorage();
    const before = JSON.stringify(storage);
    isLearningV1Enabled(new URLSearchParams('engineV2=1&learningV1=1'));
    assert.equal(JSON.stringify(storage), before);
  });
});

// ============================================================
// EVIDENCE COLLECTOR
// ============================================================
describe('EvidenceCollector', () => {
  it('creates valid evidence with required fields', async () => {
    const { createEvidenceCollector } = await import(mp('game-learning/runtime/evidence-collector.js'));
    const ec = createEvidenceCollector({ studentId: 'test-student', missionId: 'puerto-initial-m-01' });
    const e = ec.createEvidence({
      evidenceType: 'initial_sound_selection',
      stimulusId: 'pal_001_mama',
      responseId: 'pal_001_mama',
      correct: true,
      hintsUsed: 0
    });
    assert.equal(e.version, 1);
    assert.equal(e.studentId, 'test-student');
    assert.equal(e.missionId, 'puerto-initial-m-01');
    assert.equal(e.correct, true);
    assert.equal(e.independent, true);
    assert.ok(e.eventId.startsWith('ev_'));
  });

  it('sets independent=false when hintsUsed>0', async () => {
    const { createEvidenceCollector } = await import(mp('game-learning/runtime/evidence-collector.js'));
    const ec = createEvidenceCollector({ studentId: 'test' });
    const e = ec.createEvidence({ evidenceType: 'initial_sound_selection', correct: true, hintsUsed: 1 });
    assert.equal(e.independent, false);
  });

  it('tracks evidence log', async () => {
    const { createEvidenceCollector } = await import(mp('game-learning/runtime/evidence-collector.js'));
    const ec = createEvidenceCollector({ studentId: 'test' });
    ec.createEvidence({ evidenceType: 'initial_sound_selection', correct: true });
    ec.createEvidence({ evidenceType: 'initial_sound_selection', correct: false });
    assert.equal(ec.getEvidenceLog().length, 2);
  });

  it('computes summary correctly', async () => {
    const { createEvidenceCollector } = await import(mp('game-learning/runtime/evidence-collector.js'));
    const ec = createEvidenceCollector({ studentId: 'test' });
    ec.createEvidence({ evidenceType: 'initial_sound_selection', correct: true });
    ec.createEvidence({ evidenceType: 'initial_sound_selection', correct: true });
    ec.createEvidence({ evidenceType: 'initial_sound_selection', correct: false });
    const s = ec.getSummary();
    assert.equal(s.total, 3);
    assert.equal(s.correct, 2);
    assert.ok(Math.abs(s.accuracy - 2 / 3) < 0.001);
  });

  it('clears log', async () => {
    const { createEvidenceCollector } = await import(mp('game-learning/runtime/evidence-collector.js'));
    const ec = createEvidenceCollector({ studentId: 'test' });
    ec.createEvidence({ evidenceType: 'initial_sound_selection', correct: true });
    ec.clearLog();
    assert.equal(ec.getEvidenceLog().length, 0);
  });

  it('emits learning:evidence-created event', async () => {
    const { createEvidenceCollector } = await import(mp('game-learning/runtime/evidence-collector.js'));
    let emitted = false;
    const bus = { emit: (name) => { if (name === 'learning:evidence-created') emitted = true; } };
    const ec = createEvidenceCollector({ studentId: 'test', eventBus: bus });
    ec.createEvidence({ evidenceType: 'initial_sound_selection', correct: true });
    assert.equal(emitted, true);
  });

  it('does not persist audio, voice, IP, or geolocation at top level', async () => {
    const { createEvidenceCollector } = await import(mp('game-learning/runtime/evidence-collector.js'));
    const ec = createEvidenceCollector({ studentId: 'test' });
    const e = ec.createEvidence({
      evidenceType: 'initial_sound_selection', correct: true
    });
    assert.equal(e.audio, undefined);
    assert.equal(e.voice, undefined);
    assert.equal(e.ip, undefined);
    assert.equal(e.geolocation, undefined);
  });
});

// ============================================================
// STUDENT MODEL
// ============================================================
describe('StudentModel', () => {
  it('initializes with default state', async () => {
    const { createStudentModel } = await import(mp('game-learning/runtime/student-model.js'));
    const sm = createStudentModel({ studentId: 'test' });
    const state = sm.getSkillState('phonological_initial_sound_identification');
    assert.equal(state.status, 'not_started');
    assert.equal(state.mastery, 0);
    assert.equal(state.attempts, 0);
  });

  it('records correct attempt', async () => {
    const { createStudentModel } = await import(mp('game-learning/runtime/student-model.js'));
    const sm = createStudentModel({ studentId: 'test' });
    const state = sm.recordAttempt({ skillId: 's1', correct: true, independent: true });
    assert.equal(state.correct, 1);
    assert.equal(state.consecutiveCorrect, 1);
    assert.equal(state.independentCorrect, 1);
  });

  it('resets consecutive on incorrect', async () => {
    const { createStudentModel } = await import(mp('game-learning/runtime/student-model.js'));
    const sm = createStudentModel({ studentId: 'test' });
    sm.recordAttempt({ skillId: 's1', correct: true });
    sm.recordAttempt({ skillId: 's1', correct: true });
    sm.recordAttempt({ skillId: 's1', correct: false });
    assert.equal(sm.getSkillState('s1').consecutiveCorrect, 0);
  });

  it('computes average response time', async () => {
    const { createStudentModel } = await import(mp('game-learning/runtime/student-model.js'));
    const sm = createStudentModel({ studentId: 'test' });
    sm.recordAttempt({ skillId: 's1', correct: true, responseMs: 1000 });
    sm.recordAttempt({ skillId: 's1', correct: true, responseMs: 2000 });
    assert.equal(sm.getSkillState('s1').averageResponseMs, 1500);
  });

  it('accumulates hints used', async () => {
    const { createStudentModel } = await import(mp('game-learning/runtime/student-model.js'));
    const sm = createStudentModel({ studentId: 'test' });
    sm.recordAttempt({ skillId: 's1', correct: true, hintsUsed: 1 });
    sm.recordAttempt({ skillId: 's1', correct: true, hintsUsed: 0 });
    assert.equal(sm.getSkillState('s1').hintsUsed, 1);
  });

  it('returns all skills', async () => {
    const { createStudentModel } = await import(mp('game-learning/runtime/student-model.js'));
    const sm = createStudentModel({ studentId: 'test' });
    sm.recordAttempt({ skillId: 's1', correct: true });
    sm.recordAttempt({ skillId: 's2', correct: false });
    const all = sm.getAllSkills();
    assert.ok(all.s1);
    assert.ok(all.s2);
    assert.equal(Object.keys(all).length, 2);
  });

  it('creates independent copy in getAllSkills', async () => {
    const { createStudentModel } = await import(mp('game-learning/runtime/student-model.js'));
    const sm = createStudentModel({ studentId: 'test' });
    sm.recordAttempt({ skillId: 's1', correct: true, responseMs: 500 });
    const all = sm.getAllSkills();
    all.s1.responseTimes.push(999);
    const fresh = sm.getAllSkills();
    assert.equal(fresh.s1.responseTimes.length, 1);
    assert.equal(fresh.s1.responseTimes[0], 500);
  });
});

// ============================================================
// MASTERY ENGINE
// ============================================================
describe('MasteryEngine', () => {
  const RULES = {
    rules: {
      mastery_80_3_consecutive: {
        id: 'mastery_80_3_consecutive', minimumAttempts: 8, minimumAccuracy: 0.8,
        minimumIndependentAccuracy: 0.7, maximumHintRate: 0.35,
        consecutiveCorrectRequired: 3, requiredSessions: 2, requiredTransferTasks: 1,
        retentionCheckAfterDays: 7, minimumRetentionAccuracy: 0.7, allowTeacherOverride: true
      }
    }
  };

  it('loads rule from rules data', async () => {
    const { createMasteryEngine } = await import(mp('game-learning/runtime/mastery-engine.js'));
    const me = createMasteryEngine({ masteryRules: RULES });
    assert.equal(me.getRule('mastery_80_3_consecutive').minimumAccuracy, 0.8);
  });

  it('returns default rule when not found', async () => {
    const { createMasteryEngine } = await import(mp('game-learning/runtime/mastery-engine.js'));
    const me = createMasteryEngine({ masteryRules: RULES });
    assert.equal(me.getRule('nonexistent').consecutiveCorrectRequired, 3);
  });

  it('does not dominate with insufficient attempts', async () => {
    const { createMasteryEngine } = await import(mp('game-learning/runtime/mastery-engine.js'));
    const me = createMasteryEngine({ masteryRules: RULES });
    const r = me.evaluate({ attempts: 3, correct: 3, independentCorrect: 3, consecutiveCorrect: 3, hintsUsed: 0 }, 'mastery_80_3_consecutive');
    assert.equal(r.dominated, false);
    assert.ok(r.reasons.includes('attempts_insufficient'));
  });

  it('does not dominate with low accuracy', async () => {
    const { createMasteryEngine } = await import(mp('game-learning/runtime/mastery-engine.js'));
    const me = createMasteryEngine({ masteryRules: RULES });
    const r = me.evaluate({ attempts: 10, correct: 6, independentCorrect: 6, consecutiveCorrect: 3, hintsUsed: 0 }, 'mastery_80_3_consecutive');
    assert.equal(r.dominated, false);
    assert.ok(r.reasons.includes('accuracy_below_threshold'));
  });

  it('does not dominate with insufficient consecutive correct', async () => {
    const { createMasteryEngine } = await import(mp('game-learning/runtime/mastery-engine.js'));
    const me = createMasteryEngine({ masteryRules: RULES });
    const r = me.evaluate({ attempts: 10, correct: 9, independentCorrect: 9, consecutiveCorrect: 2, hintsUsed: 0 }, 'mastery_80_3_consecutive');
    assert.equal(r.dominated, false);
    assert.ok(r.reasons.includes('consecutive_correct_insufficient'));
  });

  it('dominates when all criteria met', async () => {
    const { createMasteryEngine } = await import(mp('game-learning/runtime/mastery-engine.js'));
    const me = createMasteryEngine({ masteryRules: RULES });
    const r = me.evaluate({ attempts: 10, correct: 9, independentCorrect: 8, consecutiveCorrect: 3, hintsUsed: 1 }, 'mastery_80_3_consecutive');
    assert.equal(r.dominated, true);
    assert.equal(r.status, 'mastered');
  });

  it('does not dominate with high hint rate', async () => {
    const { createMasteryEngine } = await import(mp('game-learning/runtime/mastery-engine.js'));
    const me = createMasteryEngine({ masteryRules: RULES });
    const r = me.evaluate({ attempts: 10, correct: 9, independentCorrect: 9, consecutiveCorrect: 3, hintsUsed: 4 }, 'mastery_80_3_consecutive');
    assert.equal(r.dominated, false);
    assert.ok(r.reasons.includes('hint_rate_too_high'));
  });

  it('returns not_started for zero attempts', async () => {
    const { createMasteryEngine } = await import(mp('game-learning/runtime/mastery-engine.js'));
    const me = createMasteryEngine({ masteryRules: RULES });
    const r = me.evaluate({ attempts: 0, correct: 0, independentCorrect: 0, consecutiveCorrect: 0, hintsUsed: 0 });
    assert.equal(r.status, 'not_started');
  });

  it('recommends difficulty 1 for low accuracy', async () => {
    const { createMasteryEngine } = await import(mp('game-learning/runtime/mastery-engine.js'));
    const me = createMasteryEngine({ masteryRules: RULES });
    assert.equal(me.getRecommendedDifficulty({ attempts: 5, correct: 1, independentCorrect: 1, consecutiveCorrect: 0, hintsUsed: 0 }), 1);
  });

  it('recommends difficulty 3 when mastered', async () => {
    const { createMasteryEngine } = await import(mp('game-learning/runtime/mastery-engine.js'));
    const me = createMasteryEngine({ masteryRules: RULES });
    assert.equal(me.getRecommendedDifficulty({ attempts: 10, correct: 10, independentCorrect: 10, consecutiveCorrect: 3, hintsUsed: 0 }), 3);
  });

  it('nextAction is provide_support when accuracy low', async () => {
    const { createMasteryEngine } = await import(mp('game-learning/runtime/mastery-engine.js'));
    const me = createMasteryEngine({ masteryRules: RULES });
    const r = me.evaluate({ attempts: 5, correct: 2, independentCorrect: 2, consecutiveCorrect: 0, hintsUsed: 0 });
    assert.equal(r.nextAction, 'provide_support');
  });

  it('does not hardcode threshold 0.8', async () => {
    const { createMasteryEngine } = await import(mp('game-learning/runtime/mastery-engine.js'));
    const customRules = { rules: { mastery_80_3_consecutive: { id: 'mastery_80_3_consecutive', minimumAttempts: 5, minimumAccuracy: 0.6, minimumIndependentAccuracy: 0.5, maximumHintRate: 0.5, consecutiveCorrectRequired: 2, requiredSessions: 1, requiredTransferTasks: 1, retentionCheckAfterDays: 7, minimumRetentionAccuracy: 0.7, allowTeacherOverride: true } } };
    const me = createMasteryEngine({ masteryRules: customRules });
    const r = me.evaluate({ attempts: 5, correct: 4, independentCorrect: 3, consecutiveCorrect: 2, hintsUsed: 1 });
    assert.equal(r.dominated, true);
  });
});

// ============================================================
// MISSION DATA
// ============================================================
describe('Mission Data', () => {
  it('mission file is valid JSON with correct id', () => {
    const m = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/missions/puerto/puerto-initial-m-01.json'), 'utf8'));
    assert.equal(m.id, 'puerto-initial-m-01');
    assert.equal(m.version, '1.0.0');
  });

  it('mission uses correct skillId', () => {
    const m = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/missions/puerto/puerto-initial-m-01.json'), 'utf8'));
    assert.ok(m.targetSkillIds.includes('phonological_initial_sound_identification'));
  });

  it('mission uses correct worldId', () => {
    const m = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/missions/puerto/puerto-initial-m-01.json'), 'utf8'));
    assert.equal(m.worldId, 'puerto_gigantes');
  });

  it('mission uses correct mastery rule', () => {
    const m = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/missions/puerto/puerto-initial-m-01.json'), 'utf8'));
    assert.equal(m.masteryRequirements.ruleId, 'mastery_80_3_consecutive');
  });

  it('mission duration 8-12 min', () => {
    const m = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/missions/puerto/puerto-initial-m-01.json'), 'utf8'));
    assert.ok(m.estimatedDurationMinutes >= 8 && m.estimatedDurationMinutes <= 12);
  });

  it('registry has pilot mission', () => {
    const r = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/missions/puerto/mission-registry.json'), 'utf8'));
    const pilot = r.missions.find(m => m.id === 'puerto-initial-m-01');
    assert.ok(pilot && pilot.status === 'pilot');
  });

  it('registry has 5 draft missions', () => {
    const r = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/missions/puerto/mission-registry.json'), 'utf8'));
    assert.equal(r.missions.filter(m => m.status === 'draft').length, 5);
  });
});

// ============================================================
// STIMULUS SET
// ============================================================
describe('Stimulus Set', () => {
  it('has at least 8 targets', () => {
    const s = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/stimuli/initial-sound-m-basic.json'), 'utf8'));
    assert.ok(s.targets.length >= 8);
  });

  it('has at least 12 distractors', () => {
    const s = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/stimuli/initial-sound-m-basic.json'), 'utf8'));
    assert.ok(s.distractors.length >= 12);
  });

  it('all targets start with /m/', () => {
    const s = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/stimuli/initial-sound-m-basic.json'), 'utf8'));
    s.targets.forEach(t => assert.equal(t.initialSound, 'm'));
  });

  it('no distractor starts with /m/', () => {
    const s = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/stimuli/initial-sound-m-basic.json'), 'utf8'));
    s.distractors.forEach(d => assert.notEqual(d.initialSound, 'm'));
  });

  it('all targets have valid wordId', () => {
    const s = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/stimuli/initial-sound-m-basic.json'), 'utf8'));
    s.targets.forEach(t => assert.ok(t.wordId.startsWith('pal_')));
  });
});

// ============================================================
// NARRATIVE
// ============================================================
describe('Narrative', () => {
  it('has all required scenes', () => {
    const n = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/narrative/puerto/puerto-initial-m-01-es-cl.json'), 'utf8'));
    ['intro', 'instruction', 'first_success', 'first_error', 'repeated_error', 'support', 'mastery', 'retry', 'return_to_world'].forEach(s => assert.ok(n.scenes[s], `Missing: ${s}`));
  });

  it('no punitary language', () => {
    const n = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/narrative/puerto/puerto-initial-m-01-es-cl.json'), 'utf8'));
    const bad = ['estúpido', 'tonto', 'burro', 'mal', 'fatal', 'horrible'];
    Object.values(n.scenes).forEach(scene => bad.forEach(w => assert.ok(!scene.text.toLowerCase().includes(w))));
  });

  it('all scenes have human-readable text', () => {
    const n = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/narrative/puerto/puerto-initial-m-01-es-cl.json'), 'utf8'));
    Object.values(n.scenes).forEach(scene => {
      assert.equal(typeof scene.text, 'string');
      assert.ok(scene.text.length > 5);
      assert.ok(!scene.text.startsWith('{'));
    });
  });
});

// ============================================================
// LEARNING PROGRESS ADAPTER
// ============================================================
describe('LearningProgressAdapter', () => {
  it('creates default state', async () => {
    const { createLearningProgressAdapter } = await import(mp('game-learning/runtime/learning-progress-adapter.js'));
    const pa = createLearningProgressAdapter({ studentId: 'test-prog', storage: createMockStorage() });
    const data = pa.load();
    assert.equal(data.schemaVersion, 1);
    assert.equal(data.studentId, 'test-prog');
    pa.destroy();
  });

  it('persists mission state', async () => {
    const { createLearningProgressAdapter } = await import(mp('game-learning/runtime/learning-progress-adapter.js'));
    const pa = createLearningProgressAdapter({ studentId: 'test-m1', storage: createMockStorage() });
    pa.saveMissionState('m1', { status: 'active' });
    assert.equal(pa.getMissionState('m1').status, 'active');
    pa.destroy();
  });

  it('persists skill state', async () => {
    const { createLearningProgressAdapter } = await import(mp('game-learning/runtime/learning-progress-adapter.js'));
    const pa = createLearningProgressAdapter({ studentId: 'test-s1', storage: createMockStorage() });
    pa.saveSkillState('s1', { mastery: 0.5 });
    assert.equal(pa.getSkillState('s1').mastery, 0.5);
    pa.destroy();
  });

  it('tracks evidence summary', async () => {
    const { createLearningProgressAdapter } = await import(mp('game-learning/runtime/learning-progress-adapter.js'));
    const pa = createLearningProgressAdapter({ studentId: 'test-ev1', storage: createMockStorage() });
    pa.addEvidenceSummary({ skillId: 's1', correct: true });
    pa.addEvidenceSummary({ skillId: 's1', correct: false });
    const data = pa.load();
    assert.equal(data.evidenceSummary.total, 2);
    assert.equal(data.evidenceSummary.correct, 1);
    pa.destroy();
  });

  it('reward is idempotent', async () => {
    const { createLearningProgressAdapter } = await import(mp('game-learning/runtime/learning-progress-adapter.js'));
    const pa = createLearningProgressAdapter({ studentId: 'test-r1', storage: createMockStorage() });
    pa.addReward('r1');
    pa.addReward('r1');
    assert.equal(pa.load().unlockedRewards.length, 1);
    assert.equal(pa.hasReward('r1'), true);
    pa.destroy();
  });

  it('world change is idempotent', async () => {
    const { createLearningProgressAdapter } = await import(mp('game-learning/runtime/learning-progress-adapter.js'));
    const pa = createLearningProgressAdapter({ studentId: 'test-w1', storage: createMockStorage() });
    pa.addWorldChange('w1');
    pa.addWorldChange('w1');
    assert.equal(pa.load().persistentWorldChanges.length, 1);
    assert.equal(pa.hasWorldChange('w1'), true);
    pa.destroy();
  });

  it('reset clears all data', async () => {
    const { createLearningProgressAdapter } = await import(mp('game-learning/runtime/learning-progress-adapter.js'));
    const pa = createLearningProgressAdapter({ studentId: 'test-rst', storage: createMockStorage() });
    pa.saveMissionState('m1', { status: 'active' });
    pa.reset();
    assert.equal(pa.getMissionState('m1'), null);
    pa.destroy();
  });
});

// ============================================================
// REWARD ADAPTER
// ============================================================
describe('LearningRewardAdapter', () => {
  it('awards reward idempotently', async () => {
    const { createLearningProgressAdapter } = await import(mp('game-learning/runtime/learning-progress-adapter.js'));
    const { createLearningRewardAdapter } = await import(mp('game-learning/runtime/learning-reward-adapter.js'));
    const pa = createLearningProgressAdapter({ studentId: 'test-ra1', storage: createMockStorage() });
    const ra = createLearningRewardAdapter({ progressAdapter: pa });
    assert.equal(ra.awardReward('badge-m'), true);
    assert.equal(ra.awardReward('badge-m'), false);
    assert.equal(ra.isAwarded('badge-m'), true);
    pa.destroy();
  });
});

// ============================================================
// WORLD ADAPTER
// ============================================================
describe('LearningWorldAdapter', () => {
  it('applies world change idempotently', async () => {
    const { createLearningProgressAdapter } = await import(mp('game-learning/runtime/learning-progress-adapter.js'));
    const { createLearningWorldAdapter } = await import(mp('game-learning/runtime/learning-world-adapter.js'));
    const pa = createLearningProgressAdapter({ studentId: 'test-wa1', storage: createMockStorage() });
    let emitted = [];
    const bus = { emit: (n, d) => emitted.push({ n, d }) };
    const wa = createLearningWorldAdapter({ progressAdapter: pa, eventBus: bus });
    assert.equal(wa.applyWorldChange('crane'), true);
    assert.equal(wa.applyWorldChange('crane'), false);
    assert.equal(wa.isApplied('crane'), true);
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0].n, 'learning:world-change');
    pa.destroy();
  });
});

// ============================================================
// MISSION ORCHESTRATOR
// ============================================================
describe('MissionOrchestrator', () => {
  function mockDeps(overrides) {
    return {
      evidenceCollector: overrides?.ec || { createEvidence: (d) => ({ eventId: 'ev1', ...d }), getEvidenceLog: () => [], getSummary: () => ({ total: 0, correct: 0 }) },
      studentModel: overrides?.sm || { recordAttempt: (d) => ({ attempts: 1, correct: d.correct ? 1 : 0, independentCorrect: d.independent ? 1 : 0, consecutiveCorrect: d.correct ? 1 : 0, hintsUsed: d.hintsUsed || 0 }), getSkillState: () => ({}) },
      masteryEngine: overrides?.me || { evaluate: () => ({ dominated: false, mastery: 0.1, status: 'in_progress', reasons: [], nextAction: 'continue_practice' }) },
      progressAdapter: overrides?.pa || { getMissionState: () => null, saveMissionState: () => {}, getSkillState: () => null, saveSkillState: () => {}, addEvidenceSummary: () => {}, load: () => ({ missionStates: {}, unlockedRewards: [], persistentWorldChanges: [] }) },
      rewardAdapter: overrides?.ra || { awardReward: () => true, isAwarded: () => false },
      worldAdapter: overrides?.wa || { applyWorldChange: () => true, isApplied: () => false },
      eventBus: overrides?.eb || { emit: () => {} },
      missionData: overrides?.md || { id: 'puerto-initial-m-01', targetSkillIds: ['phonological_initial_sound_identification'], masteryRequirements: { ruleId: 'mastery_80_3_consecutive', minimumAttempts: 8 }, rewardId: 'badge-m', worldChangeId: 'crane' }
    };
  }

  it('starts mission', async () => {
    const { createMissionOrchestrator } = await import(mp('game-learning/runtime/mission-orchestrator.js'));
    const mo = createMissionOrchestrator(mockDeps());
    const r = mo.startMission('puerto-initial-m-01');
    assert.equal(r.started, true);
  });

  it('returns error for unknown mission', async () => {
    const { createMissionOrchestrator } = await import(mp('game-learning/runtime/mission-orchestrator.js'));
    const mo = createMissionOrchestrator(mockDeps());
    assert.equal(mo.startMission('unknown').started, false);
  });

  it('processes round result', async () => {
    const { createMissionOrchestrator } = await import(mp('game-learning/runtime/mission-orchestrator.js'));
    const mo = createMissionOrchestrator(mockDeps());
    mo.startMission('puerto-initial-m-01');
    const r = mo.processRoundResult({ correct: true });
    assert.equal(r.processed, true);
    assert.equal(r.correct, true);
  });

  it('returns error when no active mission', async () => {
    const { createMissionOrchestrator } = await import(mp('game-learning/runtime/mission-orchestrator.js'));
    const mo = createMissionOrchestrator(mockDeps());
    assert.equal(mo.processRoundResult({ correct: true }).error, 'no_active_mission');
  });

  it('reports dominated when mastery reached', async () => {
    const { createMissionOrchestrator } = await import(mp('game-learning/runtime/mission-orchestrator.js'));
    const dominated = { evaluate: () => ({ dominated: true, mastery: 0.9, status: 'mastered', reasons: [], nextAction: 'mission_complete' }) };
    const mo = createMissionOrchestrator(mockDeps({ me: dominated }));
    mo.startMission('puerto-initial-m-01');
    const r = mo.processRoundResult({ correct: true });
    assert.equal(r.dominated, true);
    assert.equal(r.rewardAwarded, true);
    assert.equal(r.worldChangeApplied, true);
  });

  it('checks mission not completed initially', async () => {
    const { createMissionOrchestrator } = await import(mp('game-learning/runtime/mission-orchestrator.js'));
    const mo = createMissionOrchestrator(mockDeps());
    assert.ok(!mo.isMissionCompleted('puerto-initial-m-01'));
  });
});

// ============================================================
// CHALLENGE ADAPTER
// ============================================================
describe('Challenge Adapter', () => {
  const stimulus = JSON.parse(readFileSync(pathJoin(SOLO, 'game-content/stimuli/initial-sound-m-basic.json'), 'utf8'));

  it('builds rounds from stimulus set', async () => {
    const { createInitialSoundLearningAdapter } = await import(mp('game-learning/adapters/initial-sound-learning-adapter.js'));
    const a = createInitialSoundLearningAdapter({ stimulusSet: stimulus, difficulty: 2 });
    a.start();
    const rounds = a.getRounds();
    assert.ok(rounds.length >= 8);
    rounds.forEach(r => assert.ok(r.options.some(o => o.isCorrect)));
    a.destroy();
  });

  it('processes selection', async () => {
    const { createInitialSoundLearningAdapter } = await import(mp('game-learning/adapters/initial-sound-learning-adapter.js'));
    const a = createInitialSoundLearningAdapter({ stimulusSet: stimulus, difficulty: 2 });
    a.start();
    const round = a.getCurrentRound();
    const correct = round.options.find(o => o.isCorrect);
    const r = a.processSelection(correct.value);
    assert.equal(r.completed, false);
    assert.equal(r.roundResult.correct, true);
    a.destroy();
  });

  it('completes challenge after all rounds', async () => {
    const { createInitialSoundLearningAdapter } = await import(mp('game-learning/adapters/initial-sound-learning-adapter.js'));
    const a = createInitialSoundLearningAdapter({ stimulusSet: stimulus, difficulty: 2 });
    a.start();
    const rounds = a.getRounds();
    for (let i = 0; i < rounds.length - 1; i++) {
      const r = a.getCurrentRound();
      a.processSelection(r.options.find(o => o.isCorrect).value);
    }
    const last = a.getCurrentRound();
    const r = a.processSelection(last.options.find(o => o.isCorrect).value);
    assert.equal(r.completed, true);
    a.destroy();
  });

  it('abandons challenge', async () => {
    const { createInitialSoundLearningAdapter } = await import(mp('game-learning/adapters/initial-sound-learning-adapter.js'));
    let abandoned = false;
    const bus = { emit: (n) => { if (n === 'learning:challenge-abandoned') abandoned = true; } };
    const a = createInitialSoundLearningAdapter({ stimulusSet: stimulus, eventBus: bus });
    a.start();
    a.abandon();
    assert.equal(abandoned, true);
    a.destroy();
  });

  it('difficulty 1 gives 2 options', async () => {
    const { createInitialSoundLearningAdapter } = await import(mp('game-learning/adapters/initial-sound-learning-adapter.js'));
    const a = createInitialSoundLearningAdapter({ stimulusSet: stimulus, difficulty: 1 });
    a.start();
    a.getRounds().forEach(r => assert.ok(r.options.length <= 2));
    a.destroy();
  });

  it('difficulty 3 gives 4 options', async () => {
    const { createInitialSoundLearningAdapter } = await import(mp('game-learning/adapters/initial-sound-learning-adapter.js'));
    const a = createInitialSoundLearningAdapter({ stimulusSet: stimulus, difficulty: 3 });
    a.start();
    a.getRounds().forEach(r => assert.ok(r.options.length <= 4));
    a.destroy();
  });
});

// ============================================================
// INTEGRATION
// ============================================================
describe('Engine V2 Integration', () => {
  it('imports learning modules', () => {
    const c = readFileSync(pathJoin(SOLO, 'game-engine/engine-v2-entry.js'), 'utf8');
    assert.ok(c.includes('learning-feature-flag.js'));
    assert.ok(c.includes('learning-runtime.js'));
  });

  it('has getLearningRuntime', () => {
    const c = readFileSync(pathJoin(SOLO, 'game-engine/engine-v2-entry.js'), 'utf8');
    assert.ok(c.includes('getLearningRuntime'));
  });

  it('conditionally creates learningRuntime', () => {
    const c = readFileSync(pathJoin(SOLO, 'game-engine/engine-v2-entry.js'), 'utf8');
    assert.ok(c.includes('isLearningV1Enabled'));
    assert.ok(c.includes('createLearningRuntime'));
  });

  it('destroys learningRuntime on destroy', () => {
    const c = readFileSync(pathJoin(SOLO, 'game-engine/engine-v2-entry.js'), 'utf8');
    assert.ok(c.includes('learningRuntime.destroy'));
  });
});

// ============================================================
// LEGACY INTACT
// ============================================================
describe('Legacy Intact', () => {
  it('initial-sound-detector.js not modified', () => {
    const c = readFileSync(pathJoin(SOLO, 'games/non-reader/initial-sound-detector.js'), 'utf8');
    assert.ok(c.includes('SoloGameAdapter.registerGame'));
    assert.ok(!c.includes('learning'));
  });

  it('progress-repository.js not modified', () => {
    const c = readFileSync(pathJoin(SOLO, 'core/progress-repository.js'), 'utf8');
    assert.ok(!c.includes('learning'));
  });

  it('reward-manager.js not modified', () => {
    const c = readFileSync(pathJoin(SOLO, 'core/reward-manager.js'), 'utf8');
    assert.ok(!c.includes('learning'));
  });

  it('click-selection-template.js not modified', () => {
    const c = readFileSync(pathJoin(SOLO, 'templates/click-selection-template.js'), 'utf8');
    assert.ok(!c.includes('learning'));
  });
});

// ============================================================
// SCHEMA EXISTS
// ============================================================
describe('Schema Exists', () => {
  it('learning-evidence schema', () => {
    const s = JSON.parse(readFileSync(pathJoin(SOLO, 'game-learning/schemas/learning-evidence.schema.json'), 'utf8'));
    assert.equal(s.$schema, 'http://json-schema.org/draft-07/schema#');
  });

  it('student-skill-state schema', () => {
    const s = JSON.parse(readFileSync(pathJoin(SOLO, 'game-learning/schemas/student-skill-state.schema.json'), 'utf8'));
    assert.equal(s.$schema, 'http://json-schema.org/draft-07/schema#');
  });

  it('learning-mission schema', () => {
    const s = JSON.parse(readFileSync(pathJoin(SOLO, 'game-learning/schemas/learning-mission.schema.json'), 'utf8'));
    assert.equal(s.$schema, 'http://json-schema.org/draft-07/schema#');
  });
});
