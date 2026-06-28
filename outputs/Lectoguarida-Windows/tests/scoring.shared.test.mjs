import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWords, lcsMatches, scoreAttempt, answersMatch } from '../shared/scoring.mjs';

test('normalizeWords - lowercases and removes accents', () => {
  assert.deepEqual(normalizeWords('HOLA MUNDO'), ['hola', 'mundo']);
  assert.deepEqual(normalizeWords('Niño'), ['nino']);
  assert.deepEqual(normalizeWords('PINGÜINO'), ['pinguino']);
});

test('normalizeWords - removes punctuation', () => {
  assert.deepEqual(normalizeWords('Hola, mundo!'), ['hola', 'mundo']);
  assert.deepEqual(normalizeWords('¿Cómo estás?'), ['como', 'estas']);
});

test('normalizeWords - collapses whitespace', () => {
  assert.deepEqual(normalizeWords('hola   mundo'), ['hola', 'mundo']);
});

test('answersMatch - matches case-insensitive', () => {
  assert.equal(answersMatch('HOLA', 'hola'), true);
  assert.equal(answersMatch('  hola  ', 'hola'), true);
});

test('answersMatch - ignores accents', () => {
  assert.equal(answersMatch('niño', 'nino'), true);
});

test('answersMatch - ignores punctuation', () => {
  assert.equal(answersMatch('hola!', 'hola'), true);
});

test('answersMatch - returns false for different words', () => {
  assert.equal(answersMatch('hola', 'adios'), false);
});

test('lcsMatches - returns full match for identical arrays', () => {
  const r = lcsMatches(['hola', 'mundo'], ['hola', 'mundo']);
  assert.equal(r.count, 2);
  assert.deepEqual([...r.matchedTarget].sort(), [0, 1]);
});

test('lcsMatches - returns partial match', () => {
  const r = lcsMatches(['hola', 'mundo', 'bonito'], ['hola', 'bonito']);
  assert.equal(r.count, 2);
  assert.deepEqual([...r.matchedTarget].sort(), [0, 2]);
});

test('lcsMatches - returns zero for no match', () => {
  const r = lcsMatches(['hola', 'mundo'], ['adios', 'amigos']);
  assert.equal(r.count, 0);
});

test('scoreAttempt - scores 100 for perfect reading', () => {
  const mockReading = {
    id: 'test-reading',
    grade: 2,
    text: 'el gato grande come pescado fresco todos los dias',
    warmup: { correct: 'gato' },
    comprehension: { correct: 'pescado' }
  };
  const result = scoreAttempt({
    reading: mockReading,
    transcript: 'el gato grande come pescado fresco todos los dias',
    elapsedSeconds: 10,
    warmupAnswer: 'gato',
    comprehensionAnswer: 'pescado'
  });
  assert.equal(result.accuracy, 100);
  assert.equal(result.warmup, 100);
  assert.equal(result.comprehension, 100);
  assert.equal(result.overall, 100);
  assert.equal(result.xp, 45);
  assert.equal(result.coins, 15);
  assert.equal(result.message, '¡Lectoguarida recuperó toda su luz!');
});

test('scoreAttempt - scores lower for wrong transcript', () => {
  const mockReading = {
    id: 'test-reading',
    grade: 2,
    text: 'el gato come pescado',
    warmup: { correct: 'gato' },
    comprehension: { correct: 'pescado' }
  };
  const result = scoreAttempt({
    reading: mockReading,
    transcript: 'el perro come huesos',
    elapsedSeconds: 10,
    warmupAnswer: 'gato',
    comprehensionAnswer: 'pescado'
  });
  assert(result.accuracy < 100);
  assert.equal(result.warmup, 100);
  assert.equal(result.comprehension, 100);
});

test('scoreAttempt - scores 0 warmup for wrong answer', () => {
  const mockReading = {
    id: 'test-reading',
    grade: 2,
    text: 'el gato come pescado',
    warmup: { correct: 'gato' },
    comprehension: { correct: 'pescado' }
  };
  const result = scoreAttempt({
    reading: mockReading,
    transcript: 'el gato come pescado',
    elapsedSeconds: 10,
    warmupAnswer: 'perro',
    comprehensionAnswer: 'pescado'
  });
  assert.equal(result.warmup, 0);
  assert.equal(result.comprehension, 100);
});

test('scoreAttempt - detects focus areas', () => {
  const mockReading = {
    id: 'test-reading',
    grade: 2,
    text: 'el gato come pescado',
    warmup: { correct: 'gato' },
    comprehension: { correct: 'pescado' }
  };
  const result = scoreAttempt({
    reading: mockReading,
    transcript: 'el gato come pescado',
    elapsedSeconds: 60,
    warmupAnswer: 'gato',
    comprehensionAnswer: 'pescado'
  });
  assert(result.focus.includes('Continuidad lectora'));
});

test('scoreAttempt - detects Sonido R focus', () => {
  const readingWithR = {
    id: 'test-reading-r',
    grade: 2,
    text: 'el perro corre rapido',
    warmup: { correct: 'perro' },
    comprehension: { correct: 'rapido' }
  };
  const result = scoreAttempt({
    reading: readingWithR,
    transcript: 'el perro come rapido',
    elapsedSeconds: 10,
    warmupAnswer: 'perro',
    comprehensionAnswer: 'rapido'
  });
  assert(result.focus.includes('Sonido R'));
});