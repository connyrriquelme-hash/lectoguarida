import test, { after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { createTestDom, cleanupTestEnvironment, trackEngine } from './helpers/jsdom-test-environment.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE = resolve(__dirname, '../public/expedicion/solo');

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
  return dom;
}

function loadCore(window) {
  const files = [
    'core/audio-manager.js',
    'core/voice-guidance-ui.js',
    'core/asset-loader.js',
    'ui/resilient-game-asset.js'
  ];
  const allSrc = files.map(f => readFile(f)).join('\n');
  const fn = new Function('window', 'document', 'navigator', allSrc);
  fn(window, window.document, window.navigator);
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
    'games/non-reader/final-sound-catcher.js'
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
// 1. Carga de manifiesto válido
// ============================================================
test('loadManifest resuelve manifiesto válido', async () => {
  const dom = createDom();
  loadCore(dom.window);
  const manifestJson = JSON.stringify({
    version: 1, gameId: 'rhyme-catcher',
    assets: [{ id: 'gato', src: '/x/gato.svg', type: 'image/svg+xml', alt: 'Gato', fallback: '🐱', category: 'option' }]
  });
  dom.window.fetch = function () {
    return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, text: () => Promise.resolve(manifestJson) });
  };
  const loader = dom.window.AssetLoader.create({});
  const m = await loader.loadManifest('/x/manifest.json');
  assert.equal(m.gameId, 'rhyme-catcher');
  assert.equal(m.assets.length, 1);
});

test('rechaza manifiesto sin array de assets', async () => {
  const dom = createDom();
  loadCore(dom.window);
  dom.window.fetch = function () {
    return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, text: () => Promise.resolve(JSON.stringify({ gameId: 'x' })) });
  };
  const loader = dom.window.AssetLoader.create({});
  await assert.rejects(() => loader.loadManifest('/x.json'), /assets-not-array/);
});

test('rechaza ID duplicado', async () => {
  const dom = createDom();
  loadCore(dom.window);
  const bad = JSON.stringify({
    version: 1, gameId: 'g',
    assets: [
      { id: 'a', src: '/a.svg', type: 'image/svg+xml', alt: 'A', fallback: '🅰️' },
      { id: 'a', src: '/a2.svg', type: 'image/svg+xml', alt: 'A2', fallback: '🅰️' }
    ]
  });
  dom.window.fetch = function () { return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'application/json' }, text: () => Promise.resolve(bad) }); };
  const loader = dom.window.AssetLoader.create({});
  const r = loader.validateManifest(JSON.parse(bad));
  assert.equal(r.valid, false);
  assert.ok(r.error.indexOf('duplicate-id') === 0);
});

test('rechaza gameId incorrecto', () => {
  const dom = createDom();
  loadCore(dom.window);
  const loader = dom.window.AssetLoader.create({});
  const r = loader.validateManifest({ version: 1, gameId: 123, assets: [] });
  assert.equal(r.valid, false);
  assert.ok(r.error.indexOf('gameId') === 0);
});

test('rechaza alt obligatorio vacío', () => {
  const dom = createDom();
  loadCore(dom.window);
  const loader = dom.window.AssetLoader.create({});
  const r = loader.validateManifest({ version: 1, gameId: 'g', assets: [{ id: 'a', src: '/a.svg', type: 'image/svg+xml', alt: '  ', fallback: 'x' }] });
  assert.equal(r.valid, false);
  assert.ok(r.error.indexOf('alt-missing') === 0);
});

test('rechaza fallback obligatorio ausente', () => {
  const dom = createDom();
  loadCore(dom.window);
  const loader = dom.window.AssetLoader.create({});
  const r = loader.validateManifest({ version: 1, gameId: 'g', assets: [{ id: 'a', src: '/a.svg', type: 'image/svg+xml', alt: 'A' }] });
  assert.equal(r.valid, false);
  assert.ok(r.error.indexOf('fallback-missing') === 0);
});

test('rechaza ruta externa no autorizada', () => {
  const dom = createDom();
  loadCore(dom.window);
  const loader = dom.window.AssetLoader.create({});
  const r = loader.validateManifest({ version: 1, gameId: 'g', assets: [{ id: 'a', src: 'https://evil.com/a.svg', type: 'image/svg+xml', alt: 'A', fallback: 'x' }] });
  assert.equal(r.valid, false);
  assert.ok(r.error.indexOf('external-url') === 0);
});

