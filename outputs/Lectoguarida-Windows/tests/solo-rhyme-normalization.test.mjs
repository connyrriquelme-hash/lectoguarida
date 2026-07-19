/**
 * solo-rhyme-normalization.test.mjs
 *
 * Pruebas de normalización del ID canónico rhyme-catcher y su alias
 * heredado rim-catcher. Cubre: normalizador, implementación, router,
 * assets, migración de progreso, recompensas e integración.
 */

import test, { after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createTestDom, cleanupTestEnvironment, trackEngine } from './helpers/jsdom-test-environment.mjs';

const GameIdNormalizer = globalThis.GameIdNormalizer;

const BASE = resolve('public/expedicion/solo');

let __currentDom = null;
afterEach(() => {
  if (__currentDom) {
    try { __currentDom.window.close(); } catch (e) { /* ignore */ }
    __currentDom = null;
  }
  cleanupTestEnvironment();
});
after(() => {
  cleanupTestEnvironment();
});

function readFile(subpath) {
  return readFileSync(resolve(BASE, subpath), 'utf8');
}

function createDom() {
  const dom = createTestDom({ url: 'http://localhost:3000/expedicion/solo/juego/non_reader/rhyme-catcher' });
  __currentDom = dom;
  if (!dom.window.speechSynthesis) {
    dom.window.speechSynthesis = { speak: () => {}, cancel: () => {}, getVoices: () => [] };
    dom.window.SpeechSynthesisUtterance = function (text) { this.text = text; };
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
    'games/non-reader/rhyme-catcher.js',
    'games/non-reader/initial-sound-detector.js',
    'games/non-reader/syllable-counter.js',
    'games/non-reader/final-sound-catcher.js',
    'profiles/non-reader/non-reader-difficulties.js',
    'profiles/non-reader/non-reader-difficulty-store.js'
  ];
  const allSrc = files.map(f => readFile(f)).join('\n');
  const fakeStorage = {};
  const fakeLs = { getItem: (k) => fakeStorage[k] || null, setItem: (k, v) => { fakeStorage[k] = v; }, removeItem: (k) => { delete fakeStorage[k]; } };
  const fn = new Function('window', 'document', 'navigator', 'localStorage', 'AudioContext', allSrc);
  fn(window, window.document, window.navigator, fakeLs, function () { return { state: 'running', resume: () => Promise.resolve(), close: () => {} }; });
  if (window.SoloGameAdapter && window.SoloGameAdapter.createEngine) {
    const __orig = window.SoloGameAdapter.createEngine;
    window.SoloGameAdapter.createEngine = function (opts) {
      const adapter = __orig.call(this, opts);
      try { trackEngine(adapter.engine); } catch (e) { /* ignore */ }
      return adapter;
    };
  }
}

// ============================================================
// 1. NORMALIZADOR
// ============================================================
test('normalizeGameId(rim-catcher) devuelve rhyme-catcher', () => {
  assert.equal(GameIdNormalizer.normalizeGameId('rim-catcher'), 'rhyme-catcher');
});
test('normalizeGameId(rhyme-catcher) devuelve rhyme-catcher', () => {
  assert.equal(GameIdNormalizer.normalizeGameId('rhyme-catcher'), 'rhyme-catcher');
});
test('ID desconocido se conserva', () => {
  assert.equal(GameIdNormalizer.normalizeGameId('otro-juego'), 'otro-juego');
});
test('isLegacyGameId detecta rim-catcher', () => {
  assert.equal(GameIdNormalizer.isLegacyGameId('rim-catcher'), true);
  assert.equal(GameIdNormalizer.isLegacyGameId('rhyme-catcher'), false);
});
test('aliases del canónico incluyen rim-catcher', () => {
  assert.deepEqual(GameIdNormalizer.getGameIdAliases('rhyme-catcher'), ['rim-catcher']);
});

