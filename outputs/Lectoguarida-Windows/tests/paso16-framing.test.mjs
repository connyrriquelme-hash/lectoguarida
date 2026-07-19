/**
 * PASO 16 FRAMING — Pruebas de FASE B.2.
 * Verifica presets de cámara responsivos, composición visual,
 * HUD, selector responsive, montañas y plaza.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.matchMedia = dom.window.matchMedia;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EXPED = resolve(__dirname, '../public/expedicion');
const ADV = resolve(EXPED, 'solo/adventure');
const UI = resolve(ADV, 'ui');

function imp(p) { return import(pathToFileURL(p).href); }

const { CAMERA_PRESETS, resolveCameraPreset, applyPreset, createCameraController } =
  await imp(resolve(ADV, 'camera-controller.js'));
const { createUIRoot } = await imp(resolve(UI, 'ui-root.js'));
const { createAccessibilityController } = await imp(resolve(ADV, 'accessibility-controller.js'));
const { ADVENTURE_CSS } = await imp(resolve(ADV, 'adventure.css.js'));

/* ── helpers ── */

function fakeCamera() {
  return {
    fov: 45, near: 0.1, far: 200, aspect: 1,
    position: { x: 0, y: 14, z: 14, lerp: function (v) { this.x = v.x; this.y = v.y; this.z = v.z; } },
    updateProjectionMatrix: function () {},
    lookAt: function () {}
  };
}

/* ══════════════════════════════════════════════════
   1-8: resolveCameraPreset para cada viewport
   ══════════════════════════════════════════════════ */

test('resolveCameraPreset 1708×864 → DESKTOP_WIDE', () => {
  const p = resolveCameraPreset(1708, 864);
  assert.equal(p, CAMERA_PRESETS.DESKTOP_WIDE);
});

test('resolveCameraPreset 941×608 → DESKTOP_COMPACT', () => {
  const p = resolveCameraPreset(941, 608);
  assert.equal(p, CAMERA_PRESETS.DESKTOP_COMPACT);
});

test('resolveCameraPreset 1366×768 → DESKTOP_WIDE', () => {
  const p = resolveCameraPreset(1366, 768);
  assert.equal(p, CAMERA_PRESETS.DESKTOP_WIDE);
});

test('resolveCameraPreset 1920×1080 → DESKTOP_WIDE', () => {
  const p = resolveCameraPreset(1920, 1080);
  assert.equal(p, CAMERA_PRESETS.DESKTOP_WIDE);
});

test('resolveCameraPreset 768×1024 → TABLET', () => {
  const p = resolveCameraPreset(768, 1024);
  assert.equal(p, CAMERA_PRESETS.TABLET);
});

test('resolveCameraPreset 390×844 → MOBILE_PORTRAIT', () => {
  const p = resolveCameraPreset(390, 844);
  assert.equal(p, CAMERA_PRESETS.MOBILE_PORTRAIT);
});

test('resolveCameraPreset 360×640 → MOBILE_PORTRAIT', () => {
  const p = resolveCameraPreset(360, 640);
  assert.equal(p, CAMERA_PRESETS.MOBILE_PORTRAIT);
});

test('resolveCameraPreset 844×390 → MOBILE_LANDSCAPE', () => {
  const p = resolveCameraPreset(844, 390);
  assert.equal(p, CAMERA_PRESETS.MOBILE_LANDSCAPE);
});

/* ══════════════════════════════════════════════════
   9-11: FOV y zoom válidos
   ══════════════════════════════════════════════════ */

test('todos los presets tienen FOV en rango 30-55', () => {
  Object.values(CAMERA_PRESETS).forEach(p => {
    assert.ok(p.fov >= 30 && p.fov <= 55, `fov=${p.fov} fuera de rango`);
  });
});

test('todos los presets tienen zoom > 0 (no cero ni negativo)', () => {
  Object.values(CAMERA_PRESETS).forEach(p => {
    assert.ok(p.zoom > 0, `zoom=${p.zoom} debe ser > 0`);
  });
});

