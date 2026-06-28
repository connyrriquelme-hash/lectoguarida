import test from 'node:test';
import assert from 'node:assert/strict';
import { getWeakestSkill, selectNextMission, missionTemplates } from '../shared/missionEngine.mjs';

test('getWeakestSkill - elige habilidad más baja', () => {
  const mastery = { decoding: 20, fluency: 80, accuracy: 50, vocabulary: 50, literal_comprehension: 50, inferential_comprehension: 50, sequence: 50, prosody: 50, attention: 50 };
  assert.equal(getWeakestSkill(mastery), 'decoding');
});

test('selectNextMission - evita repetir missionType', () => {
  const student = {
    missionEngineEnabled: true,
    mastery: { decoding: 50, fluency: 50, accuracy: 50, vocabulary: 50, literal_comprehension: 50, inferential_comprehension: 50, sequence: 50, prosody: 50, attention: 50 },
    recentMissionTypes: ['karaoke_reading']
  };
  const mission = selectNextMission(student, missionTemplates);
  // Debería evitar karaoke_reading si hay otras opciones
  assert.notEqual(mission.type, 'karaoke_reading');
});

test('selectNextMission - devuelve fallback si no hay datos', () => {
  const student = { missionEngineEnabled: false };
  const mission = selectNextMission(student, missionTemplates);
  assert.equal(mission.id, 'classic-fallback');
});

test('selectNextMission - funciona con estudiante antiguo', () => {
  const student = {
    // mastery no existe, debería normalizarse a 50
    missionEngineEnabled: true
  };
  const mission = selectNextMission(student, missionTemplates);
  assert.ok(mission.id);
});

test('getWeakestSkill - nunca lanza error con mastery incompleto', () => {
  assert.doesNotThrow(() => getWeakestSkill({}));
  assert.equal(getWeakestSkill({}), 'decoding');
});