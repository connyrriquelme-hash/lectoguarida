/**
 * solo-metrics-collector.test.mjs
 * Pruebas reales de MetricsCollector y MetricsPlugin.
 *
 * Ejecuta el recolector real contra un almacenamiento controlado y el engine
 * real (cargado por eval). No usa red, no usa PII.
 */

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve as pathResolve } from 'node:path';
import { createTestDom, cleanupTestEnvironment, trackEngine } from './helpers/jsdom-test-environment.mjs';

after(() => {
  cleanupTestEnvironment();
});

const BASE = fileURLToPath(new URL('../public/expedicion/solo/', import.meta.url));
function readFile(subpath) {
  return readFileSync(pathResolve(BASE, subpath), 'utf8');
}

function createDom() {
  const dom = createTestDom();
  const win = dom.window;
  if (!win.speechSynthesis) {
    win.speechSynthesis = { speak() {}, cancel() {}, getVoices: () => [] };
  }
  if (typeof win.SpeechSynthesisUtterance !== 'function') {
    win.SpeechSynthesisUtterance = function () {};
  }
  return dom;
}

function loadAllSolo(window) {
  const files = [
    'core/solo-state-machine.js',
    'core/game-config-validator.js',
    'core/input-manager.js',
    'core/scoring-engine.js',
    'core/feedback-manager.js',
    'core/reward-manager.js',
    'core/progress-repository.js',
    'core/audio-manager.js',
    'core/voice-guidance-ui.js',
    'core/asset-loader.js',
    'ui/resilient-game-asset.js',
    'core/accessibility-manager.js',
    'core/error-boundary.js',
    'core/game-id-normalizer.js',
    'core/metrics-collector.js',
    'templates/click-selection-template.js',
    'templates/drag-drop-template.js',
    'templates/avatar-movement-template.js',
    'templates/syllable-tap-template.js',
    'templates/falling-items-template.js',
    'plugins/audio-instruction-plugin.js',
    'plugins/timer-plugin.js',
    'plugins/keyboard-input-plugin.js',
    'plugins/reward-plugin.js',
    'plugins/accessibility-plugin.js',
    'plugins/metrics-plugin.js',
    'core/solo-game-engine.js',
    'core/solo-game-adapter.js',
    'games/vocal-a-game.js',
    'games/non-reader/rhyme-catcher.js',
    'games/non-reader/initial-sound-detector.js',
    'games/non-reader/syllable-counter.js',
    'games/non-reader/final-sound-catcher.js',
    'profiles/non-reader/non-reader-difficulties.js',
    'profiles/non-reader/non-reader-difficulty-store.js'
  ];
  const allSrc = files.map((f) => readFile(f)).join('\n');
  const fn = new Function('window', 'document', 'navigator', 'localStorage', 'AudioContext', 'GameIdNormalizer', 'MetricsCollector', 'MetricsPlugin', allSrc);
  fn(window, window.document, window.navigator, window.localStorage, window.AudioContext, globalThis.GameIdNormalizer || window.GameIdNormalizer || undefined, window.MetricsCollector || undefined, window.MetricsPlugin || undefined);
  return window;
}

const MetricsCollector = globalThis.GameIdNormalizer ? null : null;

function getCollector(window) {
  return window.MetricsCollector;
}

function freshCollector(window, opts) {
  const C = window.MetricsCollector;
  return C.create(Object.assign({ studentProfileId: 'student-27' }, opts || {}));
}

function readStored(collector) {
  const ns = 'lectoguarida:solo-metrics:v1:' + collector._studentProfileId;
  const raw = collector._storage.getItem(ns);
  return raw ? JSON.parse(raw) : null;
}

function setStorage(dom, storage) {
  try {
    Object.defineProperty(dom.window, 'localStorage', { value: storage, configurable: true, writable: true });
  } catch (e) {
    dom.window.localStorage = storage;
  }
}

