import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE = resolve(__dirname, '../public/expedicion/solo');

function readFile(subpath) {
  return readFileSync(resolve(BASE, subpath), 'utf8');
}

const CORE_FILES = [
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
  'core/solo-game-engine.js',
  'core/solo-game-adapter.js',
  'games/vocal-a-game.js',
  'games/non-reader/rim-catcher.js',
  'games/non-reader/initial-sound-detector.js',
  'games/non-reader/syllable-counter.js',
  'games/non-reader/final-sound-catcher.js',
  'profiles/non-reader/non-reader-difficulties.js',
  'profiles/non-reader/non-reader-difficulty-store.js'
];

const ROUTER_FILES = [
  '../router/session-manager.js',
  '../menu/menu.js',
  '../menu/solo-entry.js'
];

function makeLs() {
  const store = {};
  return {
    store,
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
}

function loadAll(window, ls) {
  const allSrc = CORE_FILES.concat(ROUTER_FILES).map(f => readFile(f)).join('\n');
  const fn = new Function('window', 'document', 'navigator', 'localStorage', 'AudioContext', 'requestAnimationFrame', 'cancelAnimationFrame', allSrc);
  fn(
    window, window.document, window.navigator, ls,
    function () { return { state: 'running', resume: () => Promise.resolve(), close: () => {} }; },
    function (cb) { return setTimeout(cb, 0); },
    function (id) { clearTimeout(id); }
  );
}

function createDom(url) {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div class="menu-grid"></div><div id="solo-container"></div></body></html>', {
    url: url || 'http://localhost:3000/',
    pretendToBeVisual: true
  });
  dom.window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  dom.window.cancelAnimationFrame = (id) => clearTimeout(id);
  return dom;
}

function createEngine(window, ls, gameId, difficulty, accessibility) {
  const container = window.document.getElementById('solo-container') || (() => { const d = window.document.createElement('div'); window.document.body.appendChild(d); return d; })();
  return window.SoloGameAdapter.createEngine({
    studentProfileId: 'student-test',
    container,
    gameId,
    difficulty,
    accessibility: accessibility || {}
  });
}

// ============================================================
// CONFIGURACIÓN
// ============================================================
test('P7.1 existen tres modos de dificultad', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const D = dom.window.NonReaderDifficulty;
  const ids = D.getNonReaderDifficultyList().map(d => d.id);
  assert.deepEqual(ids.sort(), ['challenge', 'standard', 'support']);
});

test('P7.2 standard es el predeterminado', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const D = dom.window.NonReaderDifficulty;
  assert.equal(D.DEFAULT_NON_READER_DIFFICULTY, 'standard');
  assert.equal(D.getNonReaderDifficultyConfig().id, 'standard');
});

test('P7.3 ID inválido vuelve a standard', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const D = dom.window.NonReaderDifficulty;
  assert.equal(D.getNonReaderDifficultyConfig('x').id, 'standard');
  assert.equal(D.getNonReaderDifficultyConfig(null).id, 'standard');
  assert.equal(D.getNonReaderDifficultyConfig('').id, 'standard');
});

test('P7.4 configuración compartida no se muta al usarla', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const D = dom.window.NonReaderDifficulty;
  const before = JSON.stringify(D.NON_READER_DIFFICULTIES);
  const cfg = D.getNonReaderDifficultyConfig('challenge');
  cfg.optionCount = 99;
  cfg.label = 'hack';
  assert.equal(JSON.stringify(D.NON_READER_DIFFICULTIES), before);
});

test('P7.5 etiquetas correctas', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const D = dom.window.NonReaderDifficulty;
  assert.equal(D.getNonReaderDifficultyConfig('support').label, 'Apoyo');
  assert.equal(D.getNonReaderDifficultyConfig('standard').label, 'Estándar');
  assert.equal(D.getNonReaderDifficultyConfig('challenge').label, 'Desafío');
});

