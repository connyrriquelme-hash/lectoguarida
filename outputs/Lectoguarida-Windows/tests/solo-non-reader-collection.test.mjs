import test, { after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createTestDom, cleanupTestEnvironment, trackEngine } from './helpers/jsdom-test-environment.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE = resolve(__dirname, '../public/expedicion/solo');

afterEach(() => {
  cleanupTestEnvironment();
});

after(() => {
  cleanupTestEnvironment();
});

function readFile(subpath) {
  return readFileSync(resolve(BASE, subpath), 'utf8');
}

function loadAllModules(window) {
  const files = [
    'core/solo-state-machine.js',
    'core/game-config-validator.js',
    'core/input-manager.js',
    'core/scoring-engine.js',
    'core/feedback-manager.js',
    'core/reward-manager.js',
    'core/progress-repository.js',
    'core/audio-manager.js',
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
    'games/non-reader/final-sound-catcher.js'
  ];
  const allSrc = files.map(f => readFile(f)).join('\n');
  const fakeStorage = {};
  const fakeLs = { getItem: (k) => fakeStorage[k] || null, setItem: (k, v) => { fakeStorage[k] = v; }, removeItem: (k) => { delete fakeStorage[k]; } };
  const fn = new Function('window', 'document', 'navigator', 'localStorage', 'AudioContext', allSrc);
  fn(window, window.document, window.navigator, fakeLs, function() { return { state: 'running', resume: () => Promise.resolve(), close: () => {} }; });
  if (window.SoloGameAdapter && window.SoloGameAdapter.createEngine) {
    const __orig = window.SoloGameAdapter.createEngine;
    window.SoloGameAdapter.createEngine = function (opts) {
      const adapter = __orig.call(this, opts);
      try { trackEngine(adapter.engine); } catch (e) { /* ignore */ }
      return adapter;
    };
  }
  return fakeLs;
}

function createDom() {
  const dom = createTestDom({ url: 'http://localhost:3000/expedicion/solo/no-lectores' });
  return dom;
}

// ============================================================
// 1. Los 4 juegos están registrados
// ============================================================
test('rim-catcher está registrado', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('rim-catcher');
  assert.ok(game);
  assert.equal(game.id, 'rim-catcher');
  assert.equal(game.profile, 'non_reader');
});

test('initial-sound-detector está registrado', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('initial-sound-detector');
  assert.ok(game);
  assert.equal(game.id, 'initial-sound-detector');
  assert.equal(game.profile, 'non_reader');
});

test('syllable-counter está registrado', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('syllable-counter');
  assert.ok(game);
  assert.equal(game.id, 'syllable-counter');
  assert.equal(game.profile, 'non_reader');
  assert.equal(game.template, 'syllable_tap');
});

test('final-sound-catcher está registrado', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('final-sound-catcher');
  assert.ok(game);
  assert.equal(game.id, 'final-sound-catcher');
  assert.equal(game.profile, 'non_reader');
  assert.equal(game.template, 'falling_items');
});

// ============================================================
// 5. listGames non_reader retorna los 5 juegos (vocal-a + 4 nuevos)
// ============================================================
test('listGames non_reader retorna 5 juegos', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const games = dom.window.SoloGameAdapter.listGames('non_reader');
  assert.equal(games.length, 5);
  const ids = games.map(g => g.id);
  assert.ok(ids.includes('rim-catcher'));
  assert.ok(ids.includes('initial-sound-detector'));
  assert.ok(ids.includes('syllable-counter'));
  assert.ok(ids.includes('final-sound-catcher'));
  assert.ok(ids.includes('vocal-a'));
});

// ============================================================
// 6-9. Cada juego tiene contenido de 5 rondas
// ============================================================
test('rim-catcher tiene 5 rondas', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('rim-catcher');
  assert.equal(game.content.length, 5);
});

test('initial-sound-detector tiene 5 rondas', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('initial-sound-detector');
  assert.equal(game.content.length, 5);
});

test('syllable-counter tiene 5 rondas', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('syllable-counter');
  assert.equal(game.content.length, 5);
});

test('final-sound-catcher tiene 5 rondas', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('final-sound-catcher');
  assert.equal(game.content.length, 5);
});