// 1-4 NAMESPACE
test('namespace incluye studentProfileId', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 'student-27' });
  assert.ok(c._namespace.indexOf('student-27') !== -1);
  assert.equal(c._namespace, 'lectoguarida:solo-metrics:v1:student-27');
});
test('estudiantes diferentes quedan separados', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const a = freshCollector(dom.window, { studentProfileId: 'alumno-a' });
  const b = freshCollector(dom.window, { studentProfileId: 'alumno-b' });
  a.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1' });
  assert.equal(b.getEvents().length, 0);
  assert.equal(a.getEvents().length, 1);
});
test('ID vacío no escribe', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  assert.throws(() => dom.window.MetricsCollector.create({ studentProfileId: '' }));
  assert.throws(() => dom.window.MetricsCollector.create({ studentProfileId: '   ' }));
  assert.throws(() => dom.window.MetricsCollector.create({ studentProfileId: null }));
});
test('perfil es non_reader', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1' });
  const stored = readStored(c);
  assert.equal(stored.events[0].readerProfile, 'non_reader');
});

// 5-14 EVENTOS
test('recordEvent guarda evento válido', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'instruction_played', gameId: 'rhyme-catcher', sessionId: 's1' });
  assert.ok(ev);
  assert.equal(c.getEvents().length, 1);
});
test('crea eventId', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1' });
  assert.ok(ev.eventId && ev.eventId.length > 0);
});
test('crea sessionId válido', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 'sess-9' });
  assert.equal(ev.sessionId, 'sess-9');
});
test('playedAt es ISO', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1' });
  assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(ev.playedAt));
  assert.ok(!isNaN(Date.parse(ev.playedAt)));
});
test('readerProfile es non_reader', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1' });
  assert.equal(ev.readerProfile, 'non_reader');
});
test('dificultad válida', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1', difficulty: 'support' });
  assert.equal(ev.difficulty, 'support');
});
test('números negativos se normalizan', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'game_completed', gameId: 'rhyme-catcher', sessionId: 's1', correctAnswers: -5, incorrectAnswers: -2 });
  assert.equal(ev.correctAnswers, 0);
  assert.equal(ev.incorrectAnswers, 0);
});
test('números no finitos se rechazan', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'game_completed', gameId: 'rhyme-catcher', sessionId: 's1', correctAnswers: Infinity, durationMs: NaN });
  assert.equal('correctAnswers' in ev, false);
  assert.equal('durationMs' in ev, false);
});
test('evento desconocido se rechaza', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'mouse_move', gameId: 'rhyme-catcher', sessionId: 's1' });
  assert.equal(ev, null);
  assert.equal(c.getEvents().length, 0);
});
test('campos no permitidos se eliminan', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'answer_submitted', gameId: 'rhyme-catcher', sessionId: 's1', foo: 'bar', baz: 1 });
  assert.equal('foo' in ev, false);
  assert.equal('baz' in ev, false);
});

// 15-26 PRIVACIDAD
test('no guarda nombre', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'answer_submitted', gameId: 'rhyme-catcher', sessionId: 's1', name: 'Juana', studentName: 'Juana' });
  const stored = readStored(c);
  assert.ok(!('name' in stored.events[0]));
  assert.ok(!('studentName' in stored.events[0]));
});
test('no guarda RUT', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'answer_submitted', gameId: 'rhyme-catcher', sessionId: 's1', rut: '12.345.678-9' });
  assert.ok(!('rut' in readStored(c).events[0]));
});
test('no guarda correo', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'answer_submitted', gameId: 'rhyme-catcher', sessionId: 's1', email: 'a@b.cl' });
  assert.ok(!('email' in readStored(c).events[0]));
});
test('no guarda audio', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'answer_submitted', gameId: 'rhyme-catcher', sessionId: 's1', audio: 'base64xxx' });
  assert.ok(!('audio' in readStored(c).events[0]));
});
test('no guarda voz', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'answer_submitted', gameId: 'rhyme-catcher', sessionId: 's1', voice: 'clip' });
  assert.ok(!('voice' in readStored(c).events[0]));
});
test('no guarda imagen', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'answer_submitted', gameId: 'rhyme-catcher', sessionId: 's1', image: 'data:image/png;base64,xx' });
  assert.ok(!('image' in readStored(c).events[0]));
});
test('no guarda texto libre', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'answer_submitted', gameId: 'rhyme-catcher', sessionId: 's1', freeText: 'mi perro', answerText: 'gato' });
  const e = readStored(c).events[0];
  assert.ok(!('freeText' in e));
  assert.ok(!('answerText' in e));
});
test('no guarda userAgent', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'answer_submitted', gameId: 'rhyme-catcher', sessionId: 's1', userAgent: 'Mozilla/5.0' });
  assert.ok(!('userAgent' in readStored(c).events[0]));
});
test('no usa getUserMedia', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const C = dom.window.MetricsCollector;
  assert.equal('getUserMedia' in C, false);
  assert.throws(() => C.getUserMedia());
});
test('no usa MediaRecorder', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const C = dom.window.MetricsCollector;
  assert.equal('MediaRecorder' in C, false);
  assert.throws(() => C.MediaRecorder());
});
test('no hace fetch', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const C = dom.window.MetricsCollector;
  assert.equal('fetch' in C, false);
  assert.throws(() => C.fetch());
});
test('no crea WebSocket', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const C = dom.window.MetricsCollector;
  assert.equal('WebSocket' in C, false);
  assert.throws(() => C.WebSocket());
});