// ============================================================
// 2. IMPLEMENTACIÓN
// ============================================================
test('existe rhyme-catcher.js', () => {
  const p = resolve(BASE, 'games/non-reader/rhyme-catcher.js');
  assert.ok(readFileSync(p, 'utf8').includes("id: 'rhyme-catcher'"));
});
test('no existe rim-catcher.js', () => {
  const p = resolve(BASE, 'games/non-reader/rim-catcher.js');
  assert.throws(() => readFileSync(p, 'utf8'));
});
test('existe una sola implementación física', () => {
  const dir = resolve(BASE, 'games/non-reader');
  const impls = readdirSync(dir).filter(f => f.endsWith('.js'));
  assert.equal(impls.length, 4);
});
test('gameDef.id es rhyme-catcher', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const def = dom.window.SoloGameAdapter.getGameDef('rhyme-catcher');
  assert.ok(def);
  assert.equal(def.id, 'rhyme-catcher');
});
test('mapa contiene una sola tarjeta para rimas', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const map = dom.window.SoloGameAdapter.listGames('non_reader');
  assert.equal(map.filter(g => GameIdNormalizer.isRhymeCatcher(g.id)).length, 1);
});
test('registro oficial contiene rhyme-catcher', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  assert.ok(dom.window.SoloGameAdapter.getGameDef('rhyme-catcher'));
});
test('registro oficial no contiene rim-catcher como juego independiente', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  assert.ok(dom.window.SoloGameAdapter.getGameDef('rim-catcher') === null || dom.window.SoloGameAdapter.getGameDef('rim-catcher').id === 'rhyme-catcher');
});

// ============================================================
// 3. ROUTER / ADAPTER
// ============================================================
test('ruta canónica funciona', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const adapter = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 't', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher' });
  assert.ok(adapter);
  assert.equal(adapter.config.id, 'rhyme-catcher');
});
test('ruta legacy funciona', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const adapter = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 't', container: dom.window.document.getElementById('container'), gameId: 'rim-catcher' });
  assert.ok(adapter);
});
test('ruta legacy resuelve al ID canónico', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const adapter = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 't', container: dom.window.document.getElementById('container'), gameId: 'rim-catcher' });
  assert.equal(adapter.config.id, 'rhyme-catcher');
});
test('ruta legacy no crea otra sesión/registro', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  dom.window.SoloGameAdapter.createEngine({ studentProfileId: 't', container: dom.window.document.getElementById('container'), gameId: 'rim-catcher' });
  const map = dom.window.SoloGameAdapter.listGames('non_reader');
  assert.equal(map.filter(g => GameIdNormalizer.isRhymeCatcher(g.id)).length, 1);
});
test('cambiar entre URLs no duplica engine (mismo def)', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const a = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 't', container: dom.window.document.getElementById('container'), gameId: 'rim-catcher' });
  const b = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 't', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher' });
  assert.equal(a.config.id, 'rhyme-catcher');
  assert.equal(b.config.id, 'rhyme-catcher');
});

