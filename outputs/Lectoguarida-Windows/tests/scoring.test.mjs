import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWords, lcsMatches, scoreAttempt, readings, SKIN_CATALOG, STICKER_CATALOG, awardCurriculumSkill } from '../server.mjs';
import { adventureZones, readingRoutes, miniGameCatalog, zoneForReading } from '../public/adventure-data.js';

test('normaliza acentos y puntuación', () => {
  assert.deepEqual(normalizeWords('Rita, encontró la LLAVE.'), ['rita', 'encontro', 'la', 'llave']);
});

test('alinea palabras conservando el orden', () => {
  const match = lcsMatches(['la', 'rana', 'salta'], ['la', 'rana', 'muy', 'alto']);
  assert.equal(match.count, 2);
});

test('lectura exacta y comprensión correcta obtiene puntaje alto', () => {
  const reading = readings[0];
  const scores = scoreAttempt({ reading, transcript: reading.text, elapsedSeconds: 28, warmupAnswer: reading.warmup.correct, comprehensionAnswer: reading.comprehension.correct });
  assert.equal(scores.accuracy, 100);
  assert.equal(scores.warmup, 100);
  assert.equal(scores.comprehension, 100);
  assert.ok(scores.coins >= 5);
  assert.ok(scores.overall >= 90);
});

test('incluye campaña completa y profundización curricular transversal', () => {
  assert.equal(readings.filter((item) => item.grade === 1).length, 15);
  assert.equal(readings.filter((item) => item.grade === 2).length, 105);
  assert.equal(readings.filter((item) => item.grade === 2).length * 3, 315);
  assert.equal(new Set(readings.filter((item) => item.grade === 2 && item.stage === 'Letras').map((item) => item.focusSymbol)).size, 27);
  assert.equal(readings.filter((item) => item.grade === 2 && item.stage === 'Doble consonante').length, 15);
  assert.equal(readings.filter((item) => item.grade === 2 && item.stage === 'Lenguaje y creación').length, 24);
  assert.equal(readings.filter((item) => item.grade === 2 && item.stage === 'Ciencia y ambiente').length, 8);
  assert.equal(readings.filter((item) => item.grade === 2 && item.stage === 'Chile y ciudadanía').length, 8);
  assert.equal(readings.filter((item) => item.grade === 2 && item.stage === 'Interculturalidad').length, 8);
  assert.ok(readings.some((item) => item.warmup.mode === 'write'));
  assert.ok(readings.some((item) => item.warmup.mode === 'tap'));
  assert.ok(readings.some((item) => item.warmup.mode === 'build'));
  assert.ok(readings.every((item) => item.warmup && item.text && item.comprehension));
  assert.ok(readings.every((item) => item.curriculum?.fluencyOA && item.curriculum?.transversal?.category));
});

test('incluye colecciones extensas de skins y stickers', () => {
  assert.equal(Object.values(SKIN_CATALOG).reduce((total, values) => total + values.length, 0), 90);
  assert.equal(STICKER_CATALOG.length, 72);
  assert.equal(new Set(STICKER_CATALOG.map((item) => item.set)).size, 7);
  assert.ok(STICKER_CATALOG.some((item) => item.rarity === 'legendary'));
});

test('cada misión desbloquea y fortalece una habilidad curricular', () => {
  const student = { skillProgress:{} };
  const reading = readings.find((item) => item.grade === 2);
  const first = awardCurriculumSkill(student, reading, { warmup:100, comprehension:100, overall:90 });
  assert.equal(first.newlyUnlocked, true);
  assert.equal(first.points, 3);
  assert.equal(first.oa, reading.curriculum.supportOA);
  const second = awardCurriculumSkill(student, reading, { warmup:100, comprehension:100, overall:94 });
  assert.equal(second.level, 2);
  assert.equal(second.points, 6);
});

test('organiza la aventura en diez portales, dos rutas y cinco minijuegos', () => {
  assert.equal(adventureZones.length, 10);
  assert.equal(readingRoutes.length, 2);
  assert.equal(miniGameCatalog.length, 5);
  const assigned = readings.filter((item) => item.grade === 2).map((item, index) => zoneForReading(item, index));
  assert.ok(assigned.every((zoneId) => adventureZones.some((zone) => zone.id === zoneId)));
});
