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

test('getDefaultMastery returns all skills at 50', () => {
  const mastery = getDefaultMastery();
  assert.equal(typeof mastery, 'object');
  assert.equal(mastery.decoding, 50);
  assert.equal(mastery.fluency, 50);
  assert.equal(mastery.accuracy, 50);
  assert.equal(mastery.vocabulary, 50);
  assert.equal(mastery.literal_comprehension, 50);
  assert.equal(mastery.inferential_comprehension, 50);
  assert.equal(mastery.sequence, 50);
  assert.equal(mastery.prosody, 50);
  assert.equal(mastery.attention, 50);
  assert.equal(Object.keys(mastery).length, 9);
});

test('ensureMissionFieldsForStudent adds missing fields to old student', () => {
  const oldStudent = {
    id: 'student-test',
    name: 'Test Student',
    grade: 2,
    avatar: '🫧',
    skin: { archetype: 'axolotl', palette: 'coral', outfit: 'explorer', accessory: 'star-glasses', companion: 'firefly' },
    xp: 100,
    coins: 50,
    unlocked: ['archetype:axolotl', 'palette:coral'],
    streak: 5,
    longestStreak: 10,
    lastActiveDate: '2026-06-01',
    stickers: { 'happy-book': 2 },
    packsOpened: 3,
    packsSinceRare: 1,
    pinSalt: 'salt',
    pinHash: 'hash',
    exchangeStars: 0,
    refuge: { library: 1, garden: 0, observatory: 0, musicRoom: 0 },
    lastDailyRewardDate: '2026-06-01',
    skillProgress: {},
    createdAt: '2026-06-01T00:00:00.000Z'
  };
  
  ensureMissionFieldsForStudent(oldStudent);
  
  assert.deepEqual(oldStudent.mastery, getDefaultMastery());
  assert.deepEqual(oldStudent.unlockedZones, ['starter']);
  assert.deepEqual(oldStudent.completedMissionIds, []);
  assert.deepEqual(oldStudent.recentMissionTypes, []);
  assert.equal(oldStudent.missionEngineEnabled, false);
  assert.equal(oldStudent.progressionVersion, 1);
  // Original fields preserved
  assert.equal(oldStudent.id, 'student-test');
  assert.equal(oldStudent.xp, 100);
  assert.equal(oldStudent.coins, 50);
});

test('ensureMissionFieldsForStudent preserves existing mastery and fields', () => {
  const studentWithExisting = {
    id: 'student-test',
    name: 'Test Student',
    grade: 2,
    avatar: '🫧',
    skin: { archetype: 'axolotl', palette: 'coral', outfit: 'explorer', accessory: 'star-glasses', companion: 'firefly' },
    xp: 100,
    coins: 50,
    unlocked: ['archetype:axolotl', 'palette:coral'],
    streak: 5,
    longestStreak: 10,
    lastActiveDate: '2026-06-01',
    stickers: { 'happy-book': 2 },
    packsOpened: 3,
    packsSinceRare: 1,
    pinSalt: 'salt',
    pinHash: 'hash',
    exchangeStars: 0,
    refuge: { library: 1, garden: 0, observatory: 0, musicRoom: 0 },
    lastDailyRewardDate: '2026-06-01',
    skillProgress: {},
    createdAt: '2026-06-01T00:00:00.000Z',
    mastery: { decoding: 80, fluency: 70, accuracy: 60, vocabulary: 55, literal_comprehension: 50, inferential_comprehension: 45, sequence: 40, prosody: 35, attention: 30 },
    unlockedZones: ['starter', 'zone1', 'zone2'],
    completedMissionIds: ['mission-1', 'mission-2'],
    recentMissionTypes: ['reading', 'fluency'],
    missionEngineEnabled: true,
    progressionVersion: 2
  };
  
  ensureMissionFieldsForStudent(studentWithExisting);
  
  // Existing values preserved
  assert.equal(studentWithExisting.mastery.decoding, 80);
  assert.equal(studentWithExisting.mastery.fluency, 70);
  assert.deepEqual(studentWithExisting.unlockedZones, ['starter', 'zone1', 'zone2']);
  assert.deepEqual(studentWithExisting.completedMissionIds, ['mission-1', 'mission-2']);
  assert.deepEqual(studentWithExisting.recentMissionTypes, ['reading', 'fluency']);
  assert.equal(studentWithExisting.missionEngineEnabled, true);
  assert.equal(studentWithExisting.progressionVersion, 2);
});

test('ensureMissionFieldsForAttempt adds missing fields to old attempt', () => {
  const oldAttempt = {
    id: 'attempt-1',
    studentId: 'student-test',
    readingId: 'g2-test',
    readingTitle: 'Test Reading',
    transcript: 'test transcript',
    elapsedSeconds: 30,
    warmupAnswer: 'answer',
    comprehensionAnswer: 'answer',
    scores: { accuracy: 90, wpm: 50, warmup: 100, comprehension: 100, overall: 95, correctWords: 10, totalWords: 10, focus: ['Sonido R'], xp: 30, coins: 10, message: 'Great!' },
    createdAt: '2026-06-01T00:00:00.000Z'
  };
  
  ensureMissionFieldsForAttempt(oldAttempt);
  
  assert.equal(oldAttempt.missionId, null);
  assert.equal(oldAttempt.missionType, null);
  assert.deepEqual(oldAttempt.focusAreas, []);
  assert.deepEqual(oldAttempt.assistanceUsed, {});
  assert.deepEqual(oldAttempt.readingErrors, {});
  assert.equal(oldAttempt.progressionSnapshot, null);
  // Original scores preserved
  assert.equal(oldAttempt.scores.accuracy, 90);
  assert.equal(oldAttempt.scores.overall, 95);
});

test('ensureMissionFieldsForAttempt preserves existing fields', () => {
  const attemptWithFields = {
    id: 'attempt-2',
    studentId: 'student-test',
    readingId: 'g2-test',
    readingTitle: 'Test Reading',
    transcript: 'test transcript',
    elapsedSeconds: 30,
    warmupAnswer: 'answer',
    comprehensionAnswer: 'answer',
    scores: { accuracy: 90, wpm: 50, warmup: 100, comprehension: 100, overall: 95, correctWords: 10, totalWords: 10, focus: ['Sonido R'], xp: 30, coins: 10, message: 'Great!' },
    createdAt: '2026-06-01T00:00:00.000Z',
    missionId: 'mission-5',
    missionType: 'fluency',
    focusAreas: ['decoding', 'fluency'],
    assistanceUsed: { hint: 2 },
    readingErrors: { 'word1': 1, 'word2': 2 },
    progressionSnapshot: { mastery: { decoding: 60 } }
  };
  
  ensureMissionFieldsForAttempt(attemptWithFields);
  
  assert.equal(attemptWithFields.missionId, 'mission-5');
  assert.equal(attemptWithFields.missionType, 'fluency');
  assert.deepEqual(attemptWithFields.focusAreas, ['decoding', 'fluency']);
  assert.deepEqual(attemptWithFields.assistanceUsed, { hint: 2 });
  assert.deepEqual(attemptWithFields.readingErrors, { 'word1': 1, 'word2': 2 });
  assert.deepEqual(attemptWithFields.progressionSnapshot, { mastery: { decoding: 60 } });
});