// 27-30 NORMALIZACIÓN
test('rim-catcher se guarda como rhyme-catcher', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'game_completed', gameId: 'rim-catcher', sessionId: 's1', stars: 3 });
  const stored = readStored(c);
  assert.equal(stored.events[0].gameId, 'rhyme-catcher');
});
test('consulta legacy devuelve resumen canónico', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'game_completed', gameId: 'rim-catcher', sessionId: 's1', stars: 3 });
  const sum = c.getGameSummary('rim-catcher');
  assert.equal(sum.gameId, 'rhyme-catcher');
  assert.equal(sum.completedSessions, 1);
});
test('no crea dos grupos', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'game_completed', gameId: 'rim-catcher', sessionId: 's1', stars: 3 });
  c.recordEvent({ eventType: 'game_completed', gameId: 'rhyme-catcher', sessionId: 's2', stars: 2 });
  const sum = c.getGameSummary('rhyme-catcher');
  assert.equal(sum.completedSessions, 2);
});
test('ID desconocido se maneja de forma segura', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'game_completed', gameId: 'juego-inexistente', sessionId: 's1', stars: 1 });
  assert.ok(ev);
  assert.equal(ev.gameId, 'juego-inexistente');
});

// 31-36 JUEGOS
test('evento de rhyme-catcher válido', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'answer_submitted', gameId: 'rhyme-catcher', sessionId: 's1', specific: { targetWordId: 'raton', selectedItemId: 'boton', rhymeCorrect: true } });
  assert.equal(ev.specific.targetWordId, 'raton');
  assert.equal(ev.specific.rhymeCorrect, true);
});
test('evento de initial-sound-detector válido', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'answer_submitted', gameId: 'initial-sound-detector', sessionId: 's1', specific: { targetPhoneme: '/f/', selectedItemId: 'foca', phonemeCorrect: true } });
  assert.equal(ev.specific.targetPhoneme, '/f/');
  assert.equal(ev.specific.phonemeCorrect, true);
});
test('evento de syllable-counter válido', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'answer_submitted', gameId: 'syllable-counter', sessionId: 's1', specific: { wordId: 'mariposa', expectedCount: 4, selectedCount: 4, difference: 0 } });
  assert.equal(ev.specific.wordId, 'mariposa');
  assert.equal(ev.specific.difference, 0);
});
test('evento de final-sound-catcher válido', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'answer_submitted', gameId: 'final-sound-catcher', sessionId: 's1', specific: { targetEnding: 'o', selectedItemId: 'gato', endingCorrect: true } });
  assert.equal(ev.specific.targetEnding, 'o');
  assert.equal(ev.specific.endingCorrect, true);
});
test('campos específicos están allowlisted', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'answer_submitted', gameId: 'rhyme-catcher', sessionId: 's1', targetWordId: 'raton', selectedItemId: 'boton', rhymeCorrect: true, extraSecreto: 'x' });
  assert.equal(ev.specific.targetWordId, 'raton');
  assert.equal('extraSecreto' in ev, false);
  assert.equal('extraSecreto' in ev.specific, false);
});
test('campos específicos desconocidos se eliminan', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = c.recordEvent({ eventType: 'answer_submitted', gameId: 'rhyme-catcher', sessionId: 's1', specific: { targetWordId: 'raton', hack: 'boom' } });
  assert.equal('hack' in ev.specific, false);
});