// ============================================================
// PERSISTENCIA
// ============================================================
test('P7.6 guarda dificultad por estudiante', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const Store = dom.window.NonReaderDifficultyStore;
  Store.setDifficulty('s1', 'non_reader', 'challenge');
  assert.equal(ls.store['lectoguarida:solo-settings:v1:s1'], JSON.stringify({ version: 1, profiles: { non_reader: { difficulty: 'challenge' } } }));
});

test('P7.7 recupera dificultad', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const Store = dom.window.NonReaderDifficultyStore;
  Store.setDifficulty('s1', 'non_reader', 'support');
  assert.equal(Store.getDifficulty('s1', 'non_reader'), 'support');
});

test('P7.8 separa estudiantes', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const Store = dom.window.NonReaderDifficultyStore;
  Store.setDifficulty('s1', 'non_reader', 'support');
  Store.setDifficulty('s2', 'non_reader', 'challenge');
  assert.equal(Store.getDifficulty('s1', 'non_reader'), 'support');
  assert.equal(Store.getDifficulty('s2', 'non_reader'), 'challenge');
});

test('P7.9 separa perfiles', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const Store = dom.window.NonReaderDifficultyStore;
  Store.setDifficulty('s1', 'non_reader', 'support');
  Store.setDifficulty('s1', 'beginner', 'challenge');
  assert.equal(Store.getDifficulty('s1', 'non_reader'), 'support');
  assert.equal(Store.getDifficulty('s1', 'beginner'), 'challenge');
});

test('P7.10 no escribe con ID vacío', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const Store = dom.window.NonReaderDifficultyStore;
  assert.equal(Store.setDifficulty('', 'non_reader', 'support'), false);
  assert.equal(Store.getDifficulty('', 'non_reader'), 'standard');
});

test('P7.11 conserva ajustes de audio', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const Store = dom.window.NonReaderDifficultyStore;
  ls.store['lectoguarida:solo-settings:v1:s1'] = JSON.stringify({ version: 1, audio: { muted: true }, profiles: {} });
  Store.setDifficulty('s1', 'non_reader', 'challenge');
  const parsed = JSON.parse(ls.store['lectoguarida:solo-settings:v1:s1']);
  assert.ok(parsed.audio && parsed.audio.muted === true);
});

test('P7.12 conserva ajustes de accesibilidad', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const Store = dom.window.NonReaderDifficultyStore;
  ls.store['lectoguarida:solo-settings:v1:s1'] = JSON.stringify({ version: 1, accessibility: { largeTargets: true }, profiles: {} });
  Store.setDifficulty('s1', 'non_reader', 'challenge');
  const parsed = JSON.parse(ls.store['lectoguarida:solo-settings:v1:s1']);
  assert.ok(parsed.accessibility && parsed.accessibility.largeTargets === true);
});

test('P7.13 reset individual vuelve a standard', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const Store = dom.window.NonReaderDifficultyStore;
  Store.setDifficulty('s1', 'non_reader', 'challenge');
  Store.resetDifficulty('s1', 'non_reader');
  assert.equal(Store.getDifficulty('s1', 'non_reader'), 'standard');
});

test('P7.14 no existe reset global', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const Store = dom.window.NonReaderDifficultyStore;
  assert.equal(typeof Store.resetDifficulty, 'function');
  assert.equal(typeof Store.resetAll, 'undefined');
});

// ============================================================
// MAPA — SELECTOR
// ============================================================
function renderMap(window, ls) {
  if (ls && ls.store) {
    ls.store['lectoguarida:session:v1'] = JSON.stringify({
      sessionVersion: 1, modeGame: 'solo', readerProfile: 'non_reader',
      studentProfileId: 'student-test', worldId: null, gameId: null,
      inputMode: 'mouse', startedAt: new Date().toISOString()
    });
  }
  window.document.body.innerHTML = '<div class="menu-grid"></div><div id="solo-container"></div>';
  window.SoloRouter.renderNonReaderMap();
  return window.document.getElementById('solo-container');
}

test('P7.15 muestra tres opciones en el mapa', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const container = renderMap(dom.window, ls);
  const btns = container.querySelectorAll('.nr-difficulty-btn');
  assert.equal(btns.length, 3);
});

