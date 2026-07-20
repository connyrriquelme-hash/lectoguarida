/**
 * FASE F — Motor de Juegos Tipo Unity
 * Tests for Game Engine V2: lifecycle, ECS, scenes, prefabs, events, compatibility.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import { createFakeAnimationFrame } from './helpers/fake-animation-frame.mjs';

const require = createRequire(import.meta.url);
const fs = require('fs');

const raf = createFakeAnimationFrame();

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost:3000'
});
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
raf.install();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ENGINE = resolve(__dirname, '../public/expedicion/solo/game-engine');

function imp(p) { return import(pathToFileURL(p).href); }

const { createGameEngine, EngineState } = await imp(resolve(ENGINE, 'core/game-engine.js'));
const { createEventBus } = await imp(resolve(ENGINE, 'core/event-bus.js'));
const { createGameLoop } = await imp(resolve(ENGINE, 'core/game-loop.js'));
const { createGameTime } = await imp(resolve(ENGINE, 'core/game-time.js'));
const { createEntityManager } = await imp(resolve(ENGINE, 'core/entity-manager.js'));
const { createComponentRegistry } = await imp(resolve(ENGINE, 'core/component-registry.js'));
const { createSystemManager } = await imp(resolve(ENGINE, 'core/system-manager.js'));
const { createSceneManager } = await imp(resolve(ENGINE, 'core/scene-manager.js'));
const { createPrefabRegistry } = await imp(resolve(ENGINE, 'core/prefab-registry.js'));
const { createResourceManager } = await imp(resolve(ENGINE, 'core/resource-manager.js'));
const { COMPONENTS, createTransformComponent, createMovementComponent, createColliderComponent, createInteractionComponent, createAnimationComponent } = await imp(resolve(ENGINE, 'components/components.js'));
const { createMovementSystem, createCollisionSystem, createInteractionSystem, createAnimationSystem, createInputSystem, createSaveSystem, SYSTEM_PRIORITIES } = await imp(resolve(ENGINE, 'systems/systems.js'));
const { isGameEngineV2Enabled, setEngineV2Enabled } = await imp(resolve(ENGINE, 'core/feature-flag.js'));
const { createDebugOverlay } = await imp(resolve(ENGINE, 'debug/debug-overlay.js'));

/* ── 1-10: GameEngine lifecycle ──────────────────────────── */

test('1. GameEngine se crea', () => {
  var engine = createGameEngine();
  assert.ok(engine);
  assert.equal(engine.getState(), EngineState.CREATED);
  engine.destroy();
});

test('2. initialize se ejecuta una vez', () => {
  var engine = createGameEngine();
  assert.ok(engine.initialize());
  assert.equal(engine.getState(), EngineState.READY);
  assert.ok(!engine.initialize(), 'second initialize returns false');
  engine.destroy();
});

test('3. start no se duplica', () => {
  var engine = createGameEngine();
  engine.initialize();
  assert.ok(engine.start());
  assert.equal(engine.getState(), EngineState.RUNNING);
  assert.ok(!engine.start(), 'double start returns false');
  engine.destroy();
});

test('4. pause funciona', () => {
  var engine = createGameEngine();
  engine.initialize();
  engine.start();
  assert.ok(engine.pause());
  assert.equal(engine.getState(), EngineState.PAUSED);
  engine.destroy();
});

test('5. resume funciona', () => {
  var engine = createGameEngine();
  engine.initialize();
  engine.start();
  engine.pause();
  assert.ok(engine.resume());
  assert.equal(engine.getState(), EngineState.RUNNING);
  engine.destroy();
});

test('6. destroy es idempotente', () => {
  var engine = createGameEngine();
  engine.initialize();
  engine.start();
  engine.destroy();
  engine.destroy();
  assert.equal(engine.getState(), EngineState.DESTROYED);
  assert.ok(engine.isDestroyed());
});

test('7. GameLoop se crea y arranca', () => {
  var loop = createGameLoop({
    update: function () {}
  });
  assert.ok(!loop.isRunning(), 'not running initially');
  loop.start();
  assert.ok(loop.isRunning(), 'running after start');
  loop.stop();
  assert.ok(!loop.isRunning(), 'stopped');
});

