import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE = resolve(__dirname, '../public/expedicion/solo');

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
    'core/solo-game-engine.js',
    'core/solo-game-adapter.js',
    'templates/click-selection-template.js',
    'templates/drag-drop-template.js',
    'templates/avatar-movement-template.js',
    'plugins/audio-instruction-plugin.js',
    'plugins/timer-plugin.js',
    'plugins/keyboard-input-plugin.js',
    'plugins/reward-plugin.js',
    'plugins/accessibility-plugin.js',
    'games/vocal-a-game.js'
  ];
  const allSrc = files.map(f => readFile(f)).join('\n');
  const fakeStorage = {};
  const fakeLs = { getItem: (k) => fakeStorage[k] || null, setItem: (k, v) => { fakeStorage[k] = v; }, removeItem: (k) => { delete fakeStorage[k]; } };
  const fn = new Function('window', 'document', 'navigator', 'localStorage', 'AudioContext', allSrc);
  fn(window, window.document, window.navigator, fakeLs, function() { return { state: 'running', resume: () => Promise.resolve(), close: () => {} }; });
  return fakeLs;
}

function createDom() {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="container"></div></body></html>', {
    url: 'http://localhost:3000/expedicion/solo/no-lectores'
  });
  dom.window.requestAnimationFrame = function(cb) { return setTimeout(cb, 0); };
  dom.window.cancelAnimationFrame = function(id) { clearTimeout(id); };
  return dom;
}

// ============================================================
// 1. clearAll no está disponible en producción
// ============================================================
test('clearAll no está expuesto en la API pública', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const repo = dom.window.SoloProgressRepository;
  assert.equal(typeof repo.clearAll, 'undefined');
  assert.equal(typeof repo.resetAllDevelopmentData, 'undefined');
});

// ============================================================
// 2. resetProfile afecta un solo perfil
// ============================================================
test('resetProfile afecta un solo perfil', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  dom.window.SoloProgressRepository.completeGame('rp1', 'non_reader', 'g1', 3);
  dom.window.SoloProgressRepository.completeGame('rp1', 'beginner', 'g2', 2);
  dom.window.SoloProgressRepository.resetProfile('rp1', 'non_reader');
  const nr = dom.window.SoloProgressRepository.getProfileProgress('rp1', 'non_reader');
  const bg = dom.window.SoloProgressRepository.getProfileProgress('rp1', 'beginner');
  assert.equal(nr.completedGames.length, 0);
  assert.ok(bg.completedGames.includes('g2'));
});

// ============================================================
// 3. Ajustes se aíslan por estudiante
// ============================================================
test('ajustes se aíslan por estudiante', () => {
  const dom = createDom();
  const ls = loadAllModules(dom.window);
  const acc1 = dom.window.AccessibilityManager.create('student-a');
  acc1.set('reducedMotion', true);
  const acc2 = dom.window.AccessibilityManager.create('student-b');
  assert.equal(acc2.get('reducedMotion'), false);
  assert.equal(acc1.get('reducedMotion'), true);
});

// ============================================================
// 4. Migración de ajustes antigua
// ============================================================
test('migración de ajustes desde clave antigua', () => {
  const dom = createDom();
  const ls = loadAllModules(dom.window);
  ls.setItem('lectoguarida:solo-settings:v1', JSON.stringify({ version: 1, reducedMotion: true, largeText: false, highContrast: false, extendedTime: false, audioDisabled: false, keyboardNavigation: true, focusVisible: true }));
  const acc = dom.window.AccessibilityManager.load('migration-student');
  assert.equal(acc.reducedMotion, true);
});

// ============================================================
// 5. Estado atraviesa PROFILE_READY
// ============================================================
test('estado atraviesa PROFILE_READY', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const sm = dom.window.SoloStateMachine.create();
  const phases = [];
  sm.subscribe(function(state) { phases.push(state.phase); });
  sm.transitionTo('PROFILE_READY', 'test');
  assert.ok(phases.includes('PROFILE_READY'));
});

// ============================================================
// 6. Estado atraviesa INSTRUCTIONS
// ============================================================
test('estado atraviesa INSTRUCTIONS', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const sm = dom.window.SoloStateMachine.create();
  sm.transitionTo('PROFILE_READY', 't');
  sm.loadGame({ id: 'test', template: 'click_selection', profile: 'non_reader' });
  const phases = [];
  sm.subscribe(function(state) { phases.push(state.phase); });
  sm.transitionTo('INSTRUCTIONS', 'test');
  assert.ok(phases.includes('INSTRUCTIONS'));
});

// ============================================================
// 7. Estado atraviesa READY
// ============================================================
test('estado atraviesa READY antes de PLAYING', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const sm = dom.window.SoloStateMachine.create();
  sm.transitionTo('PROFILE_READY', 't');
  sm.loadGame({ id: 'test', template: 'click_selection', profile: 'non_reader' });
  sm.transitionTo('INSTRUCTIONS', 't');
  const phases = [];
  sm.subscribe(function(state) { phases.push(state.phase); });
  sm.transitionTo('READY', 'test');
  assert.ok(phases.includes('READY'));
});

// ============================================================
// 8. Input no funciona durante LOADING_GAME
// ============================================================
test('input no cambia fase durante LOADING_GAME', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const sm = dom.window.SoloStateMachine.create();
  sm.transitionTo('PROFILE_READY', 't');
  sm.loadGame({ id: 'test', template: 'click_selection', profile: 'non_reader' });
  assert.equal(sm.getState().phase, 'LOADING_GAME');
  const r = sm.transitionTo('PLAYING', 'premature');
  assert.equal(r.ok, false);
  assert.equal(sm.getState().phase, 'LOADING_GAME');
});

// ============================================================
// 9. Retorno correcto al mapa
// ============================================================
test('retorno al mapa desde GAME_COMPLETE', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const sm = dom.window.SoloStateMachine.create();
  sm.transitionTo('PROFILE_READY', 't');
  sm.loadGame({ id: 'test', template: 'click_selection', profile: 'non_reader' });
  sm.transitionTo('INSTRUCTIONS', 't');
  sm.transitionTo('READY', 't');
  sm.transitionTo('PLAYING', 't');
  sm.completeGame({ score: 100, correctAnswers: 5 });
  assert.equal(sm.getState().phase, 'GAME_COMPLETE');
  sm.returnToProfileMap();
  assert.equal(sm.getState().phase, 'RETURNING_TO_MAP');
});

// ============================================================
// 10. Hash de index.html no cambió
// ============================================================
test('hash de index.html no cambio tras brechas', () => {
  const src = readFileSync(resolve(__dirname, '../public/expedicion/index.html'), 'utf8');
  const hash = createHash('sha256').update(src).digest('hex').substring(0, 8).toUpperCase();
  assert.equal(hash, '6953E924');
});