test('rechaza tipo no permitido', () => {
  const dom = createDom();
  loadCore(dom.window);
  const loader = dom.window.AssetLoader.create({});
  const r = loader.validateManifest({ version: 1, gameId: 'g', assets: [{ id: 'a', src: '/a.html', type: 'text/html', alt: 'A', fallback: 'x' }] });
  assert.equal(r.valid, false);
  assert.ok(r.error.indexOf('type-not-allowed') === 0);
});

// ============================================================
// 2. Carga de asset: SVG, MIME, 404, timeout, red
// ============================================================
test('loadAsset acepta SVG permitido', async () => {
  const dom = createDom();
  loadCore(dom.window);
  dom.window.fetch = function () {
    return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'image/svg+xml' }, text: () => Promise.resolve('<svg/>') });
  };
  const loader = dom.window.AssetLoader.create({});
  const a = await loader.loadAsset({ id: 'gato', src: '/gato.svg', type: 'image/svg+xml', alt: 'Gato', fallback: '🐱' });
  assert.equal(a.ok, true);
});

test('loadAsset rechaza MIME incorrecto', async () => {
  const dom = createDom();
  loadCore(dom.window);
  dom.window.fetch = function () {
    return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'text/html' }, text: () => Promise.resolve('<svg/>') });
  };
  const loader = dom.window.AssetLoader.create({});
  const a = await loader.loadAsset({ id: 'gato', src: '/gato.svg', type: 'image/svg+xml', alt: 'Gato', fallback: '🐱' });
  assert.equal(a.ok, false);
  assert.ok(a.error.indexOf('mime-not-allowed') === 0);
});

test('loadAsset maneja 404 sin lanzar', async () => {
  const dom = createDom();
  loadCore(dom.window);
  dom.window.fetch = function () { return Promise.resolve({ ok: false, status: 404, headers: { get: () => 'text/plain' }, text: () => Promise.resolve('') }); };
  const loader = dom.window.AssetLoader.create({});
  const a = await loader.loadAsset({ id: 'x', src: '/x.svg', type: 'image/svg+xml', alt: 'X', fallback: 'x' });
  assert.equal(a.ok, false);
  assert.ok(a.error.indexOf('not-found') === 0);
});

test('loadAsset maneja red fallida sin lanzar', async () => {
  const dom = createDom();
  loadCore(dom.window);
  dom.window.fetch = function () { return Promise.reject(new Error('network down')); };
  const loader = dom.window.AssetLoader.create({});
  const a = await loader.loadAsset({ id: 'x', src: '/x.svg', type: 'image/svg+xml', alt: 'X', fallback: 'x' });
  assert.equal(a.ok, false);
});

test('loadAsset maneja timeout (abort)', async () => {
  const dom = createDom();
  loadCore(dom.window);
  dom.window.fetch = function (url, opts) {
    return new Promise(function (resolve, reject) {
      const t = setTimeout(function () { reject(new Error('timeout')); }, 50);
      if (opts && opts.signal) opts.signal.addEventListener('abort', function () { clearTimeout(t); reject(new Error('aborted')); });
    });
  };
  const loader = dom.window.AssetLoader.create({ timeout: 20 });
  const a = await loader.loadAsset({ id: 'x', src: '/x.svg', type: 'image/svg+xml', alt: 'X', fallback: 'x' });
  assert.equal(a.ok, false);
});

test('preloadAssets usa Promise.allSettled', async () => {
  const dom = createDom();
  loadCore(dom.window);
  let n = 0;
  dom.window.fetch = function () {
    n++;
    return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'image/svg+xml' }, text: () => Promise.resolve('<svg/>') });
  };
  const loader = dom.window.AssetLoader.create({});
  const results = await loader.preloadAssets([
    { id: 'a', src: '/a.svg', type: 'image/svg+xml', alt: 'A', fallback: 'x' },
    { id: 'b', src: '/b.svg', type: 'image/svg+xml', alt: 'B', fallback: 'x' }
  ]);
  assert.equal(results.length, 2);
  assert.equal(results[0].ok, true);
  assert.equal(results[1].ok, true);
});