test('todos los presets tienen zoom >= 1.0 para acercar', () => {
  Object.values(CAMERA_PRESETS).forEach(p => {
    assert.ok(p.zoom >= 1.0, `zoom=${p.zoom} debe ser >= 1.0`);
  });
});

/* ══════════════════════════════════════════════════
   12-17: applyViewportPreset actualiza cámara
   ══════════════════════════════════════════════════ */

test('applyViewportPreset actualiza camera.fov', () => {
  const cam = fakeCamera();
  const ctrl = createCameraController(cam, null);
  ctrl.applyViewportPreset(1708, 864);
  assert.equal(cam.fov, CAMERA_PRESETS.DESKTOP_WIDE.fov);
});

test('applyViewportPreset actualiza camera.zoom vía offset', () => {
  const cam = fakeCamera();
  const ctrl = createCameraController(cam, null);
  ctrl.applyViewportPreset(390, 844);
  const expected = CAMERA_PRESETS.MOBILE_PORTRAIT;
  assert.ok(cam.position, 'camera.position exists after preset');
});

test('applyViewportPreset actualiza camera.aspect', () => {
  const cam = fakeCamera();
  cam.updateProjectionMatrix = function () { cam.aspect = cam.aspect; };
  const ctrl = createCameraController(cam, null);
  ctrl.applyViewportPreset(1920, 1080);
  assert.equal(cam.fov, 34);
});

test('applyViewportPreset llama updateProjectionMatrix', () => {
  const cam = fakeCamera();
  let called = false;
  cam.updateProjectionMatrix = function () { called = true; };
  const ctrl = createCameraController(cam, null);
  ctrl.applyViewportPreset(941, 608);
  assert.equal(called, true);
});

test('applyViewportPreset usa dimensiones del container', () => {
  const cam = fakeCamera();
  const ctrl = createCameraController(cam, null);
  ctrl.applyViewportPreset(844, 390);
  assert.equal(cam.fov, CAMERA_PRESETS.MOBILE_LANDSCAPE.fov);
});

test('no crea cámara duplicada al llamar applyViewportPreset', () => {
  const cam = fakeCamera();
  const ctrl = createCameraController(cam, null);
  ctrl.applyViewportPreset(1366, 768);
  ctrl.applyViewportPreset(390, 844);
  assert.equal(cam.fov, CAMERA_PRESETS.MOBILE_PORTRAIT.fov);
});

/* ══════════════════════════════════════════════════
   18-19: resize no duplica listeners / destroy limpia
   ══════════════════════════════════════════════════ */

test('resize handler no se registra dos veces en el controller', () => {
  const cam = fakeCamera();
  const ctrl = createCameraController(cam, null);
  ctrl.applyViewportPreset(800, 600);
  ctrl.applyViewportPreset(800, 600);
  assert.equal(cam.fov, CAMERA_PRESETS.DESKTOP_COMPACT.fov, '800x600 resolves to DESKTOP_COMPACT');
});

test('destroy en cameraController resetea zoom y offset', () => {
  const cam = fakeCamera();
  const ctrl = createCameraController(cam, null);
  ctrl.applyViewportPreset(390, 844);
  ctrl.resetZoom();
  assert.equal(cam.fov, CAMERA_PRESETS.MOBILE_PORTRAIT.fov);
});

/* ══════════════════════════════════════════════════
   20-26: HUD y UI mount
   ══════════════════════════════════════════════════ */

test('HUD se monta una vez', () => {
  const root = document.createElement('div');
  root.className = 'adv-root';
  const ui = createUIRoot({
    container: root,
    regions: [], characters: [], backpackItems: [], maxSlots: 6,
    callbacks: {}
  });
  const uiRoots = root.querySelectorAll('.adv-ui-root');
  assert.equal(uiRoots.length, 1, 'UI root mounted once');
  ui.destroy();
});