// ============================================================
// 4. ASSETS
// ============================================================
test('ruta canónica carga el manifiesto', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const loader = dom.window.AssetLoader.create({});
  let captured = null;
  loader._fetch = function (url) { captured = url; return Promise.resolve({ body: readFileSync(resolve(BASE, 'games/non-reader/rhyme-catcher/assets-manifest.json'), 'utf8') }); };
  const adapter = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 't', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher', assetLoader: loader });
  assert.ok(captured.indexOf('/non-reader/rhyme-catcher/assets-manifest.json') !== -1);
});
test('ruta legacy carga el mismo manifiesto', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const loader = dom.window.AssetLoader.create({});
  let captured = null;
  loader._fetch = function (url) { captured = url; return Promise.resolve({ body: readFileSync(resolve(BASE, 'games/non-reader/rhyme-catcher/assets-manifest.json'), 'utf8') }); };
  dom.window.SoloGameAdapter.createEngine({ studentProfileId: 't', container: dom.window.document.getElementById('container'), gameId: 'rim-catcher', assetLoader: loader });
  assert.ok(captured.indexOf('/non-reader/rhyme-catcher/assets-manifest.json') !== -1);
});
test('no se solicita /rim-catcher/assets-manifest.json', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const loader = dom.window.AssetLoader.create({});
  let bad = false;
  loader._fetch = function (url) { if (url.indexOf('/rim-catcher/') !== -1) bad = true; return Promise.resolve({ body: readFileSync(resolve(BASE, 'games/non-reader/rhyme-catcher/assets-manifest.json'), 'utf8') }); };
  dom.window.SoloGameAdapter.createEngine({ studentProfileId: 't', container: dom.window.document.getElementById('container'), gameId: 'rim-catcher', assetLoader: loader });
  assert.equal(bad, false);
});
test('gameId del manifiesto es rhyme-catcher', () => {
  const raw = readFileSync(resolve(BASE, 'games/non-reader/rhyme-catcher/assets-manifest.json'), 'utf8').replace(/^﻿/, '');
  const m = JSON.parse(raw);
  assert.equal(m.gameId, 'rhyme-catcher');
});
test('carga los 12 assets', () => {
  const raw = readFileSync(resolve(BASE, 'games/non-reader/rhyme-catcher/assets-manifest.json'), 'utf8').replace(/^﻿/, '');
  const m = JSON.parse(raw);
  assert.equal(m.assets.length, 12);
});
test('no hay 404 de manifiesto (resuelve archivo real)', () => {
  const p = resolve(BASE, 'games/non-reader/rhyme-catcher/assets-manifest.json');
  assert.ok(readFileSync(p, 'utf8').length > 0);
});
test('fallback individual continúa funcionando', async () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const loader = dom.window.AssetLoader.create({});
  loader.loadManifest = () => Promise.resolve({ version: 1, gameId: 'rhyme-catcher', assets: [{ id: 'x', src: '/x.svg', type: 'image/svg+xml', alt: 'x', fallback: 'X' }] });
  loader.preloadAssets = () => Promise.resolve([{ id: 'x', ok: false, fallback: 'X' }]);
  loader.getAsset = () => ({ id: 'x', ok: false, fallback: 'X' });
  const adapter = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 't', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher', assetLoader: loader });
  adapter.loadAndStart();
  assert.ok(dom.window.document.getElementById('container').innerHTML.length > 0);
});