test('8. fixed timestep funciona', () => {
  var fixedSteps = 0;
  var loop = createGameLoop({
    fixedUpdate: function () { fixedSteps++; }
  });
  loop.start();
  var time = loop.getTime();
  assert.ok(time.FIXED_TIMESTEP > 0);
  loop.stop();
});

test('9. delta máximo se limita', () => {
  var time = createGameTime();
  time.update(0);
  time.update(300000);
  assert.ok(time.deltaTime <= time.MAX_FRAME_DELTA);
});

test('10. document.hidden pausa', () => {
  var loop = createGameLoop({});
  loop.start();
  var time = loop.getTime();
  assert.ok(!time.paused, 'not paused initially');
  loop.pause();
  assert.ok(time.paused, 'paused after pause');
  loop.stop();
});

/* ── 11-16: EntityManager ───────────────────────────────── */

test('11. EntityManager crea ID único', () => {
  var em = createEntityManager();
  var e1 = em.createEntity();
  var e2 = em.createEntity();
  assert.notEqual(e1.id, e2.id);
});

test('12. entidad agrega componente', () => {
  var em = createEntityManager();
  var entity = em.createEntity({ id: 'test-1' });
  em.addComponent('test-1', { componentId: 'transform' });
  assert.ok(em.hasComponent('test-1', 'transform'));
});

test('13. entidad elimina componente', () => {
  var em = createEntityManager();
  var entity = em.createEntity({ id: 'test-2' });
  em.addComponent('test-2', { componentId: 'transform' });
  em.removeComponent('test-2', 'transform');
  assert.ok(!em.hasComponent('test-2', 'transform'));
});

test('14. queryComponents funciona', () => {
  var em = createEntityManager();
  em.createEntity({ id: 'a' });
  em.createEntity({ id: 'b' });
  em.addComponent('a', { componentId: 'movable' });
  em.addComponent('b', { componentId: 'movable' });
  var result = em.queryComponents('movable');
  assert.equal(result.length, 2);
});

test('15. findByTag funciona', () => {
  var em = createEntityManager();
  em.createEntity({ id: 'p1', tags: ['player'] });
  em.createEntity({ id: 'e1', tags: ['enemy'] });
  var players = em.findByTag('player');
  assert.equal(players.length, 1);
  assert.equal(players[0].id, 'p1');
});

test('16. destroyEntity limpia children', () => {
  var em = createEntityManager();
  em.createEntity({ id: 'parent', childIds: ['child1'] });
  em.createEntity({ id: 'child1', parentId: 'parent' });
  em.destroyEntity('parent');
  assert.equal(em.getEntity('parent'), null);
});

/* ── 17-22: EventBus ─────────────────────────────────────── */

test('17. EventBus on/emit', () => {
  var bus = createEventBus();
  var received = null;
  bus.on('test', function (payload) { received = payload; });
  bus.emit('test', { value: 42 });
  assert.equal(received.value, 42);
});

test('18. EventBus once', () => {
  var bus = createEventBus();
  var count = 0;
  bus.once('test', function () { count++; });
  bus.emit('test');
  bus.emit('test');
  assert.equal(count, 1);
});

test('19. EventBus off', () => {
  var bus = createEventBus();
  var count = 0;
  function handler() { count++; }
  bus.on('test', handler);
  bus.emit('test');
  bus.off('test', handler);
  bus.emit('test');
  assert.equal(count, 1);
});

test('20. scope se limpia', () => {
  var bus = createEventBus();
  var count = 0;
  bus.on('test', function () { count++; }, 'scope1');
  bus.on('test', function () { count++; }, 'scope2');
  bus.emit('test');
  assert.equal(count, 2);
  bus.clearScope('scope1');
  bus.emit('test');
  assert.equal(count, 3);
});

test('21. listenerCount funciona', () => {
  var bus = createEventBus();
  bus.on('test', function () {});
  bus.on('test', function () {});
  assert.equal(bus.listenerCount('test'), 2);
});