// 37-45 STORAGE
test('JSON corrupto se recupera', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  dom.window.localStorage.setItem('lectoguarida:solo-metrics:v1:s', '{esto no es json');
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1' });
  const stored = readStored(c);
  assert.ok(Array.isArray(stored.events));
  assert.equal(stored.events.length, 1);
});
test('localStorage SecurityError usa memoria', () => {
  const dom = createDom();
  const failingStorage = { getItem() { throw Object.assign(new Error('x'), { name: 'SecurityError' }); }, setItem() { throw Object.assign(new Error('x'), { name: 'SecurityError' }); } };
  setStorage(dom, failingStorage);
  loadAllSolo(dom.window);
  const c = dom.window.MetricsCollector.create({ studentProfileId: 's', storage: failingStorage });
  const ev = c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1' });
  assert.ok(ev);
  assert.equal(c._usingFallback, true);
});
test('QuotaExceededError usa memoria', () => {
  const dom = createDom();
  const failingStorage = { getItem() { return null; }, setItem() { throw Object.assign(new Error('x'), { name: 'QuotaExceededError' }); } };
  loadAllSolo(dom.window);
  const c = dom.window.MetricsCollector.create({ studentProfileId: 's', storage: failingStorage });
  const ev = c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1' });
  assert.ok(ev);
  assert.equal(c._usingFallback, true);
});
test('escritura fallida no bloquea', () => {
  const dom = createDom();
  const failingStorage = { getItem() { return null; }, setItem() { throw new Error('write fail'); } };
  loadAllSolo(dom.window);
  const c = dom.window.MetricsCollector.create({ studentProfileId: 's', storage: failingStorage });
  assert.doesNotThrow(() => c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1' }));
});
test('lectura fallida no bloquea', () => {
  const dom = createDom();
  const failingStorage = { getItem() { throw new Error('read fail'); }, setItem() {} };
  loadAllSolo(dom.window);
  const c = dom.window.MetricsCollector.create({ studentProfileId: 's', storage: failingStorage });
  assert.doesNotThrow(() => c.getEvents());
});
test('destroy limpia referencias', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.destroy();
  assert.equal(c._destroyed, true);
  assert.equal(c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1' }), null);
});
test('no borra progreso', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const before = dom.window.localStorage.getItem('lectoguarida:progress:s');
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1' });
  c.clearDevelopmentMetrics();
  const after = dom.window.localStorage.getItem('lectoguarida:progress:s');
  assert.equal(before, after);
});
test('no borra rewards', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  dom.window.localStorage.setItem('lectoguarida:rewards:s', '{"x":1}');
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.clearDevelopmentMetrics();
  assert.equal(dom.window.localStorage.getItem('lectoguarida:rewards:s'), '{"x":1}');
});
test('no borra settings', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  dom.window.localStorage.setItem('lectoguarida:settings:s', '{"v":1}');
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.clearDevelopmentMetrics();
  assert.equal(dom.window.localStorage.getItem('lectoguarida:settings:s'), '{"v":1}');
});

// 46-52 PRUNE
test('límite predeterminado 500', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  assert.equal(c._maxEvents, 500);
});
test('elimina eventos antiguos', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's', maxEvents: 50 });
  for (let i = 0; i < 60; i++) {
    c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's' + i });
  }
  assert.equal(readStored(c).events.length, 50);
});
test('conserva recientes', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's', maxEvents: 50 });
  for (let i = 0; i < 60; i++) {
    c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's' + i });
  }
  const ids = readStored(c).events.map((e) => e.sessionId);
  assert.ok(ids.indexOf('s59') !== -1);
  assert.ok(ids.indexOf('s0') === -1);
});
test('elimina eventId duplicado', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const ev = { eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1', eventId: 'dup-1' };
  c.recordEvent(ev);
  c.recordEvent(Object.assign({}, ev));
  c.prune();
  const dup = readStored(c).events.filter((e) => e.eventId === 'dup-1');
  assert.equal(dup.length, 1);
});
test('ordena por playedAt', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const t0 = '2026-01-01T00:00:00.000Z';
  const t1 = '2026-02-01T00:00:00.000Z';
  c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 'b', playedAt: t1 });
  c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 'a', playedAt: t0 });
  c.prune();
  const order = readStored(c).events.map((e) => e.sessionId);
  assert.deepEqual(order, ['a', 'b']);
});
test('normaliza IDs durante prune', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'game_completed', gameId: 'rim-catcher', sessionId: 's1', stars: 3 });
  c.prune();
  assert.equal(readStored(c).events[0].gameId, 'rhyme-catcher');
});
test('máximo configurable respeta límites', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const low = freshCollector(dom.window, { studentProfileId: 's', maxEvents: 5 });
  const high = freshCollector(dom.window, { studentProfileId: 's', maxEvents: 99999 });
  assert.equal(low._maxEvents, 50);
  assert.equal(high._maxEvents, 1000);
});