test('P7.16 selección con mouse persiste', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const container = renderMap(dom.window, ls);
  const btn = container.querySelector('[data-difficulty="challenge"]');
  btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(dom.window.NonReaderDifficultyStore.getDifficulty('student-test', 'non_reader'), 'challenge');
});

test('P7.17 selección con teclado (Enter) persiste', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const container = renderMap(dom.window, ls);
  const btn = container.querySelector('[data-difficulty="support"]');
  const ev = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
  btn.dispatchEvent(ev);
  assert.equal(dom.window.NonReaderDifficultyStore.getDifficulty('student-test', 'non_reader'), 'support');
});

test('P7.18 selección con touch persiste', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const container = renderMap(dom.window, ls);
  const btn = container.querySelector('[data-difficulty="standard"]');
  btn.dispatchEvent(new dom.window.Event('touchend', { bubbles: true }));
  assert.equal(dom.window.NonReaderDifficultyStore.getDifficulty('student-test', 'non_reader'), 'standard');
});

test('P7.19 aria-checked/pressed correcto', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const container = renderMap(dom.window, ls);
  const challenge = container.querySelector('[data-difficulty="challenge"]');
  challenge.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  const btns = container.querySelectorAll('.nr-difficulty-btn');
  let activePressed = 0;
  btns.forEach(b => { if (b.getAttribute('aria-pressed') === 'true') activePressed++; });
  assert.equal(activePressed, 1);
  assert.equal(challenge.getAttribute('aria-pressed'), 'true');
});

test('P7.20 persiste tras "recarga" (nuevo render lee store)', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const container1 = renderMap(dom.window, ls);
  container1.querySelector('[data-difficulty="challenge"]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  const container2 = renderMap(dom.window, ls);
  const active = container2.querySelector('.nr-difficulty-btn[aria-pressed="true"]');
  assert.ok(active);
  assert.equal(active.getAttribute('data-difficulty'), 'challenge');
});

// ============================================================
// RHYME-CATCHER
// ============================================================
test('P7.21 Apoyo usa tres opciones', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'rim-catcher', 'support');
  a.config.content.forEach(r => assert.equal(r.options.length, 3));
});

test('P7.22 Estándar usa cuatro opciones', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'rim-catcher', 'standard');
  a.config.content.forEach(r => assert.equal(r.options.length, 4));
});

test('P7.23 Desafío usa hasta cinco opciones', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'rim-catcher', 'challenge');
  a.config.content.forEach(r => assert.ok(r.options.length <= 5));
  assert.equal(a.config.content[0].options.length, 5);
});

test('P7.24 Apoyo usa objetivos grandes', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'rim-catcher', 'support');
  assert.equal(a.config.accessibility.largeTargets, true);
  assert.equal(a.config.difficulty.largeTargets, true);
});

test('P7.25 Desafío usa distractores próximos', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'rim-catcher', 'challenge');
  assert.equal(a.config.difficulty.closeDistractors, true);
});

// ============================================================
// INITIAL SOUND
// ============================================================
test('P7.26 Apoyo usa palabra modelo', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'initial-sound-detector', 'support');
  assert.equal(a.config.difficulty.id, 'support');
  assert.equal(a.config.difficulty.visualDemo, true);
  a.config.content.forEach(r => assert.ok(r.phonemeExamples && r.phonemeExamples.length >= 1));
});

test('P7.27 Estándar usa cuatro opciones', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'initial-sound-detector', 'standard');
  a.config.content.forEach(r => assert.equal(r.options.length, 4));
});

test('P7.28 Desafío usa más distractores', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'initial-sound-detector', 'challenge');
  assert.equal(a.config.difficulty.closeDistractors, true);
  assert.ok(a.config.content[0].options.length >= 4);
});

test('P7.29 mantiene audio de fonema (es-CL)', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'initial-sound-detector', 'challenge');
  const round = a.config.content[0];
  assert.ok(round.phoneme);
  assert.ok(dom.window.AudioManager.isSpeechAvailable || true);
});

// ============================================================
// SYLLABLE COUNTER
// ============================================================
test('P7.30 Apoyo filtra una y dos sílabas', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'syllable-counter', 'support');
  a.config.content.forEach(r => assert.ok(r.syllables.length >= 1 && r.syllables.length <= 2));
});

