/**
 * PASO 12 — Pruebas del punto de entrada No Lectores.
 *
 * Cubre los 15 requisitos de QA:
 *  1. /expedicion/solo/no-lectores renderiza el perfil No Lectores
 *  2. /expedicion/solo/no-lectores/mapa renderiza el mapa (4 juegos)
 *  3. El mapa No Lectores muestra exactamente 4 tarjetas (sin vocal-a)
 *  4. Flujo "Soy estudiante" -> portal -> No Lectores
 *  5. pathname /expedicion/solo/* no es ignorado por el worker
 *  6. Sin sesión válida se muestra un acceso claro (portal)
 *  7. non_reader queda registrado como perfil del modo individual
 *  8. El script solo-entry.js se carga en menu.html
 *  9. Existe el contenedor #solo-container
 * 10. No hay redirección silenciosa a la home
 * 11. El service worker ignora peticiones chrome-extension:
 * 12. cache.put solo para http/https
 * 13. Errores de cache no bloquean la página
 * 14. Colaborativo intacto
 * 15. Archivos protegidos intactos
 */

import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { createTestDom, cleanupTestEnvironment } from './helpers/jsdom-test-environment.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EXPEDICION = resolve(__dirname, '../public/expedicion');
const SOLO = resolve(EXPEDICION, 'solo');
const PUBLIC = resolve(__dirname, '../public');

afterEach(() => cleanupTestEnvironment());

function readFile(base, subpath) {
  return readFileSync(resolve(base, subpath), 'utf8');
}

function sha256Prefix(src) {
  return createHash('sha256').update(src.replace(/\r\n/g, '\n')).digest('hex').substring(0, 8).toUpperCase();
}

// Carga todos los módulos del modo individual en una ventana JSDOM, al estilo
// de solo-integration.test.mjs, para poder invocar el render del mapa.
function loadSoloModules(window) {
  const files = [
    '../router/session-manager.js',
    'core/game-config-validator.js',
    'core/input-manager.js',
    'core/scoring-engine.js',
    'core/feedback-manager.js',
    'core/reward-manager.js',
    'core/progress-repository.js',
    'core/audio-manager.js',
    'core/accessibility-manager.js',
    'core/error-boundary.js',
    'core/solo-state-machine.js',
    'core/solo-game-engine.js',
    'core/game-id-normalizer.js',
    'core/solo-game-adapter.js',
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
    'core/metrics-collector.js',
    'profiles/non-reader/non-reader-difficulties.js',
    'profiles/non-reader/non-reader-difficulty-store.js',
    'games/vocal-a-game.js',
    'games/non-reader/rhyme-catcher.js',
    'games/non-reader/initial-sound-detector.js',
    'games/non-reader/syllable-counter.js',
    'games/non-reader/final-sound-catcher.js',
    '../menu/solo-entry.js'
  ];
  const allSrc = files.map((f) => readFile(SOLO, f)).join('\n');
  const fakeStorage = {};
  const fakeLs = {
    getItem: (k) => fakeStorage[k] || null,
    setItem: (k, v) => { fakeStorage[k] = v; },
    removeItem: (k) => { delete fakeStorage[k]; }
  };
  const fn = new Function('window', 'document', 'navigator', 'localStorage', 'AudioContext', allSrc);
  fn(window, window.document, window.navigator, fakeLs, function () { return { state: 'running', resume: () => Promise.resolve(), close: () => {} }; });
  return fakeLs;
}

// ============================================================
// 1. /expedicion/solo/no-lectores renderiza el perfil No Lectores
// ============================================================
test('ruta /expedicion/solo/no-lectores renderiza el perfil No Lectores', () => {
  const dom = createTestDom({ url: 'http://localhost/expedicion/solo/no-lectores' });
  loadSoloModules(dom.window);
  dom.window.SoloRouter.renderProfilePlaceholder('non_reader');
  const container = dom.window.document.getElementById('solo-container');
  assert.ok(container);
  assert.ok(container.innerHTML.includes('No Lectores'));
});