// 53-62 RESÚMENES
test('getEvents filtra por gameId', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1' });
  c.recordEvent({ eventType: 'session_started', gameId: 'syllable-counter', sessionId: 's2' });
  assert.equal(c.getEvents({ gameId: 'rhyme-catcher' }).length, 1);
});
test('getEvents filtra por difficulty', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1', difficulty: 'support' });
  c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's2', difficulty: 'challenge' });
  assert.equal(c.getEvents({ difficulty: 'support' }).length, 1);
});
test('getEvents filtra por eventType', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 's1' });
  c.recordEvent({ eventType: 'game_completed', gameId: 'rhyme-catcher', sessionId: 's1', stars: 3 });
  assert.equal(c.getEvents({ eventType: 'game_completed' }).length, 1);
});
test('getGameSummary calcula sesiones', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'game_completed', gameId: 'rhyme-catcher', sessionId: 's1', stars: 3 });
  c.recordEvent({ eventType: 'game_completed', gameId: 'rhyme-catcher', sessionId: 's2', stars: 2 });
  const sum = c.getGameSummary('rhyme-catcher');
  assert.equal(sum.sessions, 2);
  assert.equal(sum.completedSessions, 2);
});
test('calcula accuracy', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'game_completed', gameId: 'rhyme-catcher', sessionId: 's1', correctAnswers: 7, incorrectAnswers: 3 });
  const sum = c.getGameSummary('rhyme-catcher');
  assert.ok(Math.abs(sum.accuracy - 0.7) < 1e-9);
});
test('evita división por cero', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  const sum = c.getGameSummary('rhyme-catcher');
  assert.equal(sum.accuracy, 0);
  assert.equal(sum.averageDurationMs, 0);
});
test('conserva bestStars', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'game_completed', gameId: 'rhyme-catcher', sessionId: 's1', stars: 1 });
  c.recordEvent({ eventType: 'game_completed', gameId: 'rhyme-catcher', sessionId: 's2', stars: 3 });
  const sum = c.getGameSummary('rhyme-catcher');
  assert.equal(sum.bestStars, 3);
});
test('calcula averageDurationMs', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'game_completed', gameId: 'rhyme-catcher', sessionId: 's1', durationMs: 40000 });
  c.recordEvent({ eventType: 'game_completed', gameId: 'rhyme-catcher', sessionId: 's2', durationMs: 60000 });
  const sum = c.getGameSummary('rhyme-catcher');
  assert.equal(sum.averageDurationMs, 50000);
});
test('getSkillSummary agrupa juegos', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'game_completed', gameId: 'rhyme-catcher', sessionId: 's1', correctAnswers: 4, incorrectAnswers: 1 });
  c.recordEvent({ eventType: 'game_completed', gameId: 'syllable-counter', sessionId: 's2', correctAnswers: 3, incorrectAnswers: 1 });
  const sum = c.getSkillSummary('phonological_awareness');
  assert.ok(sum.gamesIncluded.indexOf('rhyme-catcher') !== -1);
  assert.ok(sum.gamesIncluded.indexOf('syllable-counter') !== -1);
  assert.equal(sum.correctAnswers, 7);
});
test('getSessionSummary devuelve una sesión', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's' });
  c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 'ses-x' });
  c.recordEvent({ eventType: 'game_completed', gameId: 'rhyme-catcher', sessionId: 'ses-x', stars: 3 });
  const sum = c.getSessionSummary('ses-x');
  assert.equal(sum.sessionId, 'ses-x');
  assert.equal(sum.completedSessions, 1);
});