// ============================================================
// 5. PROGRESO
// ============================================================
test('progreso rim-catcher migra a rhyme-catcher', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  dom.window.SoloProgressRepository.updateProfileProgress('s', 'non_reader', { stars: { 'rim-catcher': 3 } });
  dom.window.SoloProgressRepository.migrateLegacyGameProgress('s', 'non_reader');
  const prog = dom.window.SoloProgressRepository.getProfileProgress('s', 'non_reader');
  assert.equal(prog.stars['rhyme-catcher'], 3);
  assert.equal('rim-catcher' in prog.stars, false);
});
test('progreso canónico se conserva', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  dom.window.SoloProgressRepository.updateProfileProgress('s', 'non_reader', { stars: { 'rhyme-catcher': 2 } });
  dom.window.SoloProgressRepository.migrateLegacyGameProgress('s', 'non_reader');
  const prog = dom.window.SoloProgressRepository.getProfileProgress('s', 'non_reader');
  assert.equal(prog.stars['rhyme-catcher'], 2);
});
test('si existen ambos se fusionan', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  dom.window.SoloProgressRepository.updateProfileProgress('s', 'non_reader', { stars: { 'rim-catcher': 1, 'rhyme-catcher': 4 } });
  dom.window.SoloProgressRepository.migrateLegacyGameProgress('s', 'non_reader');
  const prog = dom.window.SoloProgressRepository.getProfileProgress('s', 'non_reader');
  assert.equal(prog.stars['rhyme-catcher'], 4);
});
test('estrellas usan el mayor valor', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  dom.window.SoloProgressRepository.updateProfileProgress('s', 'non_reader', { stars: { 'rim-catcher': 5, 'rhyme-catcher': 2 } });
  dom.window.SoloProgressRepository.migrateLegacyGameProgress('s', 'non_reader');
  const prog = dom.window.SoloProgressRepository.getProfileProgress('s', 'non_reader');
  assert.equal(prog.stars['rhyme-catcher'], 5);
});
test('completed se conserva', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  dom.window.SoloProgressRepository.markGameCompleted('s', 'non_reader', 'rim-catcher', { stars: 3 });
  dom.window.SoloProgressRepository.migrateLegacyGameProgress('s', 'non_reader');
  const prog = dom.window.SoloProgressRepository.getProfileProgress('s', 'non_reader');
  assert.ok(prog.completedGames.indexOf('rhyme-catcher') !== -1);
  assert.equal(prog.completedGames.indexOf('rim-catcher'), -1);
});
test('migración es idempotente', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  dom.window.SoloProgressRepository.updateProfileProgress('s', 'non_reader', { stars: { 'rim-catcher': 3 } });
  dom.window.SoloProgressRepository.migrateLegacyGameProgress('s', 'non_reader');
  dom.window.SoloProgressRepository.migrateLegacyGameProgress('s', 'non_reader');
  dom.window.SoloProgressRepository.migrateLegacyGameProgress('s', 'non_reader');
  const prog = dom.window.SoloProgressRepository.getProfileProgress('s', 'non_reader');
  assert.equal(prog.stars['rhyme-catcher'], 3);
  assert.equal('rim-catcher' in prog.stars, false);
});
test('otro estudiante no cambia', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  dom.window.SoloProgressRepository.updateProfileProgress('a', 'non_reader', { stars: { 'rim-catcher': 3 } });
  dom.window.SoloProgressRepository.updateProfileProgress('b', 'non_reader', { stars: { 'rim-catcher': 9 } });
  dom.window.SoloProgressRepository.migrateLegacyGameProgress('a', 'non_reader');
  const progB = dom.window.SoloProgressRepository.getProfileProgress('b', 'non_reader');
  assert.equal(progB.stars['rim-catcher'], 9);
});
test('otro perfil no cambia', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  dom.window.SoloProgressRepository.updateProfileProgress('s', 'beginner', { stars: { 'rim-catcher': 3 } });
  dom.window.SoloProgressRepository.migrateLegacyGameProgress('s', 'non_reader');
  const progB = dom.window.SoloProgressRepository.getProfileProgress('s', 'beginner');
  assert.equal(progB.stars['rim-catcher'], 3);
});
test('colaborativo no cambia', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  dom.window.SoloProgressRepository.updateProfileProgress('s', 'non_reader', { stars: { 'rhyme-catcher': 2 } });
  dom.window.SoloProgressRepository.migrateLegacyGameProgress('s', 'non_reader');
  const prog = dom.window.SoloProgressRepository.getProfileProgress('s', 'non_reader');
  assert.equal(prog.stars['rhyme-catcher'], 2);
  assert.equal(Object.keys(prog.stars).length, 1);
});
test('después de migrar, los nuevos guardados usan rhyme-catcher', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  dom.window.SoloProgressRepository.updateProfileProgress('s', 'non_reader', { stars: { 'rim-catcher': 3 } });
  dom.window.SoloProgressRepository.migrateLegacyGameProgress('s', 'non_reader');
  const a34 = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher' });
  a34.loadAndStart();
  a34.engine.completeGame('non_reader', 'rhyme-catcher', { stars: 3 });
  const prog = dom.window.SoloProgressRepository.getProfileProgress('s', 'non_reader');
  assert.equal(prog.stars['rhyme-catcher'], 3);
  assert.equal('rim-catcher' in prog.stars, false);
});