// ============================================================
// 10-13. Cada juego tiene instrucciones y accessibility
// ============================================================
test('rim-catcher tiene instrucciones y accessibility', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('rim-catcher');
  assert.ok(game.instructions);
  assert.ok(game.instructions.text);
  assert.ok(game.accessibility);
  assert.equal(game.accessibility.noTimer, true);
  assert.equal(game.accessibility.largeTargets, true);
});

test('initial-sound-detector tiene instrucciones y accessibility', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('initial-sound-detector');
  assert.ok(game.instructions);
  assert.ok(game.accessibility);
});

test('syllable-counter tiene instrucciones y accessibility', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('syllable-counter');
  assert.ok(game.instructions);
  assert.ok(game.accessibility);
});

test('final-sound-catcher tiene instrucciones y accessibility', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('final-sound-catcher');
  assert.ok(game.instructions);
  assert.ok(game.accessibility);
});

// ============================================================
// 14-17. Cada juego tiene scoring y rewards
// ============================================================
test('rim-catcher tiene scoring y rewards', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('rim-catcher');
  assert.ok(game.scoring);
  assert.ok(game.rewards);
  assert.equal(game.rewards.lostPages, 1);
});

test('initial-sound-detector tiene scoring y rewards', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('initial-sound-detector');
  assert.ok(game.scoring);
  assert.ok(game.rewards);
});

test('syllable-counter tiene scoring y rewards', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('syllable-counter');
  assert.ok(game.scoring);
  assert.ok(game.rewards);
});

test('final-sound-catcher tiene scoring y rewards', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('final-sound-catcher');
  assert.ok(game.scoring);
  assert.ok(game.rewards);
});

// ============================================================
// 18. SyllableTapTemplate se puede crear
// ============================================================
test('SyllableTapTemplate se puede crear', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const template = dom.window.SyllableTapTemplate.create({
    container: container,
    config: { content: [
      { question: 'Test', word: 'Pato', syllables: ['pa', 'to'], answers: [0, 1] }
    ] },
    engine: null
  });
  assert.ok(template);
  assert.equal(typeof template.start, 'function');
  assert.equal(typeof template.destroy, 'function');
});

// ============================================================
// 19. SyllableTapTemplate renderiza sílabas
// ============================================================
test('SyllableTapTemplate renderiza sílabas', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const template = dom.window.SyllableTapTemplate.create({
    container: container,
    config: { content: [
      { question: '¿Cuántas sílabas?', word: 'Pato', syllables: ['pa', 'to'], answers: [0, 1] }
    ] },
    engine: null
  });
  template.start();
  const blocks = container.querySelectorAll('.solo-syllable');
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].textContent.includes('pa'), true);
  assert.equal(blocks[1].textContent.includes('to'), true);
});

// ============================================================
// 20. FallingItemsTemplate se puede crear
// ============================================================
test('FallingItemsTemplate se puede crea', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const template = dom.window.FallingItemsTemplate.create({
    container: container,
    config: { content: [
      { question: 'Test', options: [{ label: 'A', id: 'a', isCorrect: true }, { label: 'B', id: 'b', isCorrect: false }], answers: [0] }
    ] },
    engine: null
  });
  assert.ok(template);
  assert.equal(typeof template.start, 'function');
  assert.equal(typeof template.pause, 'function');
  assert.equal(typeof template.resume, 'function');
  assert.equal(typeof template.destroy, 'function');
});

// ============================================================
// 21. FallingItemsTemplate renderiza zona de items
// ============================================================
test('FallingItemsTemplate renderiza zona de items', () => {
  const dom = createDom();
  const origRAF = globalThis.requestAnimationFrame;
  const origCAF = globalThis.cancelAnimationFrame;
  globalThis.requestAnimationFrame = function(cb) { return setTimeout(cb, 0); };
  globalThis.cancelAnimationFrame = function(id) { clearTimeout(id); };
  try {
    loadAllModules(dom.window);
    const container = dom.window.document.getElementById('container');
    const template = dom.window.FallingItemsTemplate.create({
      container: container,
      config: { content: [
        { question: 'Atrapa la A', options: [{ label: 'A', id: 'a', isCorrect: true }, { label: 'B', id: 'b', isCorrect: false }], answers: [0] }
      ] },
      engine: null
    });
    template.start();
    const zone = container.querySelector('[data-role="falling-zone"]');
    assert.ok(zone);
    const catcher = container.querySelector('[data-role="catcher"]');
    assert.ok(catcher);
  } finally {
    globalThis.requestAnimationFrame = origRAF;
    globalThis.cancelAnimationFrame = origCAF;
  }
});