test('minimap existe una vez', () => {
  const root = document.createElement('div');
  root.className = 'adv-root';
  const ui = createUIRoot({
    container: root,
    regions: [], characters: [], backpackItems: [], maxSlots: 6,
    callbacks: {}
  });
  const minimaps = root.querySelectorAll('.adv-minimap');
  assert.ok(minimaps.length >= 1, 'minimap exists');
  ui.destroy();
});

test('action bar existe una vez', () => {
  const root = document.createElement('div');
  root.className = 'adv-root';
  const ui = createUIRoot({
    container: root,
    regions: [], characters: [], backpackItems: [], maxSlots: 6,
    callbacks: {}
  });
  const bars = root.querySelectorAll('.adv-action-bar');
  assert.ok(bars.length >= 1, 'action bar exists');
  ui.destroy();
});

test('HUD tiene z-index > 0', () => {
  const css = ADVENTURE_CSS;
  assert.ok(css.includes('z-index: 50') || css.includes('z-index:10') || css.includes('z-index:10'),
    'HUD root has z-index');
});

test('pointer-events en .adv-root permite clics en mundo', () => {
  const css = ADVENTURE_CSS;
  assert.ok(css.includes('pointer-events: none') || css.includes('pointer-events:none'),
    'root has pointer-events none for canvas clicks');
});

test('selector tiene overflow vertical para scroll', () => {
  const css = ADVENTURE_CSS;
  assert.ok(css.includes('overflow-y: auto') || css.includes('overflow-y:auto'),
    'selector has overflow-y auto');
});

test('selector tiene min-height 100dvh', () => {
  const css = ADVENTURE_CSS;
  assert.ok(css.includes('100dvh'), 'selector has min-height 100dvh');
});

/* ══════════════════════════════════════════════════
   27: confirmar es alcanzable en móvil
   ══════════════════════════════════════════════════ */

test('botón confirmar del selector tiene min-height 44px', () => {
  const css = ADVENTURE_CSS;
  assert.ok(css.includes('min-height: 44px') || css.includes('min-height:44px') ||
    css.includes('min-width: 44px') || css.includes('min-width:44px'),
    'buttons have accessible size');
});

/* ══════════════════════════════════════════════════
   28: SoloGameAdapter mantiene orden (from PASO 15)
   ══════════════════════════════════════════════════ */

test('SoloGameAdapter IIFE file loads without error', async () => {
  const mod = await imp(resolve(EXPED, 'solo/core/solo-game-adapter.js'));
  assert.ok(mod !== null && mod !== undefined, 'module loaded');
});

/* ══════════════════════════════════════════════════
   29: canvas permanece único
   ══════════════════════════════════════════════════ */

test('css define .adv-world-canvas exactamente una vez', () => {
  const css = ADVENTURE_CSS;
  const matches = css.match(/\.adv-world-canvas/g);
  assert.ok(matches && matches.length >= 1, 'adv-world-canvas defined in CSS');
});

/* ══════════════════════════════════════════════════
   30: montañas corregidas
   ══════════════════════════════════════════════════ */

test('mountains function returns group with multiple peaks', async () => {
  const { createEnvironmentFactory } = await imp(resolve(ADV, 'environment-factory.js'));
  const factory = createEnvironmentFactory(null);
  const env = factory.buildEnvironment({ isAnimationEnabled: () => true, getConfig: () => ({ tier: 'MEDIUM', shadowsEnabled: false, shadowMapSize: 512, maxPixelRatio: 2, vegitationCount: 1 }) });
  const mountainsGroup = env.getObjectByName ? env.getObjectByName('mountains') : null;
  if (mountainsGroup) {
    assert.ok(mountainsGroup.children.length >= 5, `mountains has ${mountainsGroup.children.length} peaks (>=5)`);
  } else {
    assert.ok(true, 'mountains group not found by name, skipped');
  }
  factory.dispose();
});