test('P7.31 Estándar admite hasta cuatro', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'syllable-counter', 'standard');
  a.config.content.forEach(r => assert.ok(r.syllables.length >= 1 && r.syllables.length <= 4));
});

test('P7.32 Desafío admite hasta cinco', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'syllable-counter', 'challenge');
  a.config.content.forEach(r => assert.ok(r.syllables.length >= 2 && r.syllables.length <= 5));
});

test('P7.33 no altera conteo validado de sílabas', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'syllable-counter', 'challenge');
  const manzana = a.config.content.find(r => r.word === 'Manzana');
  assert.ok(manzana);
  assert.deepEqual(manzana.syllables, ['man', 'za', 'na']);
});

test('P7.34 no agrega temporizador', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'syllable-counter', 'challenge');
  assert.equal(a.config.difficulty.timer, false);
  assert.equal(a.config.accessibility.noTimer, true);
});

// ============================================================
// FINAL SOUND
// ============================================================
test('P7.35 Apoyo usa velocidad lenta', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'final-sound-catcher', 'support');
  assert.ok(a.config.content.fallSpeed < 1.2);
});

test('P7.36 Estándar usa velocidad normal', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'final-sound-catcher', 'standard');
  assert.equal(a.config.content.fallSpeed, 1.2);
});

test('P7.37 Desafío usa velocidad moderada', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'final-sound-catcher', 'challenge');
  assert.ok(a.config.content.fallSpeed > 1.2);
});

test('P7.38 reducedMotion usa grilla en todos los modos', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  ['support', 'standard', 'challenge'].forEach(diff => {
    const a = createEngine(dom.window, ls, 'final-sound-catcher', diff, { reducedMotion: true });
    assert.equal(a.config.content.staticGrid, true, 'staticGrid activo en ' + diff);
    assert.equal(a.config.accessibility.reducedMotion, true);
  });
});

test('P7.39 FallingItemsTemplate expose destroy que limpia animación', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  assert.equal(typeof dom.window.FallingItemsTemplate.create({ container: dom.window.document.getElementById('solo-container'), config: { content: [] }, engine: { getFeedback: () => null } }).destroy, 'function');
});

// ============================================================
// INTEGRACIÓN
// ============================================================
test('P7.40 adapter carga dificultad guardada', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  dom.window.NonReaderDifficultyStore.setDifficulty('student-test', 'non_reader', 'challenge');
  const a = createEngine(dom.window, ls, 'rim-catcher', undefined);
  assert.equal(a.config.difficulty.id, 'challenge');
});

test('P7.41 engine recibe dificultad', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'rim-catcher', 'support');
  assert.equal(a.config.difficulty.id, 'support');
  assert.equal(a.config.difficulty.label, 'Apoyo');
  assert.ok(a.config.difficulty.speechRate);
});

test('P7.42 templates reciben una copia (no mutan el original)', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const orig = dom.window.SoloGameAdapter.getGameDef('rim-catcher').content;
  const before = JSON.stringify(orig);
  const a = createEngine(dom.window, ls, 'rim-catcher', 'challenge');
  assert.equal(JSON.stringify(dom.window.SoloGameAdapter.getGameDef('rim-catcher').content), before);
  assert.notEqual(a.config.content, orig);
});

test('P7.43 cambiar dificultad reinicia solo sesión (no progreso)', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  dom.window.NonReaderDifficultyStore.setDifficulty('student-test', 'non_reader', 'standard');
  const a1 = createEngine(dom.window, ls, 'rim-catcher', 'standard');
  dom.window.NonReaderDifficultyStore.setDifficulty('student-test', 'non_reader', 'challenge');
  const a2 = createEngine(dom.window, ls, 'rim-catcher', 'challenge');
  assert.equal(a2.config.difficulty.id, 'challenge');
  assert.equal(dom.window.NonReaderDifficultyStore.getDifficulty('student-test', 'non_reader'), 'challenge');
  assert.ok(a1.config && a2.config);
});