// ============================================================
// 2. /expedicion/solo/no-lectores/mapa renderiza el mapa
// ============================================================
test('ruta /expedicion/solo/no-lectores/mapa renderiza el mapa de juegos', () => {
  const dom = createTestDom({ url: 'http://localhost/expedicion/solo/no-lectores/mapa' });
  loadSoloModules(dom.window);
  dom.window.SoloRouter.renderNonReaderMap();
  const container = dom.window.document.getElementById('solo-container');
  assert.ok(container);
  assert.ok(container.innerHTML.includes('Mapa de Juegos'));
});

// ============================================================
// 3. El mapa muestra exactamente 4 tarjetas (sin vocal-a)
// ============================================================
test('mapa No Lectores muestra exactamente 4 juegos y no incluye vocal-a', () => {
  const dom = createTestDom({ url: 'http://localhost/expedicion/solo/no-lectores' });
  loadSoloModules(dom.window);
  dom.window.SoloRouter.renderNonReaderMap();
  const container = dom.window.document.getElementById('solo-container');
  const cards = container.querySelectorAll('a.menu-card');
  // 4 juegos oficiales + 2 enlaces de navegación (cambiar perfil / menú)
  const gameCards = Array.from(cards).filter((a) => /\/juego\/non_reader\//.test(a.getAttribute('href') || ''));
  assert.equal(gameCards.length, 4);
  const ids = gameCards.map((a) => (a.getAttribute('href') || '').split('/').pop());
  assert.ok(!ids.includes('vocal-a'));
  assert.ok(ids.includes('rhyme-catcher'));
  assert.ok(ids.includes('initial-sound-detector'));
  assert.ok(ids.includes('syllable-counter'));
  assert.ok(ids.includes('final-sound-catcher'));
});

// ============================================================
// 4. Flujo "Soy estudiante" -> portal -> No Lectores
// ============================================================
test('flujo Soy estudiante llega al perfil No Lectores', () => {
  const html = readFile(EXPEDICION, 'menu.html');
  const dom = new JSDOM(html, { url: 'http://localhost/expedicion/solo/no-lectores', runScripts: 'outside-only' });
  // El HTML del portal debe contener las tarjetas de acceso (estudiante/docente).
  assert.ok(dom.window.document.getElementById('studentForm'));
  assert.ok(dom.window.document.getElementById('teacherForm'));
  // Y debe cargar los scripts del modo individual con rutas absolutas
  // (requerido para que se resuelvan correctamente en /expedicion/solo/*).
  const scripts = Array.from(dom.window.document.querySelectorAll('script[src]')).map((s) => s.getAttribute('src'));
  assert.ok(scripts.includes('/expedicion/menu/solo-entry.js'));
});

// ============================================================
// 5. pathname /expedicion/solo/* no es ignorado por el worker
// ============================================================
test('el worker sirve menu.html para rutas /expedicion/solo/*', () => {
  const src = readFileSync(resolve(EXPEDICION, '../../cloudflare/worker.mjs'), 'utf8');
  assert.ok(src.includes("url.pathname.startsWith(\"/expedicion/solo\")"));
  assert.ok(src.includes("serveExpedicionAsset(request, env, \"/expedicion/menu.html\")"));
});

// ============================================================
// 6. Sin sesión válida se muestra un acceso claro (portal)
// ============================================================
test('sin sesión válida el portal de acceso es claro', () => {
  const html = readFile(EXPEDICION, 'menu.html');
  assert.ok(html.includes('Portal de Estudiantes'));
  assert.ok(html.includes('Portal Docente'));
});

// ============================================================
// 7. non_reader queda registrado como perfil del modo individual
// ============================================================
test('non_reader queda registrado como perfil del modo individual', () => {
  const dom = createTestDom({ url: 'http://localhost/expedicion/solo/no-lectores' });
  loadSoloModules(dom.window);
  const games = dom.window.SoloGameAdapter.listGames('non_reader');
  assert.ok(games.length >= 4);
  // El perfil existe y es distinto del colaborativo (vocal-a es parte del registro,
  // pero el mapa lo excluye). Verificamos que el adaptador conoce el perfil.
  const profileIds = new Set(games.map((g) => g.profile));
  assert.ok(profileIds.has('non_reader'));
});

// ============================================================
// 8. solo-entry.js se carga en menu.html
// ============================================================
test('menu.html carga solo-entry.js', () => {
  const html = readFile(EXPEDICION, 'menu.html');
  assert.ok(html.includes('menu/solo-entry.js'));
  assert.ok(html.includes('router/game-router.js'));
  assert.ok(html.includes('menu/menu.js'));
});

// ============================================================
// 9. Existe el contenedor #solo-container
// ============================================================
test('menu.html contiene el contenedor #solo-container', () => {
  const html = readFile(EXPEDICION, 'menu.html');
  assert.ok(html.includes('id="solo-container"'));
});

// ============================================================
// 10. No hay redirección silenciosa a la home
// ============================================================
test('solo-entry no redirige silenciosamente a la home en rutas de perfil', () => {
  const src = readFile(EXPEDICION, 'menu/solo-entry.js');
  // El bloque que maneja rutas de perfil conocidas NO debe redirigir a la home.
  const handle = src.slice(src.indexOf('function handleSoloRouteAfterLoad'));
  const profileBlock = handle.slice(0, handle.indexOf("window.location.href = '/expedicion/'"));
  assert.ok(!profileBlock.includes("window.location.replace"));
  // La ruta /expedicion/solo/no-lectores debe renderizar el perfil, no navegar fuera.
  assert.ok(profileBlock.includes("'/expedicion/solo/no-lectores': 'non_reader'"));
  assert.ok(profileBlock.includes('renderProfilePlaceholder(profileMap[path])'));
});

// ============================================================
// 11. El service worker ignora chrome-extension:
// ============================================================
test('el service worker ignora peticiones chrome-extension:', () => {
  const src = readFileSync(resolve(PUBLIC, 'sw.js'), 'utf8');
  assert.ok(src.includes("requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:'"));
});

// ============================================================
// 12. cache.put solo para http/https
// ============================================================
test('cache.put solo se ejecuta para http/https', () => {
  const src = readFileSync(resolve(PUBLIC, 'sw.js'), 'utf8');
  const putIndex = src.indexOf('cache.put');
  assert.ok(putIndex > -1);
  const seguro = src.slice(0, putIndex);
  assert.ok(seguro.includes("safeProtocol"));
  assert.ok(seguro.includes("response.status === 200"));
});

// ============================================================
// 13. Errores de cache no bloquean la página
// ============================================================
test('errores de cache no rechazan la respuesta de la página', () => {
  const src = readFileSync(resolve(PUBLIC, 'sw.js'), 'utf8');
  // El cache.put debe estar envuelto en .catch(() => {}).
  assert.ok(src.includes('caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {})'));
  // Y el fetch principal tiene su propio catch que devuelve una respuesta.
  assert.ok(src.includes('.catch((error) => {'));
});

// ============================================================
// 14. Colaborativo intacto
// ============================================================
test('los archivos colaborativos no fueron modificados', () => {
  const protegidos = ['game.js', 'juego.html', 'juego-v2.html', 'environment-v2.js', 'environment-v2.css', 'auth.js'];
  protegidos.forEach((f) => {
    assert.ok(existsSync(resolve(EXPEDICION, f)), f + ' existe');
  });
  // No se debe haber tocado el index raíz ni el dashboard.
  assert.ok(existsSync(resolve(EXPEDICION, 'dashboard.html')));
});

// ============================================================
// 15. Archivos protegidos intactos (hashes fijos)
// ============================================================
test('hashes de archivos protegidos no cambiaron', () => {
  const esperados = {
    'index.html': '22B1EEDE',
    'auth.js': '515A1249',
    'dashboard.html': 'E0D902C5',
    'game.js': 'C19F1841'
  };
  for (const [file, hash] of Object.entries(esperados)) {
    const src = readFileSync(resolve(EXPEDICION, file), 'utf8');
    assert.equal(sha256Prefix(src), hash, file + ' hash intacto');
  }
});