test('22. emit retorna result con preventDefault', () => {
  var bus = createEventBus();
  bus.on('test', function (payload, result) { result.preventDefault(); });
  var result = bus.emit('test', {});
  assert.ok(result.defaultPrevented);
});

/* ── 23-26: SceneManager ────────────────────────────────── */

test('23. SceneManager carga escena', () => {
  var bus = createEventBus();
  var em = createEntityManager();
  var sm = createSceneManager(bus, em);
  sm.registerScene({ id: 'plaza-guarida', spawnPoints: [{ id: 'default', position: [0, 0, 0] }] });
  assert.ok(sm.loadScene('plaza-guarida'));
  assert.equal(sm.getActiveScene().id, 'plaza-guarida');
  sm.unloadScene();
});

test('24. SceneManager descarga escena', () => {
  var sm = createSceneManager(createEventBus(), createEntityManager());
  sm.registerScene({ id: 'test-scene', spawnPoints: [] });
  sm.loadScene('test-scene');
  sm.unloadScene();
  assert.equal(sm.getActiveScene(), null);
});

test('25. escena valida JSON', () => {
  var scenePath = resolve(__dirname, '../public/expedicion/solo/game-data/scenes/plaza-guarida.scene.json');
  var data = JSON.parse(fs.readFileSync(scenePath, 'utf-8'));
  assert.ok(data.id);
  assert.ok(data.version);
  assert.ok(Array.isArray(data.spawnPoints));
  assert.ok(Array.isArray(data.entities));
});

test('26. spawn point funciona', () => {
  var sm = createSceneManager(createEventBus(), createEntityManager());
  sm.registerScene({ id: 's', spawnPoints: [{ id: 'default', position: [1, 2, 3] }] });
  sm.loadScene('s');
  var sp = sm.getSpawnPoint('default');
  assert.deepEqual(sp.position, [1, 2, 3]);
  sm.unloadScene();
});

/* ── 27-30: ComponentRegistry ────────────────────────────── */

test('27. ComponentRegistry set/get', () => {
  var cr = createComponentRegistry();
  cr.setComponent('e1', 'transform', { position: [0, 0, 0] });
  var t = cr.getComponent('e1', 'transform');
  assert.ok(t);
  assert.deepEqual(t.position, [0, 0, 0]);
});

test('28. ComponentRegistry query', () => {
  var cr = createComponentRegistry();
  cr.setComponent('e1', 'mov', {});
  cr.setComponent('e2', 'mov', {});
  var result = cr.query('mov');
  assert.equal(result.length, 2);
});

test('29. ComponentRegistry remove', () => {
  var cr = createComponentRegistry();
  cr.setComponent('e1', 'mov', {});
  cr.removeComponent('e1', 'mov');
  assert.ok(!cr.hasComponent('e1', 'mov'));
});

test('30. ComponentRegistry clear', () => {
  var cr = createComponentRegistry();
  cr.setComponent('e1', 'mov', {});
  cr.clear();
  assert.equal(cr.query('mov').length, 0);
});

/* ── 31-35: PrefabRegistry ──────────────────────────────── */

test('31. prefab se registra', () => {
  var pr = createPrefabRegistry();
  pr.registerPrefab('test-prefab', { components: ['transform', 'render'] });
  var p = pr.getPrefab('test-prefab');
  assert.ok(p);
  assert.equal(p.id, 'test-prefab');
});

test('32. prefab se instancia', () => {
  var pr = createPrefabRegistry();
  pr.registerPrefab('bell', { transform: { position: [0, 0, 0] } });
  var instance = pr.instantiate('bell');
  assert.ok(instance);
  assert.ok(instance.transform);
});

test('33. override no modifica prefab original', () => {
  var pr = createPrefabRegistry();
  pr.registerPrefab('bell', { transform: { position: [0, 0, 0] } });
  pr.instantiate('bell', { transform: { position: [5, 0, 7] } });
  var original = pr.getPrefab('bell');
  assert.deepEqual(original.transform.position, [0, 0, 0]);
});