// ============================================================
// 3. Caché y destroy
// ============================================================
test('caché por sesión devuelve asset cacheado', async () => {
  const dom = createDom();
  loadCore(dom.window);
  let calls = 0;
  dom.window.fetch = function () { calls++; return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'image/svg+xml' }, text: () => Promise.resolve('<svg/>') }); };
  const loader = dom.window.AssetLoader.create({});
  await loader.loadAsset({ id: 'a', src: '/a.svg', type: 'image/svg+xml', alt: 'A', fallback: 'x' });
  await loader.loadAsset({ id: 'a', src: '/a.svg', type: 'image/svg+xml', alt: 'A', fallback: 'x' });
  assert.equal(calls, 1, 'debe usar caché, no recargar');
});

test('clearSessionCache vacía la caché', async () => {
  const dom = createDom();
  loadCore(dom.window);
  dom.window.fetch = function () { return Promise.resolve({ ok: true, status: 200, headers: { get: () => 'image/svg+xml' }, text: () => Promise.resolve('<svg/>') }); };
  const loader = dom.window.AssetLoader.create({});
  await loader.loadAsset({ id: 'a', src: '/a.svg', type: 'image/svg+xml', alt: 'A', fallback: 'x' });
  loader.clearSessionCache();
  assert.equal(loader.getAsset('a'), null);
});

test('destroy ignora resultados pendientes', async () => {
  const dom = createDom();
  loadCore(dom.window);
  dom.window.fetch = function (url, opts) {
    return new Promise(function (resolve, reject) {
      if (opts && opts.signal) {
        opts.signal.addEventListener('abort', function () { reject(new Error('aborted')); });
      }
    });
  };
  const loader = dom.window.AssetLoader.create({ timeout: 10000 });
  const p = loader.loadAsset({ id: 'a', src: '/a.svg', type: 'image/svg+xml', alt: 'A', fallback: 'x' });
  loader.destroy();
  await p.catch(function () {});
  assert.equal(loader.destroyed, true);
});

// ============================================================
// 4. Renderer ResilientGameAsset
// ============================================================
test('renderer muestra fallback emoji si asset no cargado', () => {
  const dom = createDom();
  loadCore(dom.window);
  const container = dom.window.document.getElementById('container');
  const w = dom.window.ResilientGameAsset.render(container, { id: 'gato', src: '', type: 'image/svg+xml', alt: 'Gato', fallback: '🐱', ok: false }, {});
  assert.ok(w.classList.contains('solo-asset--fallback'));
  assert.equal(w.textContent, '🐱');
});

test('renderer muestra CSS/letra si no hay emoji', () => {
  const dom = createDom();
  loadCore(dom.window);
  const container = dom.window.document.getElementById('container');
  const w = dom.window.ResilientGameAsset.render(container, { id: 'x', src: '', type: 'image/svg+xml', alt: 'X', fallback: '', ok: false }, {});
  assert.ok(w.classList.contains('solo-asset--fallback'));
  assert.ok(w.textContent.length > 0);
});

test('renderer muestra asset cargado con alt', () => {
  const dom = createDom();
  loadCore(dom.window);
  const container = dom.window.document.getElementById('container');
  dom.window.ResilientGameAsset.render(container, { id: 'gato', src: '/gato.svg', type: 'image/svg+xml', alt: 'Gato', fallback: '🐱', ok: true }, {});
  const img = container.querySelector('img.solo-asset-img');
  assert.ok(img);
  assert.equal(img.getAttribute('alt'), 'Gato');
});

test('renderer conserva alt accesible', () => {
  const dom = createDom();
  loadCore(dom.window);
  const container = dom.window.document.getElementById('container');
  dom.window.ResilientGameAsset.render(container, { id: 'gato', src: '/gato.svg', type: 'image/svg+xml', alt: 'Gato grande', fallback: '🐱', ok: true }, {});
  const wrap = container.querySelector('.solo-asset');
  assert.equal(wrap.getAttribute('aria-label'), 'Gato grande');
});

test('renderer decorativo usa alt vacío', () => {
  const dom = createDom();
  loadCore(dom.window);
  const container = dom.window.document.getElementById('container');
  dom.window.ResilientGameAsset.render(container, { id: 'c', src: '/c.svg', type: 'image/svg+xml', alt: 'Decorativo', fallback: '🔵', ok: true }, { decorative: true });
  const img = container.querySelector('img.solo-asset-img');
  assert.equal(img.getAttribute('alt'), '');
});

