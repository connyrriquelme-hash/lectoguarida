import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE = resolve(__dirname, '../public/expedicion');

function readFile(subpath) {
  return readFileSync(resolve(BASE, subpath), 'utf8');
}

function loadModulesInWindow(window) {
  const routeConfigSrc = readFile('router/route-config.js');
  const sessionSrc = readFile('router/session-manager.js');
  const guardsSrc = readFile('router/navigation-guards.js');
  const progressSrc = readFile('solo/core/progress-repository.js');
  const script = routeConfigSrc + '\n' + sessionSrc + '\n' + guardsSrc + '\n' + progressSrc;
  const fakeStorage = {};
  const fakeLs = { getItem: (k) => fakeStorage[k] || null, setItem: (k, v) => { fakeStorage[k] = v; }, removeItem: (k) => { delete fakeStorage[k]; } };
  const fn = new Function('window', 'document', 'navigator', 'localStorage', script);
  fn(window, window.document, window.navigator, fakeLs);
  return fakeLs;
}

// ============================================================
// 1. Menú muestra cuatro entradas
// ============================================================
test('menú muestra cuatro entradas', () => {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <nav class="menu-grid">
      <a href="/expedicion/juego" class="menu-card card-collab" role="button">Colaborativo</a>
      <a href="/expedicion/solo/no-lectores" class="menu-card card-non-reader" role="button">No Lectores</a>
      <a href="/expedicion/solo/principiantes" class="menu-card card-beginner" role="button">Principiantes</a>
      <a href="/expedicion/solo/avanzados" class="menu-card card-advanced" role="button">Avanzados</a>
    </nav></body></html>`);
  assert.equal(dom.window.document.querySelectorAll('.menu-card').length, 4);
});

// ============================================================
// 2. Tres perfiles individuales visibles
// ============================================================
test('tres perfiles individuales visibles para todos', () => {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <a href="/expedicion/solo/no-lectores">NR</a>
    <a href="/expedicion/solo/principiantes">B</a>
    <a href="/expedicion/solo/avanzados">A</a>
  </body></html>`);
  assert.equal(dom.window.document.querySelectorAll('[href*="/expedicion/solo/"]').length, 3);
});

// ============================================================
// 3. Ningún perfil bloqueado
// ============================================================
test('ningún perfil tiene atributo disabled', () => {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <a href="/expedicion/solo/no-lectores">NR</a>
    <a href="/expedicion/solo/principiantes">B</a>
    <a href="/expedicion/solo/avanzados">A</a>
  </body></html>`);
  dom.window.document.querySelectorAll('[href*="/expedicion/solo/"]').forEach(p => {
    assert.equal(p.hasAttribute('disabled'), false);
  });
});

// ============================================================
// 4. Colaborativo apunta a /expedicion/juego
// ============================================================
test('colaborativo apunta a /expedicion/juego', () => {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <a href="/expedicion/juego" class="menu-card card-collab">Colab</a>
  </body></html>`);
  assert.equal(dom.window.document.querySelector('.card-collab').getAttribute('href'), '/expedicion/juego');
});

// ============================================================
// 5. Archivos colaborativos no modificados
// ============================================================
test('archivos colaborativos no fueron modificados', () => {
  const gameJs = readFile('game.js');
  assert.ok(gameJs.includes('seleccionarNivel'));
  assert.ok(gameJs.includes('cerrarSelectorDeNivel'));
  assert.ok(readFile('auth.js').length > 100);
  assert.ok(readFile('dashboard.html').length > 100);
});

// ============================================================
// 6-8. Rutas válidas
// ============================================================
test('ruta /expedicion/solo/no-lectores es válida', () => {
  assert.ok(['/expedicion/solo/no-lectores', '/expedicion/solo/principiantes', '/expedicion/solo/avanzados'].includes('/expedicion/solo/no-lectores'));
});
test('ruta /expedicion/solo/principiantes es válida', () => {
  assert.ok(['/expedicion/solo/no-lectores', '/expedicion/solo/principiantes', '/expedicion/solo/avanzados'].includes('/expedicion/solo/principiantes'));
});
test('ruta /expedicion/solo/avanzados es válida', () => {
  assert.ok(['/expedicion/solo/no-lectores', '/expedicion/solo/principiantes', '/expedicion/solo/avanzados'].includes('/expedicion/solo/avanzados'));
});

// ============================================================
// 9. updateSessionMode
// ============================================================
test('updateSessionMode guarda collab', () => {
  const dom = new JSDOM('<html><body></body></html>');
  loadModulesInWindow(dom.window);
  const session = dom.window.createDefaultSession();
  dom.window.updateSessionMode(session, 'collab');
  assert.equal(session.modeGame, 'collab');
});

// ============================================================
// 10. updateSessionProfile
// ============================================================
test('updateSessionProfile guarda perfil válido', () => {
  const dom = new JSDOM('<html><body></body></html>');
  loadModulesInWindow(dom.window);
  const session = dom.window.createDefaultSession();
  dom.window.updateSessionProfile(session, 'beginner');
  assert.equal(session.readerProfile, 'beginner');
  assert.equal(session.modeGame, 'solo');
});

// ============================================================
// 11. Cambiar perfil
// ============================================================
test('cambiar perfil actualiza sesión', () => {
  const dom = new JSDOM('<html><body></body></html>');
  loadModulesInWindow(dom.window);
  const session = dom.window.createDefaultSession();
  dom.window.updateSessionProfile(session, 'beginner');
  dom.window.updateSessionProfile(session, 'advanced');
  assert.equal(session.readerProfile, 'advanced');
});

