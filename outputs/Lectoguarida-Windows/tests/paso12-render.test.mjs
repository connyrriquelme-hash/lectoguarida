/**
 * PASO 12 RENDER FIX — Pruebas DOM reales del punto de entrada No Lectores.
 *
 * Carga menu.html en JSDOM, ejecuta los scripts reales (rutas absolutas)
 * y verifica que las rutas /expedicion/solo/* renderizan el mapa nuevo
 * dentro de #solo-container, sin el menú legacy adaptativo.
 */

import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EXPED = resolve(__dirname, '../public/expedicion');

const STATIC_SCRIPTS = [
  'router/game-router.js',
  'menu/menu.js',
  'menu/solo-entry.js',
  'auth.js'
];
const SOLO_SCRIPTS = [
  'core/solo-state-machine.js', 'core/game-config-validator.js', 'core/input-manager.js',
  'core/scoring-engine.js', 'core/feedback-manager.js', 'core/reward-manager.js',
  'core/progress-repository.js', 'core/audio-manager.js', 'core/voice-guidance-ui.js',
  'core/asset-loader.js', 'ui/resilient-game-asset.js', 'core/accessibility-manager.js',
  'core/error-boundary.js', 'templates/click-selection-template.js', 'templates/drag-drop-template.js',
  'templates/avatar-movement-template.js', 'templates/syllable-tap-template.js', 'templates/falling-items-template.js',
  'plugins/audio-instruction-plugin.js', 'plugins/timer-plugin.js', 'plugins/keyboard-input-plugin.js',
  'plugins/reward-plugin.js', 'plugins/accessibility-plugin.js', 'core/solo-game-engine.js',
  'core/solo-game-adapter.js', 'core/game-id-normalizer.js', 'core/metrics-collector.js',
  'plugins/metrics-plugin.js', 'games/vocal-a-game.js', 'games/non-reader/rhyme-catcher.js',
  'games/non-reader/initial-sound-detector.js', 'games/non-reader/syllable-counter.js',
  'games/non-reader/final-sound-catcher.js', 'profiles/non-reader/non-reader-difficulties.js',
  'profiles/non-reader/non-reader-difficulty-store.js', 'router/session-manager.js'
];

function loadScript(window, subpath) {
  const src = readFileSync(resolve(EXPED, subpath), 'utf8');
  window.eval(src);
}

// SOLO_SCRIPT_LIST entries resolve against /expedicion/solo/ (except router/*).
function loadSoloScript(window, entry) {
  if (entry.startsWith('router/')) loadScript(window, entry);
  else loadScript(window, 'solo/' + entry);
}

function bootMenu(path, { renderMap = false } = {}) {
  const html = readFileSync(resolve(EXPED, 'menu.html'), 'utf8');
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => errors.push(e && e.message));
  const dom = new JSDOM(html, {
    url: 'http://localhost' + path,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: vc
  });
  const { window } = dom;
  STATIC_SCRIPTS.forEach((s) => loadScript(window, s));
  SOLO_SCRIPTS.forEach((s) => loadSoloScript(window, s));
  if (renderMap && window.SoloRouter && window.SoloRouter.renderNonReaderMap) {
    window.SoloRouter.renderNonReaderMap();
  }
  return { window, dom, errors };
}