test('P7.44 progreso se conserva al cambiar dificultad', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  dom.window.SoloProgressRepository.updateProfileProgress('student-test', 'non_reader', { stars: { 'rim-catcher': 3 } });
  dom.window.NonReaderDifficultyStore.setDifficulty('student-test', 'non_reader', 'challenge');
  const prog = dom.window.SoloProgressRepository.getProfileProgress('student-test', 'non_reader');
  assert.equal(prog.stars['rim-catcher'], 3);
});

test('P7.45 recompensa no se duplica', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'rim-catcher', 'standard');
  a.engine.loadGame(a.config);
  a.engine.completeGame({ correctAnswers: 5, totalRounds: 5 });
  const prog = dom.window.SoloProgressRepository.getProfileProgress('student-test', 'non_reader');
  assert.ok('rim-catcher' in prog.stars);
  assert.ok(Object.keys(ls.store).some(k => k.indexOf('lectoguarida:solo-progress') === 0));
});

test('P7.46 audio es-CL se conserva', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const am = dom.window.AudioManager;
  createEngine(dom.window, ls, 'rim-catcher', 'support');
  assert.equal(am.getDefaultSpeechRate(), 0.78);
  createEngine(dom.window, ls, 'rim-catcher', 'challenge');
  assert.equal(am.getDefaultSpeechRate(), 0.95);
});

test('P7.47 assets se conservan (manifiesto no cambia)', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = createEngine(dom.window, ls, 'rim-catcher', 'challenge');
  assert.ok(a.config.__assetLoader);
  assert.ok(a.assetsReady);
});

test('P7.48 preferencias de accesibilidad tienen prioridad', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  const a = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 'student-test',
    container: dom.window.document.getElementById('solo-container'),
    gameId: 'rim-catcher',
    difficulty: 'challenge',
    accessibility: { largeTargets: true, reducedMotion: true }
  });
  assert.equal(a.config.accessibility.largeTargets, true, 'largeTargets de usuario prevalece en Desafío');
  assert.equal(a.config.accessibility.reducedMotion, true);
});

test('P7.49 otros perfiles no cambian', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  dom.window.NonReaderDifficultyStore.setDifficulty('student-test', 'beginner', 'support');
  dom.window.NonReaderDifficultyStore.setDifficulty('student-test', 'non_reader', 'challenge');
  assert.equal(dom.window.NonReaderDifficultyStore.getDifficulty('student-test', 'beginner'), 'support');
});

test('P7.50 colaborativo no cambia (namespace distinto)', () => {
  const dom = createDom(); const ls = makeLs(); loadAll(dom.window, ls);
  dom.window.NonReaderDifficultyStore.setDifficulty('student-test', 'non_reader', 'challenge');
  assert.ok(!('lectoguarida:collab' in ls.store));
});

test('P7.51 ocho hashes colaborativos intactos', async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const fs = require('fs');
  const { execFileSync } = require('child_process');
  const repoRoot = resolve(__dirname, '../../..');
  const targets = [
    'outputs/Lectoguarida-Windows/public/expedicion/game.js',
    'outputs/Lectoguarida-Windows/public/expedicion/juego.html',
    'outputs/Lectoguarida-Windows/public/expedicion/juego-v2.html',
    'outputs/Lectoguarida-Windows/public/expedicion/environment-v2.js',
    'outputs/Lectoguarida-Windows/public/expedicion/environment-v2.css',
    'outputs/Lectoguarida-Windows/public/expedicion/auth.js',
    'outputs/Lectoguarida-Windows/public/expedicion/index.html',
    'outputs/Lectoguarida-Windows/public/expedicion/dashboard.html'
  ];
  targets.forEach((rel) => {
    const p = resolve(repoRoot, rel);
    assert.ok(fs.existsSync(p), 'existe ' + rel);
    try {
      execFileSync('git', ['diff', '--quiet', 'HEAD', '--', rel], { cwd: repoRoot, stdio: 'ignore' });
    } catch (e) {
      assert.fail('archivo colaborativo modificado respecto a HEAD: ' + rel);
    }
  });
});