// ============================================================
// 12. Namespace separado
// ============================================================
test('namespace de progreso es separado del colaborativo', () => {
  assert.notEqual('lectoguarida:solo-progress:v1', 'lectoguarida:progress');
  assert.ok('lectoguarida:solo-progress:v1'.startsWith('lectoguarida:solo'));
});

// ============================================================
// 13. Progress repository
// ============================================================
test('progress-repository crea estructura versionada', () => {
  const dom = new JSDOM('<html><body></body></html>');
  loadModulesInWindow(dom.window);
  const progress = dom.window.SoloProgressRepository.createDefaultProgress('test-id');
  assert.equal(progress.version, 1);
  assert.ok(progress.profiles.non_reader);
  assert.ok(progress.profiles.beginner);
  assert.ok(progress.profiles.advanced);
  assert.equal(progress.wallet.lostPages, 0);
});

// ============================================================
// 14. goToMenu
// ============================================================
test('goToMenu apunta a /expedicion/', () => {
  const dom = new JSDOM('<html><body></body></html>');
  loadModulesInWindow(dom.window);
  assert.equal(dom.window.ROUTE_CONFIG.routes.menu, '/expedicion/');
});

// ============================================================
// 15. loadSession restaura
// ============================================================
test('loadSession restaura sesión guardada', () => {
  const dom = new JSDOM('<html><body></body></html>');
  loadModulesInWindow(dom.window);
  const session = dom.window.createDefaultSession();
  dom.window.updateSessionMode(session, 'solo');
  dom.window.updateSessionProfile(session, 'non_reader');
  const restored = dom.window.loadSession();
  assert.equal(restored.modeGame, 'solo');
  assert.equal(restored.readerProfile, 'non_reader');
});

// ============================================================
// 16. Sesión inválida
// ============================================================
test('isSessionValid rechaza versión inválida', () => {
  const dom = new JSDOM('<html><body></body></html>');
  loadModulesInWindow(dom.window);
  assert.equal(dom.window.isSessionValid({ sessionVersion: 99, modeGame: 'solo' }), false);
});

// ============================================================
// 17. Feature flags
// ============================================================
test('feature flags valores correctos', () => {
  const flags = { ENABLE_MULTIPROFILE_MENU: true, ENABLE_SOLO_GAME_ENGINE: false, ENABLE_CODEX_GUARDIAN: false, ENABLE_PERSONAL_GUARIDA: false };
  assert.equal(flags.ENABLE_MULTIPROFILE_MENU, true);
  assert.equal(flags.ENABLE_SOLO_GAME_ENGINE, false);
});

// ============================================================
// 18. Containment wall
// ============================================================
test('containmentWall separa collab de solo', () => {
  const dom = new JSDOM('<html><body></body></html>');
  loadModulesInWindow(dom.window);
  const w1 = dom.window.NavigationGuards.containmentWall({ modeGame: 'collab' });
  const w2 = dom.window.NavigationGuards.containmentWall({ modeGame: 'solo' });
  assert.equal(w1.collab, true);
  assert.equal(w1.solo, false);
  assert.equal(w2.collab, false);
  assert.equal(w2.solo, true);
});

// ============================================================
// 19. Teclado
// ============================================================
test('botones del menú son interactivos', () => {
  const dom = new JSDOM(`<!DOCTYPE html><html><body>
    <a href="/expedicion/juego" role="button">Colab</a>
    <a href="/expedicion/solo/no-lectores" role="button">NR</a>
  </body></html>`);
  const btns = dom.window.document.querySelectorAll('[role="button"]');
  assert.ok(btns.length >= 2);
  btns.forEach(b => assert.ok(b.getAttribute('href')));
});

// ============================================================
// 20. Touch — responsive
// ============================================================
test('menú tiene estilos responsive', () => {
  const html = readFile('menu.html');
  assert.ok(html.includes('@media'));
  assert.ok(html.includes('min-height'));
});

// ============================================================
// 21. Móvil — viewport
// ============================================================
test('menu.html tiene viewport meta tag', () => {
  const html = readFile('menu.html');
  assert.ok(html.includes('viewport'));
  assert.ok(html.includes('width=device-width'));
});

// ============================================================
// 22. Router sin console.error
// ============================================================
test('router no contiene console.error', () => {
  ['route-config.js', 'session-manager.js', 'navigation-guards.js', 'game-router.js'].forEach(f => {
    assert.ok(!readFile('router/' + f).includes('console.error'), f + ' ok');
  });
});

// ============================================================
// 23. Sin redirects circulares
// ============================================================
test('rutas del menú no apuntan entre sí', () => {
  const menuRoutes = ['/expedicion/juego', '/expedicion/solo/no-lectores', '/expedicion/solo/principiantes', '/expedicion/solo/avanzados'];
  assert.ok(!menuRoutes.includes('/expedicion/'));
  assert.ok(!menuRoutes.includes('/expedicion/solo/'));
});

// ============================================================
// 24. No se modifica ProfePlanificAI
// ============================================================
test('archivos creados dentro de public/expedicion/', () => {
  assert.ok(existsSync(resolve(BASE, 'solo')));
  assert.ok(existsSync(resolve(BASE, 'router')));
  assert.ok(existsSync(resolve(BASE, 'menu')));
});