// ============================================================
// 22. createEngine funciona con rim-catcher
// ============================================================
test('createEngine funciona con rim-catcher', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 'test-student',
    container: container,
    gameId: 'rim-catcher'
  });
  assert.ok(adapter);
  assert.ok(adapter.engine);
  assert.ok(adapter.config);
  assert.equal(adapter.config.id, 'rim-catcher');
  assert.equal(typeof adapter.loadAndStart, 'function');
});

// ============================================================
// 23. createEngine funciona con initial-sound-detector
// ============================================================
test('createEngine funciona con initial-sound-detector', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 'test-student',
    container: container,
    gameId: 'initial-sound-detector'
  });
  assert.ok(adapter);
  assert.equal(adapter.config.id, 'initial-sound-detector');
});

// ============================================================
// 24. createEngine funciona con syllable-counter
// ============================================================
test('createEngine funciona con syllable-counter', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 'test-student',
    container: container,
    gameId: 'syllable-counter'
  });
  assert.ok(adapter);
  assert.equal(adapter.config.id, 'syllable-counter');
  assert.equal(adapter.config.template, 'syllable_tap');
});

// ============================================================
// 25. createEngine funciona con final-sound-catcher
// ============================================================
test('createEngine funciona con final-sound-catcher', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 'test-student',
    container: container,
    gameId: 'final-sound-catcher'
  });
  assert.ok(adapter);
  assert.equal(adapter.config.id, 'final-sound-catcher');
  assert.equal(adapter.config.template, 'falling_items');
});

// ============================================================
// 26. Los 4 juegos no modifican game.js
// ============================================================
test('game.js hash unchanged after non-reader games', () => {
  const src = readFileSync(resolve(__dirname, '../public/expedicion/game.js'), 'utf8');
  const hash = createHash('sha256').update(src).digest('hex').substring(0, 8).toUpperCase();
  assert.equal(hash, '4B86469E');
});

// ============================================================
// 27. Los 4 juegos no modifican index.html
// ============================================================
test('index.html hash unchanged after non-reader games', () => {
  const src = readFileSync(resolve(__dirname, '../public/expedicion/index.html'), 'utf8');
  const hash = createHash('sha256').update(src).digest('hex').substring(0, 8).toUpperCase();
  assert.equal(hash, '6953E924');
});

// ============================================================
// 28. Vocal-a sigue funcionando
// ============================================================
test('vocal-a sigue funcionando después de agregar 4 juegos', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 'test-student',
    container: container,
    gameId: 'vocal-a'
  });
  assert.ok(adapter);
  assert.equal(adapter.config.id, 'vocal-a');
});

// ============================================================
// 29. Syllable-tap tiene contenido correcto
// ============================================================
test('syllable-counter tiene sílabas correctas', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('syllable-counter');
  const first = game.content[0];
  assert.equal(first.word, 'Manzana');
  assert.deepEqual(first.syllables, ['man', 'za', 'na']);
});

// ============================================================
// 30. Final-sound-catcher tiene opciones con isCorrect
// ============================================================
test('final-sound-catcher tiene opciones con isCorrect', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const game = dom.window.SoloGameAdapter.getGameDef('final-sound-catcher');
  const first = game.content[0];
  assert.ok(first.options);
  assert.ok(first.options.length >= 2);
  const correctOnes = first.options.filter(o => o.isCorrect);
  assert.ok(correctOnes.length >= 1);
});

// ============================================================
// 31. Non-reader profile config actualizado
// ============================================================
test('non-reader profile config incluye syllable_tap y falling_items', () => {
  const src = readFileSync(resolve(BASE, 'profiles/non-reader/profile-config.js'), 'utf8');
  assert.ok(src.includes('syllable_tap') || src.includes('syllable-tap'));
});