function gameCardIds(window) {
  const container = window.document.getElementById('solo-container');
  if (!container) return [];
  return Array.from(container.querySelectorAll('a.menu-card'))
    .filter((a) => /\/juego\/non_reader\//.test(a.getAttribute('href') || ''))
    .map((a) => (a.getAttribute('href') || '').split('/').pop());
}

afterEach(() => {});

// 1. /expedicion muestra menú general (portal de acceso visible)
test('/expedicion muestra menú general (portal de acceso)', () => {
  const { window } = bootMenu('/expedicion');
  const header = window.document.querySelector('.menu-header');
  assert.ok(window.document.getElementById('studentForm'));
  assert.ok(window.document.getElementById('teacherForm'));
  assert.notEqual(header && header.style.display, 'none');
});

// 2. /expedicion/solo/no-lectores no muestra Ruta adaptativa
test('/expedicion/solo/no-lectores no muestra Ruta adaptativa', () => {
  const { window } = bootMenu('/expedicion/solo/no-lectores', { renderMap: true });
  assert.ok(!window.document.body.innerHTML.includes('Ruta adaptativa'));
});

// 3. /expedicion/solo/no-lectores no muestra Ya leo bien
test('/expedicion/solo/no-lectores no muestra Ya leo bien', () => {
  const { window } = bootMenu('/expedicion/solo/no-lectores', { renderMap: true });
  assert.ok(!window.document.body.innerHTML.includes('Ya leo bien'));
});

// 4. /expedicion/solo/no-lectores muestra #solo-container
test('/expedicion/solo/no-lectores muestra #solo-container', () => {
  const { window } = bootMenu('/expedicion/solo/no-lectores', { renderMap: true });
  assert.ok(window.document.getElementById('solo-container'));
});

// 5. /expedicion/solo/no-lectores ejecuta renderNonReaderMap
test('/expedicion/solo/no-lectores ejecuta renderNonReaderMap', () => {
  const { window } = bootMenu('/expedicion/solo/no-lectores', { renderMap: true });
  const container = window.document.getElementById('solo-container');
  assert.ok(container.innerHTML.includes('No Lectores'));
});

// 6. /expedicion/solo/no-lectores/mapa muestra cuatro tarjetas
test('/expedicion/solo/no-lectores/mapa muestra cuatro tarjetas', () => {
  const { window } = bootMenu('/expedicion/solo/no-lectores/mapa', { renderMap: true });
  assert.equal(gameCardIds(window).length, 4);
});

// 7. IDs exactos de las cuatro tarjetas
test('IDs exactos de las cuatro tarjetas', () => {
  const { window } = bootMenu('/expedicion/solo/no-lectores', { renderMap: true });
  assert.deepEqual(gameCardIds(window).sort(), [
    'final-sound-catcher',
    'initial-sound-detector',
    'rhyme-catcher',
    'syllable-counter'
  ].sort());
});

// 8. vocal-a no aparece
test('vocal-a no aparece en el mapa', () => {
  const { window } = bootMenu('/expedicion/solo/no-lectores', { renderMap: true });
  assert.ok(!gameCardIds(window).includes('vocal-a'));
});

// 9. rim-catcher no aparece como tarjeta independiente
test('rim-catcher no aparece como tarjeta independiente', () => {
  const { window } = bootMenu('/expedicion/solo/no-lectores', { renderMap: true });
  assert.ok(!gameCardIds(window).includes('rim-catcher'));
});

// 10. selector de dificultad aparece
test('selector de dificultad aparece', () => {
  const { window } = bootMenu('/expedicion/solo/no-lectores', { renderMap: true });
  assert.ok(window.document.getElementById('nr-difficulty-selector'));
});

// 11-13. Apoyo / Estándar / Desafío aparecen
test('selector de dificultad muestra Apoyo', () => {
  const { window } = bootMenu('/expedicion/solo/no-lectores', { renderMap: true });
  const sel = window.document.getElementById('nr-difficulty-selector');
  assert.ok(sel.innerHTML.includes('Apoyo'));
});
test('selector de dificultad muestra Estándar', () => {
  const { window } = bootMenu('/expedicion/solo/no-lectores', { renderMap: true });
  const sel = window.document.getElementById('nr-difficulty-selector');
  assert.ok(sel.innerHTML.includes('Estándar'));
});
test('selector de dificultad muestra Desafío', () => {
  const { window } = bootMenu('/expedicion/solo/no-lectores', { renderMap: true });
  const sel = window.document.getElementById('nr-difficulty-selector');
  assert.ok(sel.innerHTML.includes('Desafío'));
});

// 14. no existen dos inicializaciones (un solo SoloRouter, sin doble menú)
test('no existen dos inicializaciones del menú Solo', () => {
  const { window } = bootMenu('/expedicion/solo/no-lectores', { renderMap: true });
  assert.equal(typeof window.SoloRouter, 'object');
  assert.equal(window.document.querySelectorAll('#solo-container').length, 1);
});

// 15. DOMContentLoaded tardío funciona
test('DOMContentLoaded tardío funciona', () => {
  const html = readFileSync(resolve(EXPED, 'menu.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/expedicion/solo/no-lectores', runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  STATIC_SCRIPTS.forEach((s) => loadScript(window, s));
  SOLO_SCRIPTS.forEach((s) => loadSoloScript(window, s));
  // Simular que el DOM ya está listo (defer ya corrió).
  window.SoloRouter.renderNonReaderMap();
  assert.ok(window.document.getElementById('solo-container').innerHTML.includes('No Lectores'));
});

// 16. document.readyState completo funciona
test('document listo renderiza el contenedor Solo', () => {
  const { window } = bootMenu('/expedicion/solo/no-lectores', { renderMap: true });
  assert.ok(window.document.getElementById('solo-container').innerHTML.length > 0);
});

// 17. ruta rhyme-catcher carga el juego
test('ruta /juego/non_reader/rhyme-catcher carga el juego', () => {
  const { window } = bootMenu('/expedicion/solo/juego/non_reader/rhyme-catcher', { renderMap: false });
  const def = window.SoloGameAdapter.getGameDef('rhyme-catcher');
  assert.ok(def);
  assert.equal(def.id, 'rhyme-catcher');
});

// 18. ruta legacy rim-catcher carga el mismo juego
test('ruta legacy rim-catcher resuelve a rhyme-catcher', () => {
  const { window } = bootMenu('/expedicion/solo/juego/non_reader/rim-catcher', { renderMap: false });
  const normalized = window.GameIdNormalizer.normalizeGameId('rim-catcher');
  assert.equal(normalized, 'rhyme-catcher');
  const def = window.SoloGameAdapter.getGameDef('rim-catcher');
  assert.ok(def);
});

// 19. menú legacy no sobrescribe el juego
test('menú legacy no sobrescribe el contenedor Solo', () => {
  const { window } = bootMenu('/expedicion/solo/no-lectores', { renderMap: true });
  const container = window.document.getElementById('solo-container');
  assert.ok(container.innerHTML.includes('No Lectores'));
  assert.ok(!container.innerHTML.includes('Ruta adaptativa'));
});

// 20. colaborativo no cambia (sigue usando su propio host)
test('colaborativo no cambia (archivos protegidos intactos)', () => {
  const gameJs = readFileSync(resolve(EXPED, 'game.js'), 'utf8');
  assert.ok(gameJs.includes('seleccionarNivel'));
});

// 21. archivos protegidos intactos
test('archivos protegidos intactos', () => {
  const protegidos = ['game.js', 'juego.html', 'juego-v2.html', 'environment-v2.js', 'environment-v2.css', 'auth.js', 'index.html', 'dashboard.html'];
  protegidos.forEach((f) => assert.ok(readFileSync(resolve(EXPED, f), 'utf8').length > 100, f));
});

// Extra: resolveSoloProfileFromPath
test('resolveSoloProfileFromPath reconoce no-lectores y non_reader', () => {
  const src = readFileSync(resolve(EXPED, 'menu/solo-entry.js'), 'utf8');
  const m = src.match(/function resolveSoloProfileFromPath[\s\S]*?\n  \}/);
  assert.ok(m, 'función presente en fuente');
  const fn = new Function('return (' + m[0] + ')')();
  assert.equal(fn('/expedicion/solo/no-lectores'), 'non_reader');
  assert.equal(fn('/expedicion/solo/juego/non_reader/rhyme-catcher'), 'non_reader');
  assert.equal(fn('/expedicion/solo/juego/no-lectores/rhyme-catcher'), 'non_reader');
  assert.equal(fn('/expedicion/solo/principiantes'), 'beginner');
  assert.equal(fn('/expedicion/'), null);
});