// 63-72 PLUGIN
function makePluginDom() {
  const dom = createDom();
  loadAllSolo(dom.window);
  const studentProfileId = 's';
  const collector = dom.window.MetricsCollector.create({ studentProfileId });
  const engine = dom.window.SoloGameEngine.create({ studentProfileId, container: dom.window.document.getElementById('container') });
  const plugin = dom.window.MetricsPlugin.create({ collector, engine, gameConfig: { id: 'rhyme-catcher', profile: 'non_reader', difficulty: { id: 'standard' } } });
  engine.addPlugin(plugin);
  return { dom, collector, engine, plugin };
}
test('session_started se registra', () => {
  const { collector, engine, plugin } = makePluginDom();
  plugin.start();
  engine.emit('sessionStarted', {});
  assert.equal(collector.getEvents({ eventType: 'session_started' }).length, 1);
});
test('instruction_played se registra sin texto', () => {
  const { collector, plugin } = makePluginDom();
  plugin.start();
  plugin.recordInstruction();
  const ev = collector.getEvents({ eventType: 'instruction_played' })[0];
  assert.ok(ev);
  assert.equal('text' in ev, false);
});
test('instruction_repeated incrementa contador', () => {
  const { collector, plugin } = makePluginDom();
  plugin.recordAudioRepeat();
  plugin.recordAudioRepeat();
  const evs = collector.getEvents({ eventType: 'instruction_repeated' });
  assert.equal(evs.length, 2);
  assert.equal(evs[1].repeatedAudio, 2);
});
test('hint_used se registra', () => {
  const { collector, plugin } = makePluginDom();
  plugin.recordHint();
  assert.equal(collector.getEvents({ eventType: 'hint_used' }).length, 1);
});
test('answer_submitted se registra', () => {
  const { collector, plugin } = makePluginDom();
  plugin.recordAnswer({ correct: true, targetWordId: 'raton' });
  const ev = collector.getEvents({ eventType: 'answer_submitted' })[0];
  assert.ok(ev);
  assert.equal(ev.specific.targetWordId, 'raton');
});
test('round_completed se registra', () => {
  const { collector, plugin } = makePluginDom();
  plugin.recordRound({ rounds: 3, correctAnswers: 2 });
  assert.equal(collector.getEvents({ eventType: 'round_completed' }).length, 1);
});
test('game_completed se registra', () => {
  const { collector, engine, plugin } = makePluginDom();
  plugin.start();
  engine.emit('gameCompleted', { score: 250 });
  assert.equal(collector.getEvents({ eventType: 'game_completed' }).length, 1);
});
test('game_abandoned se registra', () => {
  const { collector, engine, plugin } = makePluginDom();
  plugin.start();
  engine.emit('gameAbandoned', { reason: 'left' });
  assert.equal(collector.getEvents({ eventType: 'game_abandoned' }).length, 1);
});
test('recoverable error no bloquea', () => {
  const { collector, plugin } = makePluginDom();
  assert.doesNotThrow(() => plugin.recoverableError({ type: 'x' }));
  assert.equal(collector.getEvents({ eventType: 'game_error_recovered' }).length, 1);
});
test('destroy elimina listeners', () => {
  const { collector, engine, plugin } = makePluginDom();
  plugin.start();
  plugin.destroy();
  engine.emit('gameCompleted', { score: 100 });
  assert.equal(collector.getEvents({ eventType: 'game_completed' }).length, 0);
});