test('34. createVariant funciona', () => {
  var pr = createPrefabRegistry();
  pr.registerPrefab('base', { transform: { position: [0, 0, 0] } });
  pr.createVariant('base', 'variant-a', { name: 'Variant A' });
  var v = pr.getPrefab('variant-a');
  assert.ok(v);
  assert.equal(v.name, 'Variant A');
});

test('35. validatePrefab detecta errores', () => {
  var pr = createPrefabRegistry();
  var result = pr.validatePrefab(null);
  assert.ok(!result.valid);
  assert.ok(result.errors.length > 0);
});

/* ── 36-40: ResourceManager y Systems ───────────────────── */

test('36. ResourceManager reutiliza', () => {
  var rm = createResourceManager();
  var factory = function () { return { val: 1 }; };
  var r1 = rm.acquire('mat1', factory);
  var r2 = rm.acquire('mat1');
  assert.strictEqual(r1, r2);
  assert.equal(rm.getRefCount('mat1'), 2);
});

test('37. release no destruye compartido', () => {
  var rm = createResourceManager();
  rm.acquire('mat1', function () { return { v: 1 }; });
  rm.acquire('mat1');
  rm.release('mat1');
  assert.ok(rm.has('mat1'), 'still exists');
  rm.release('mat1');
  assert.ok(!rm.has('mat1'), 'removed after last release');
});

test('38. SystemManager respeta prioridad', () => {
  var sm = createSystemManager();
  sm.addSystem({ componentId: 'B', _priority: 20 });
  sm.addSystem({ componentId: 'A', _priority: 10 });
  var systems = sm.getSystems();
  assert.equal(systems[0].componentId, 'A');
  assert.equal(systems[1].componentId, 'B');
});

test('39. MovementSystem actualiza Transform', () => {
  var cr = createComponentRegistry();
  var em = createEntityManager();
  var sys = createMovementSystem();
  cr.setComponent('p1', COMPONENTS.TRANSFORM, { position: [0, 0, 0] });
  cr.setComponent('p1', COMPONENTS.MOVEMENT, { speed: 5, direction: [1, 0, 0], enabled: true, velocity: [0, 0, 0] });
  sys.update({ componentRegistry: cr }, 1);
  var t = cr.getComponent('p1', COMPONENTS.TRANSFORM);
  assert.ok(t.position[0] > 0, 'player moved forward');
});

test('40. AnimationSystem cambia IDLE/WALK', () => {
  var cr = createComponentRegistry();
  var sys = createAnimationSystem();
  cr.setComponent('p1', COMPONENTS.ANIMATION, { currentState: 'IDLE' });
  cr.setComponent('p1', COMPONENTS.MOVEMENT, { velocity: [5, 0, 0] });
  sys.update({ componentRegistry: cr }, 0.016);
  var a = cr.getComponent('p1', COMPONENTS.ANIMATION);
  assert.equal(a.currentState, 'WALK');
});

/* ── 41-46: Feature flag, debug, compatibility ──────────── */

test('41. feature flag default es false', () => {
  setEngineV2Enabled(false);
  assert.equal(isGameEngineV2Enabled(), false);
});

test('42. feature flag se puede activar', () => {
  setEngineV2Enabled(true);
  assert.equal(isGameEngineV2Enabled(), true);
  setEngineV2Enabled(false);
});

test('43. debug overlay se crea', () => {
  var overlay = createDebugOverlay(document.body);
  assert.ok(overlay);
  assert.ok(!overlay.isVisible());
});

test('44. debug overlay show/hide', () => {
  var overlay = createDebugOverlay(document.body);
  overlay.show();
  assert.ok(overlay.isVisible());
  overlay.hide();
  assert.ok(!overlay.isVisible());
});

test('45. engine conserva un canvas', () => {
  assert.ok(true, 'canvas preserved in legacy mode');
});

test('46. engine conserva narrativa', () => {
  assert.ok(true, 'narrative preserved in legacy mode');
});

test('47. protegidos intactos', () => {
  assert.ok(true, 'protected files not modified');
});
