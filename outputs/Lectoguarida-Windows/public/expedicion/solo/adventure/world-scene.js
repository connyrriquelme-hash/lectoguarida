/**
 * world-scene.js
 * Crea renderer, escena, luces y el loop de animación. Libera todo en dispose.
 */

import * as THREE from './vendor/three.module.js';
import { createEnvironmentFactory } from './environment-factory.js';
import { createVegetationFactory } from './vegetation-factory.js';
import { createEffectsManager } from './effects-manager.js';
import { createCameraController } from './camera-controller.js';
import { createDisposer } from './resource-disposer.js';

export function createWorldScene(container, quality) {
  var disposer = createDisposer();
  var config = quality.getConfig();

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: config.tier !== 'LOW', alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    return { error: 'webgl-unavailable', dispose: function () {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, config.maxPixelRatio));
  renderer.setSize(container.clientWidth || 800, container.clientHeight || 600);
  renderer.shadowMap.enabled = config.shadowsEnabled;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  disposer.trackDisposable(renderer);

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe8ff);
  scene.fog = new THREE.Fog(0xbfe8ff, 40, 90);
  disposer.trackDisposable(scene);

  var camera = new THREE.PerspectiveCamera(45, (container.clientWidth || 800) / (container.clientHeight || 600), 0.1, 200);
  camera.position.set(0, 14, 14);

  var cameraController = createCameraController(camera, null);
  cameraController.setBounds({ minX: -55, maxX: 55, minZ: -55, maxZ: 55 });

  // luces
  var hemi = new THREE.HemisphereLight(0xffffff, 0x6b8f3a, 0.9);
  scene.add(hemi);
  disposer.trackDisposable(hemi);

  var dir = new THREE.DirectionalLight(0xfff2cc, 1.0);
  dir.position.set(20, 30, 10);
  if (config.shadowsEnabled) {
    dir.castShadow = true;
    dir.shadow.mapSize.width = config.shadowMapSize;
    dir.shadow.mapSize.height = config.shadowMapSize;
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 100;
    dir.shadow.camera.left = -40; dir.shadow.camera.right = 40;
    dir.shadow.camera.top = 40; dir.shadow.camera.bottom = -40;
  }
  scene.add(dir);
  disposer.trackDisposable(dir);

  var warm1 = new THREE.PointLight(0xffd166, 0.5, 30);
  warm1.position.set(-10, 6, -20);
  scene.add(warm1);
  disposer.trackDisposable(warm1);

  // entorno
  var envCache = createEnvironmentFactory(null);
  var environment = envCache.buildEnvironment(quality);
  scene.add(environment);
  disposer.trackDisposable(envCache);

  // vegetación
  var veg = createVegetationFactory(null);
  var vegGroup = new THREE.Group();
  var scale = config.vegitationCount;
  var spots = [
    { x: -8, z: -20, kind: 'copihue' }, { x: 9, z: -22, kind: 'totora' },
    { x: -14, z: 4, kind: 'araucaria' }, { x: 16, z: 2, kind: 'fern' },
    { x: -6, z: 8, kind: 'flower-yellow' }, { x: 7, z: 10, kind: 'flower-coral' },
    { x: -20, z: -6, kind: 'rock' }, { x: 22, z: -4, kind: 'copihue' }
  ];
  var maxVeg = Math.max(2, Math.round(spots.length * scale));
  for (var i = 0; i < maxVeg; i++) {
    var s = spots[i % spots.length];
    var item = veg.create(s.kind);
    item.position.set(s.x + (Math.random() - 0.5) * 3, 0, s.z + (Math.random() - 0.5) * 3);
    vegGroup.add(item);
  }
  scene.add(vegGroup);
  disposer.trackDisposable(veg);

  // efectos
  var effects = createEffectsManager(scene, quality);
  disposer.trackDisposable(effects);

  var clock = new THREE.Clock();
  var rafId = null;
  var running = true;
  var paused = false;
  var updaters = [];

  function loop() {
    rafId = disposer.trackRaf(requestAnimationFrame(loop));
    if (!running || paused) return;
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;
    updaters.forEach(function (fn) { try { fn(dt, t); } catch (e) {} });
    if (effects) effects.update(t);
    cameraController.update(dt);
    renderer.render(scene, camera);
  }

  function onResize() {
    var w = container.clientWidth || 800;
    var h = container.clientHeight || 600;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  var resizeHandler = function () { onResize(); };
  window.addEventListener('resize', resizeHandler);
  disposer.trackListener(window, 'resize', resizeHandler);

  var visibilityHandler = function () {
    paused = document.hidden;
  };
  document.addEventListener('visibilitychange', visibilityHandler);
  disposer.trackListener(document, 'visibilitychange', visibilityHandler);

  return {
    renderer: renderer,
    scene: scene,
    camera: camera,
    cameraController: cameraController,
    clock: clock,
    getThree: function () { return THREE; },
    add: function (obj) { scene.add(obj); },
    remove: function (obj) { scene.remove(obj); },
    onFrame: function (fn) { updaters.push(fn); },
    start: function () { running = true; clock.start(); loop(); },
    pause: function () { paused = true; },
    resume: function () { paused = false; },
    stop: function () { running = false; if (rafId) disposer.cancelRaf(rafId); },
    setPlayerTarget: function (obj) { cameraController.target = obj; },
    dispose: function () {
      running = false;
      if (rafId) disposer.cancelRaf(rafId);
      window.removeEventListener('resize', resizeHandler);
      document.removeEventListener('visibilitychange', visibilityHandler);
      disposer.disposeAll();
      try { if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement); } catch (e) {}
      try { renderer.dispose(); } catch (e) {}
    }
  };
}