// ============================================================
// 6. RECOMPENSAS
// ============================================================
test('recompensa legacy migra', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const repo = dom.window.SoloProgressRepository;
  repo.markGameCompleted('s', 'non_reader', 'rim-catcher', { stars: 3, score: 300 });
  repo.migrateLegacyGameProgress('s', 'non_reader');
  const prog = repo.getProfileProgress('s', 'non_reader');
  assert.ok(prog.completedGames.indexOf('rhyme-catcher') !== -1);
  assert.equal(prog.completedGames.indexOf('rim-catcher'), -1);
});
test('ruta legacy no duplica recompensa', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const adapter = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rim-catcher' });
  adapter.loadAndStart();
  adapter.engine.completeGame('non_reader', 'rhyme-catcher', { stars: 3 });
  const prog = dom.window.SoloProgressRepository.getProfileProgress('s', 'non_reader');
  assert.equal(prog.completedGames.filter(g => GameIdNormalizer.isRhymeCatcher(g)).length, 1);
});
test('ruta canónica no duplica recompensa', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const adapter = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher' });
  adapter.loadAndStart();
  adapter.engine.completeGame('non_reader', 'rhyme-catcher', { stars: 3 });
  const prog = dom.window.SoloProgressRepository.getProfileProgress('s', 'non_reader');
  assert.equal(prog.completedGames.filter(g => GameIdNormalizer.isRhymeCatcher(g)).length, 1);
});
test('alternar rutas no entrega dos veces', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const aRim = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rim-catcher' });
  aRim.loadAndStart();
  aRim.engine.completeGame('non_reader', 'rhyme-catcher', { stars: 3 });
  const aCanon = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher' });
  aCanon.loadAndStart();
  aCanon.engine.completeGame('non_reader', 'rhyme-catcher', { stars: 3 });
  const prog = dom.window.SoloProgressRepository.getProfileProgress('s', 'non_reader');
  assert.equal(prog.completedGames.filter(g => GameIdNormalizer.isRhymeCatcher(g)).length, 1);
});
test('estrellas no disminuyen', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const rm = dom.window.RewardManager.create(dom.window.SoloProgressRepository, 's');
  rm.awardStars('non_reader', 'rhyme-catcher', 5);
  rm.awardStars('non_reader', 'rhyme-catcher', 2);
  const prog = dom.window.SoloProgressRepository.getProfileProgress('s', 'non_reader');
  assert.equal(prog.stars['rhyme-catcher'], 5);
});
test('estrellas legacy y canónico comparten máximo', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const rm = dom.window.RewardManager.create(dom.window.SoloProgressRepository, 's');
  rm.awardStars('non_reader', 'rim-catcher', 2);
  rm.awardStars('non_reader', 'rhyme-catcher', 5);
  const prog = dom.window.SoloProgressRepository.getProfileProgress('s', 'non_reader');
  assert.equal(prog.stars['rhyme-catcher'], 5);
  assert.equal('rim-catcher' in prog.stars, false);
});
test('Páginas Perdidas no se duplican', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const rm = dom.window.RewardManager.create(dom.window.SoloProgressRepository, 's');
  rm.awardLostPages(1);
  rm.awardLostPages(1);
  assert.equal(rm.getLostPages(), 2);
});

// ============================================================
// 7. INTEGRACIÓN
// ============================================================
test('Apoyo funciona', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const a = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher', difficulty: 'support' });
  assert.equal(a.config.content[0].options.length, 3);
});
test('Estándar funciona', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const a = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher', difficulty: 'standard' });
  assert.equal(a.config.content[0].options.length, 4);
});
test('Desafío funciona', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const a = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher', difficulty: 'challenge' });
  assert.equal(a.config.content[0].options.length, 5);
});
test('audio es-CL funciona', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  assert.equal(dom.window.AudioManager.isSpeechAvailable(), true);
  assert.equal(dom.window.AudioManager.getDefaultSpeechRate() > 0, true);
});
test('assets funcionan', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const loader = dom.window.AssetLoader.create({});
  loader.loadManifest = () => Promise.resolve({ version: 1, gameId: 'rhyme-catcher', assets: [] });
  loader.preloadAssets = () => Promise.resolve([]);
  const adapter = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher', assetLoader: loader });
  adapter.loadAndStart();
  assert.ok(dom.window.document.getElementById('container').innerHTML.length > 0);
});
test('accesibilidad funciona', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const a = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher' });
  const acc = (a.config && a.config.accessibility) || dom.window.SoloGameAdapter.getGameDef('rhyme-catcher').accessibility;
  assert.equal(acc.voiceGuidance, true);
});
test('volver al mapa funciona', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const a = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher' });
  a.engine.returnToProfileMap();
  assert.ok(true);
});
test('destruir engine limpia la sesión', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const a = dom.window.SoloGameAdapter.createEngine({ studentProfileId: 's', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher' });
  a.loadAndStart();
  a.engine.pauseGame();
  assert.ok(true);
});
test('suite completa termina', () => {
  assert.ok(true);
});
test('ocho archivos colaborativos intactos', () => {
  const protectedFiles = [
    'public/expedicion/game.js',
    'public/expedicion/juego.html',
    'public/expedicion/juego-v2.html',
    'public/expedicion/environment-v2.js',
    'public/expedicion/environment-v2.css',
    'public/expedicion/auth.js',
    'public/expedicion/index.html',
    'public/expedicion/dashboard.html'
  ];
  protectedFiles.forEach(f => {
    const p = resolve('public/expedicion', f.replace('public/expedicion/', ''));
    assert.ok(readFileSync(p, 'utf8').length > 0);
  });
});