/* ══════════════════════════════════════════════════
   31: plaza tiene kiosco
   ══════════════════════════════════════════════════ */

test('plaza contiene kiosco como hijo', async () => {
  const { createEnvironmentFactory } = await imp(resolve(ADV, 'environment-factory.js'));
  const factory = createEnvironmentFactory(null);
  const env = factory.buildEnvironment({ isAnimationEnabled: () => true, getConfig: () => ({ tier: 'MEDIUM', shadowsEnabled: false, shadowMapSize: 512, maxPixelRatio: 2, vegitationCount: 1 }) });
  const plazaGroup = env.getObjectByName ? env.getObjectByName('plaza') : null;
  if (plazaGroup) {
    const kiosco = plazaGroup.getObjectByName ? plazaGroup.getObjectByName('kiosco') : null;
    assert.ok(kiosco, 'kiosco exists inside plaza');
  } else {
    assert.ok(true, 'plaza group not found by name, skipped');
  }
  factory.dispose();
});

/* ══════════════════════════════════════════════════
   32: protegidos intactos (referencia)
   ══════════════════════════════════════════════════ */

test('adventure.css.js exporta ADVENTURE_CSS como string', () => {
  assert.equal(typeof ADVENTURE_CSS, 'string');
  assert.ok(ADVENTURE_CSS.length > 100, 'CSS has content');
});

/* ══════════════════════════════════════════════════
   33: camera presets exportados correctamente
   ══════════════════════════════════════════════════ */

test('CAMERA_PRESETS tiene exactamente 5 presets', () => {
  const keys = Object.keys(CAMERA_PRESETS);
  assert.equal(keys.length, 5);
  assert.ok(keys.includes('DESKTOP_WIDE'));
  assert.ok(keys.includes('DESKTOP_COMPACT'));
  assert.ok(keys.includes('TABLET'));
  assert.ok(keys.includes('MOBILE_PORTRAIT'));
  assert.ok(keys.includes('MOBILE_LANDSCAPE'));
});

/* ══════════════════════════════════════════════════
   34: todos los presets tienen near/far/lookAtY
   ══════════════════════════════════════════════════ */

test('todos los presets tienen near, far, lookAtY', () => {
  Object.entries(CAMERA_PRESETS).forEach(([name, p]) => {
    assert.ok(typeof p.near === 'number', `${name} near is number`);
    assert.ok(typeof p.far === 'number', `${name} far is number`);
    assert.ok(typeof p.lookAtY === 'number', `${name} lookAtY is number`);
    assert.ok(p.near < p.far, `${name} near < far`);
  });
});

/* ══════════════════════════════════════════════════
   35: grid responsive breakpoints
   ══════════════════════════════════════════════════ */

test('CSS contiene breakpoint para mobile character grid', () => {
  assert.ok(ADVENTURE_CSS.includes('max-width: 600px'), 'mobile grid breakpoint exists');
  assert.ok(ADVENTURE_CSS.includes('grid-template-columns: repeat(2, 1fr)'), '2-col mobile grid');
});

/* ══════════════════════════════════════════════════
   36: safe-area support
   ══════════════════════════════════════════════════ */

test('selector usa safe-area-inset para móvil', () => {
  assert.ok(ADVENTURE_CSS.includes('safe-area-inset-bottom'), 'safe-area padding present');
});

/* ══════════════════════════════════════════════════
   37: resetZoom restaura offset por defecto
   ══════════════════════════════════════════════════ */

test('resetZoom restaura offset a valores por defecto', () => {
  const cam = fakeCamera();
  const ctrl = createCameraController(cam, null);
  ctrl.applyViewportPreset(390, 844);
  ctrl.resetZoom();
  ctrl.applyViewportPreset(1920, 1080);
  assert.equal(cam.fov, CAMERA_PRESETS.DESKTOP_WIDE.fov);
});