test('decorate reemplaza marcador con fallback si no hay asset', () => {
  const dom = createDom();
  loadCore(dom.window);
  const container = dom.window.document.getElementById('container');
  container.innerHTML = '<span data-asset-id="gato" data-fallback="🐱"></span>';
  const loader = dom.window.AssetLoader.create({});
  dom.window.ResilientGameAsset.decorate(container, loader, {});
  const node = container.querySelector('[data-asset-id]');
  assert.ok(node.classList.contains('solo-asset--fallback'));
});

// ============================================================
// 5. SVG sin scripts
// ============================================================
test('los SVG creados no contienen script ni enlaces externos', () => {
  const dir = resolve(BASE, 'assets/non-reader');
  function walk(d) {
    let files = [];
    readdirSync(d).forEach(function (e) {
      const full = join(d, e);
      if (statSync(full).isDirectory()) files = files.concat(walk(full));
      else if (e.endsWith('.svg')) files.push(full);
    });
    return files;
  }
  const svgs = walk(dir);
  assert.ok(svgs.length >= 50);
  svgs.forEach(function (f) {
     const c = readFileSync(f, 'utf8');
    assert.equal(/script/i.test(c), false, f + ' tiene script');
    assert.equal(/foreignObject/i.test(c), false, f + ' tiene foreignObject');
    assert.equal(/onclick|onload/i.test(c), false, f + ' tiene evento inline');
    assert.equal(/viewBox/.test(c), true, f + ' sin viewBox');
  });
});

// ============================================================
// 6. Integración en los cuatro juegos
// ============================================================
const GAMES = ['rhyme-catcher', 'initial-sound-detector', 'syllable-counter', 'final-sound-catcher'];

GAMES.forEach(function (id) {
  test('manifiesto de ' + id + ' es válido y carga', async () => {
    const dom = createDom();
    loadAllSolo(dom.window);
    const gameDef = dom.window.SoloGameAdapter.getGameDef(id);
    assert.ok(gameDef);
    const manifestPath = resolve(BASE, 'games/non-reader/' + id + '/assets-manifest.json');
    const raw = readFileSync(manifestPath, 'utf8').replace(/^﻿/, '');
    const manifest = JSON.parse(raw);
    assert.equal(manifest.gameId, id);
    const loader = dom.window.AssetLoader.create({});
    const r = loader.validateManifest(manifest);
    assert.equal(r.valid, true, r.error);
  });
});

test('fallo de un asset no bloquea el juego', async () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const container = dom.window.document.getElementById('container');
  const mockLoader = dom.window.AssetLoader.create({});
  mockLoader.loadManifest = function () { return Promise.resolve({ version: 1, gameId: 'rhyme-catcher', assets: [] }); };
  mockLoader.preloadAssets = function () { return Promise.resolve([]); };
  mockLoader.getAsset = function () { return null; };
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 't', container: container, gameId: 'rhyme-catcher', assetLoader: mockLoader
  });
  adapter.loadAndStart();
  assert.ok(container.querySelectorAll('.solo-option').length > 0);
});

test('fallo completo del manifiesto no bloquea el juego', async () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const container = dom.window.document.getElementById('container');
  const mockLoader = dom.window.AssetLoader.create({});
  mockLoader.loadManifest = function () { return Promise.reject(new Error('manifest missing')); };
  mockLoader.preloadAssets = function () { return Promise.resolve([]); };
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 't', container: container, gameId: 'syllable-counter', assetLoader: mockLoader
  });
  adapter.loadAndStart();
  assert.ok(container.querySelectorAll('.solo-syllable').length > 0);
});