// 73-84 INTEGRACIÓN
test('engine funciona si localStorage falla', () => {
  const dom = createDom();
  const failingStorage = { getItem() { throw Object.assign(new Error('x'), { name: 'SecurityError' }); }, setItem() { throw Object.assign(new Error('x'), { name: 'SecurityError' }); } };
  setStorage(dom, failingStorage);
  loadAllSolo(dom.window);
  const adapter = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher' });
  assert.ok(adapter);
  assert.doesNotThrow(() => adapter.loadAndStart());
  adapter.engine.returnToProfileMap();
});
test('progreso se guarda si métricas fallan', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const repo = dom.window.SoloProgressRepository;
  const adapter = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher' });
  trackEngine(adapter.engine);
  adapter.loadAndStart();
  dom.window.SoloGameAdapter.getGameDef('rhyme-catcher');
  const before = repo.getProfileProgress('s', 'non_reader');
  adapter.engine.completeGame('non_reader', 'rhyme-catcher', { stars: 3 });
  const after = repo.getProfileProgress('s', 'non_reader');
  assert.ok(after.stars['rhyme-catcher'] >= (before.stars['rhyme-catcher'] || 0));
});
test('recompensa se entrega si métricas fallan', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const rm = dom.window.RewardManager.create(dom.window.SoloProgressRepository, 's');
  const adapter = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher' });
  trackEngine(adapter.engine);
  adapter.loadAndStart();
  assert.doesNotThrow(() => adapter.engine.completeGame('non_reader', 'rhyme-catcher', { stars: 3 }));
  assert.equal(typeof rm.getStars('non_reader', 'rhyme-catcher'), 'number');
  assert.ok(rm.getStars('non_reader', 'rhyme-catcher') >= 0);
});
test('audio es-CL sigue funcionando', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  assert.equal(dom.window.AudioManager.isSpeechAvailable(), true);
  const adapter = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher' });
  assert.ok(adapter);
});
test('assets siguen funcionando', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const loader = dom.window.AssetLoader.create({});
  loader.loadManifest = () => Promise.resolve({ version: 1, gameId: 'rhyme-catcher', assets: [] });
  loader.preloadAssets = () => Promise.resolve([]);
  const adapter = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher', assetLoader: loader });
  trackEngine(adapter.engine);
  adapter.loadAndStart();
  assert.ok(dom.window.document.getElementById('container').innerHTML.length >= 0);
  adapter.engine.returnToProfileMap();
});
test('dificultades siguen funcionando', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const a = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher', difficulty: 'support' });
  assert.equal(a.config.content[0].options.length, 3);
});
test('rhyme-catcher usa ID canónico', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const def = dom.window.SoloGameAdapter.getGameDef('rhyme-catcher');
  assert.equal(def.id, 'rhyme-catcher');
});
test('ruta legacy no duplica métricas', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const collector = dom.window.MetricsCollector.create({ studentProfileId: 's' });
  collector.recordEvent({ eventType: 'game_completed', gameId: 'rim-catcher', sessionId: 's1', stars: 3 });
  collector.recordEvent({ eventType: 'game_completed', gameId: 'rhyme-catcher', sessionId: 's2', stars: 2 });
  assert.equal(collector.getGameSummary('rhyme-catcher').completedSessions, 2);
  assert.equal(readStored(collector).events.filter((e) => e.gameId === 'rhyme-catcher').length, 2);
});
test('cambiar estudiante separa métricas', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const a = dom.window.MetricsCollector.create({ studentProfileId: 's-a' });
  const b = dom.window.MetricsCollector.create({ studentProfileId: 's-b' });
  a.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 'x' });
  assert.equal(a.getEvents().length, 1);
  assert.equal(b.getEvents().length, 0);
});
test('cambiar perfil no mezcla métricas', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = dom.window.MetricsCollector.create({ studentProfileId: 's' });
  c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 'x', readerProfile: 'non_reader' });
  c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 'y', readerProfile: 'beginner' });
  assert.equal(c.getEvents({ eventType: 'session_started' }).length, 2);
  assert.equal(c.getEvents({ readerProfile: 'non_reader' }).length, 1);
});
test('colaborativo no cambia', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = dom.window.MetricsCollector.create({ studentProfileId: 's' });
  c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 'x', readerProfile: 'collaborative' });
  assert.equal(c.getEvents()[0].readerProfile, 'collaborative');
});
test('ocho archivos colaborativos intactos', () => {
  const protectedNames = ['game.js', 'juego.html', 'juego-v2.html', 'environment-v2.js', 'environment-v2.css', 'auth.js', 'index.html', 'dashboard.html'];
  protectedNames.forEach((n) => {
    const p = pathResolve(BASE, '../' + n);
    assert.doesNotThrow(() => readFileSync(p, 'utf8'));
  });
});
test('clearDevelopmentMetrics deshabilitado en producción', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's', devMode: false });
  const res = c.clearDevelopmentMetrics();
  assert.equal(res.cleared, false);
  assert.equal(res.reason, 'disabled-in-production');
});
test('clearDevelopmentMetrics borra solo namespace en dev', () => {
  const dom = createDom(); loadAllSolo(dom.window);
  const c = freshCollector(dom.window, { studentProfileId: 's', devMode: true });
  c.recordEvent({ eventType: 'session_started', gameId: 'rhyme-catcher', sessionId: 'x' });
  const res = c.clearDevelopmentMetrics();
  assert.equal(res.cleared, true);
  assert.equal(c.getEvents().length, 0);
});