test('asset cargado se renderiza (mock loader con cache)', async () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const container = dom.window.document.getElementById('container');
  const mockLoader = dom.window.AssetLoader.create({});
  mockLoader.loadManifest = function () { return Promise.resolve({ version: 1, gameId: 'rhyme-catcher', assets: [] }); };
  mockLoader.preloadAssets = function () { return Promise.resolve([]); };
  const cache = { pato: { id: 'pato', src: '/pato.svg', type: 'image/svg+xml', alt: 'Pato', fallback: '🦆', ok: true } };
  mockLoader.getAsset = function (id) {
    return cache[id] || { id: id, src: '/x.svg', type: 'image/svg+xml', alt: id, fallback: id, ok: true };
  };
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 't', container: container, gameId: 'rhyme-catcher', assetLoader: mockLoader
  });
  adapter.loadAndStart();
  await adapter.assetsReady;
  dom.window.ResilientGameAsset.decorate(container, mockLoader, {});
  const imgs = container.querySelectorAll('img.solo-asset-img');
  assert.ok(imgs.length >= 1);
});

test('reducedMotion conserva fallback', () => {
  const dom = createDom();
  loadCore(dom.window);
  const container = dom.window.document.getElementById('container');
  const w = dom.window.ResilientGameAsset.render(container, { id: 'gato', src: '', type: 'image/svg+xml', alt: 'Gato', fallback: '🐱', ok: false }, { reducedMotion: true });
  assert.ok(w.classList.contains('solo-asset--fallback'));
});

test('salida limpia referencias al destruir loader', async () => {
  const dom = createDom();
  loadCore(dom.window);
  const loader = dom.window.AssetLoader.create({});
  dom.window.fetch = function (url, opts) {
    return new Promise(function (resolve, reject) {
      if (opts && opts.signal) opts.signal.addEventListener('abort', function () { reject(new Error('aborted')); });
    });
  };
  loader.loadAsset({ id: 'a', src: '/a.svg', type: 'image/svg+xml', alt: 'A', fallback: 'x' });
  loader.destroy();
  assert.equal(loader.destroyed, true);
  assert.equal(Object.keys(loader.sessionCache).length, 0);
});

test('no precarga assets de otros perfiles', async () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const container = dom.window.document.getElementById('container');
  const calls = [];
  const mockLoader = dom.window.AssetLoader.create({});
  mockLoader.loadManifest = function (url) { calls.push(url); return Promise.resolve({ version: 1, gameId: 'rhyme-catcher', assets: [] }); };
  mockLoader.preloadAssets = function () { return Promise.resolve([]); };
  dom.window.SoloGameAdapter.createEngine({ studentProfileId: 't', container: container, gameId: 'rhyme-catcher', assetLoader: mockLoader });
  await new Promise(function (r) { setTimeout(r, 10); });
  assert.equal(calls.length, 1);
  assert.ok(calls[0].indexOf('/non-reader/rhyme-catcher/') !== -1);
});

test('no modifica AudioManager', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  const src = readFile('core/audio-manager.js');
  assert.ok(src.includes('speakInstruction'));
  assert.ok(src.includes('isSpeechAvailable'));
  assert.equal(/getUserMedia\s*\(/.test(src), false, 'audio-manager no debe usar getUserMedia()');
  assert.equal(/new MediaRecorder/.test(src), false, 'audio-manager no debe usar MediaRecorder');
});

test('audio es-CL continúa funcionando con assets', () => {
  const dom = createDom();
  loadAllSolo(dom.window);
  dom.window.speechSynthesis = { getVoices: () => [{ lang: 'es-CL' }], speak: () => {}, cancel: () => {} };
  dom.window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 't', container: dom.window.document.getElementById('container'), gameId: 'rhyme-catcher'
  });
  adapter.loadAndStart();
  assert.equal(dom.window.AudioManager.speakWord('Gato'), true);
});

// ============================================================
// 7. Hashes colaborativos intactos
// ============================================================
const COLLAB = [
  ['game.js', 'C19F1841'],
  ['juego.html', '7CC05A92'],
  ['juego-v2.html', '3BAF8F16'],
  ['environment-v2.js', '584685B3'],
  ['environment-v2.css', '9E938C7F'],
  ['auth.js', '515A1249'],
  ['index.html', '22B1EEDE'],
  ['dashboard.html', 'E0D902C5']
];

COLLAB.forEach(function ([file, expected]) {
  test('hash colaborativo ' + file + ' intacto', () => {
    const src = readFileSync(resolve(__dirname, '../public/expedicion/' + file), 'utf8');
    const hash = createHash('sha256').update(src.replace(/\r\n/g, '\n')).digest('hex').substring(0, 8).toUpperCase();
    assert.equal(hash, expected);
  });
});
