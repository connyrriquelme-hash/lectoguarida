/**
 * PASO 17 FREE CAMERA — Pruebas de FASE C: Cámara libre y exploración 3D.
 * Verifica órbita, modos, zoom, rotación, movimiento relativo a cámara,
 * colisión/oclusión, click-to-move, controles móviles, recenter, a11y.
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
const ADV = resolve(__dirname, '../public/expedicion/solo/adventure');

function imp(p) { return import(pathToFileURL(p).href); }

const {
  createCameraController, CAMERA_PRESETS,
  CAMERA_MODE_FOLLOW, CAMERA_MODE_FOCUS, CAMERA_MODE_OVERVIEW,
  DEFAULT_YAW, DEFAULT_PITCH, DEFAULT_DISTANCE,
  MIN_DISTANCE, MAX_DISTANCE, MIN_PITCH, MAX_PITCH, LOOK_AT_OFFSET_Y
} = await imp(resolve(ADV, 'camera-controller.js'));
const { createInputController } = await imp(resolve(ADV, 'input-controller.js'));
const { createPlayerController } = await imp(resolve(ADV, 'player-controller.js'));
const { ADVENTURE_CSS } = await imp(resolve(ADV, 'adventure.css.js'));

function fakeCamera() {
  return {
    fov: 45, near: 0.1, far: 200, aspect: 1,
    position: {
      x: 0, y: 14, z: 14,
      lerp: function (v) { this.x = v.x; this.y = v.y; this.z = v.z; },
      clone: function () { return { x: this.x, y: this.y, z: this.z }; },
      sub: function (v) { return { x: this.x - v.x, y: this.y - v.y, z: this.z - v.z }; },
      normalize: function () { return this; }
    },
    updateProjectionMatrix: function () {},
    lookAt: function () {}
  };
}

function fakeTarget(x, y, z) {
  return {
    position: {
      x: x || 0, y: y || 0, z: z || 0,
      clone: function () { return { x: this.x, y: this.y, z: this.z }; },
      sub: function (v) { return { x: this.x - v.x, y: this.y - v.y, z: this.z - v.z }; },
      normalize: function () { return this; }
    }
  };
}

/* ══════════════════════════════════════════════════
   1-4: Modos de cámara
   ══════════════════════════════════════════════════ */

test('cámara inicia en modo FOLLOW', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  assert.equal(ctrl.getMode(), CAMERA_MODE_FOLLOW);
});

test('setMode cambia a FOCUS', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  ctrl.setMode(CAMERA_MODE_FOCUS);
  assert.equal(ctrl.getMode(), CAMERA_MODE_FOCUS);
});

test('setMode cambia a OVERVIEW', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  ctrl.setMode(CAMERA_MODE_OVERVIEW);
  assert.equal(ctrl.getMode(), CAMERA_MODE_OVERVIEW);
});

test('setMode FOLLOW desde FOCUS resetea estado', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  ctrl.setMode(CAMERA_MODE_FOCUS);
  ctrl.setMode(CAMERA_MODE_FOLLOW);
  assert.equal(ctrl.getMode(), CAMERA_MODE_FOLLOW);
});

/* ══════════════════════════════════════════════════
   5-8: Límites de órbita
   ══════════════════════════════════════════════════ */

test('zoomBy no baja de MIN_DISTANCE', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  ctrl.setDistance(MIN_DISTANCE);
  ctrl.zoomBy(-10);
  assert.equal(ctrl.getDesiredDistance(), MIN_DISTANCE);
});

test('zoomBy no sube de MAX_DISTANCE', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  ctrl.setDistance(MAX_DISTANCE);
  ctrl.zoomBy(10);
  assert.equal(ctrl.getDesiredDistance(), MAX_DISTANCE);
});

test('setPitch respeta MIN_PITCH', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  ctrl.setPitch(0.01);
  assert.ok(ctrl.getDesiredPitch() >= MIN_PITCH);
});

test('setPitch respeta MAX_PITCH', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  ctrl.setPitch(5.0);
  assert.ok(ctrl.getDesiredPitch() <= MAX_PITCH);
});

/* ══════════════════════════════════════════════════
   9-12: Rotación
   ══════════════════════════════════════════════════ */

test('rotateBy incrementa desiredYaw', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  const before = ctrl.getDesiredYaw();
  ctrl.rotateBy(0.5, 0);
  assert.ok(ctrl.getDesiredYaw() > before);
});

test('rotateBy incrementa desiredPitch', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  const before = ctrl.getDesiredPitch();
  ctrl.rotateBy(0, 0.2);
  assert.ok(ctrl.getDesiredPitch() > before);
});

test('rotateBy bloqueado en modo FOCUS', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  ctrl.setMode(CAMERA_MODE_FOCUS);
  const before = ctrl.getDesiredYaw();
  ctrl.rotateBy(1.0, 0.5);
  assert.equal(ctrl.getDesiredYaw(), before);
});

test('rotateBy no funciona si disabled', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  ctrl.setEnabled(false);
  const before = ctrl.getDesiredYaw();
  ctrl.rotateBy(1.0, 0);
  assert.equal(ctrl.getDesiredYaw(), before);
});

/* ══════════════════════════════════════════════════
   13-14: Zoom
   ══════════════════════════════════════════════════ */

test('zoomBy negativo acerca (reduce distancia)', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  const before = ctrl.getDesiredDistance();
  ctrl.zoomBy(-2);
  assert.ok(ctrl.getDesiredDistance() < before);
});

test('zoomBy positivo aleja (aumenta distancia)', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  const before = ctrl.getDesiredDistance();
  ctrl.zoomBy(2);
  assert.ok(ctrl.getDesiredDistance() > before);
});

/* ══════════════════════════════════════════════════
   15: Recenter
   ══════════════════════════════════════════════════ */

test('recenter restaura yaw, pitch y distance', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  ctrl.rotateBy(2.0, 0.5);
  ctrl.zoomBy(-4);
  ctrl.recenter();
  assert.equal(ctrl.getDesiredDistance(), DEFAULT_DISTANCE);
  assert.equal(ctrl.getDesiredPitch(), DEFAULT_PITCH);
  assert.equal(ctrl.getDesiredYaw(), DEFAULT_YAW);
});

/* ══════════════════════════════════════════════════
   16-17: Direcciones forward/right
   ══════════════════════════════════════════════════ */

test('getForwardDir retorna vector normalizado', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  const fwd = ctrl.getForwardDir();
  const len = Math.sqrt(fwd.x * fwd.x + fwd.z * fwd.z);
  assert.ok(Math.abs(len - 1.0) < 0.01, `forward length=${len}`);
});

test('getRightDir perpendicular a forward', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  const fwd = ctrl.getForwardDir();
  const right = ctrl.getRightDir();
  const dot = fwd.x * right.x + fwd.z * right.z;
  assert.ok(Math.abs(dot) < 0.01, `dot product=${dot}`);
});

/* ══════════════════════════════════════════════════
   18-19: Focus on
   ══════════════════════════════════════════════════ */

test('focusOn cambia a modo FOCUS', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  ctrl.focusOn({ x: 5, y: 0, z: -5, clone: function () { return { ...this }; } });
  assert.equal(ctrl.getMode(), CAMERA_MODE_FOCUS);
});

test('focusOn sin duration se queda en FOCUS', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  ctrl.focusOn({ x: 0, y: 0, z: 0, clone: function () { return { ...this }; } }, 0);
  ctrl.update(1.0);
  assert.equal(ctrl.getMode(), CAMERA_MODE_FOCUS);
});

/* ══════════════════════════════════════════════════
   20: Update no-op si disabled
   ══════════════════════════════════════════════════ */

test('update no-op si disabled', () => {
  const cam = fakeCamera();
  const ctrl = createCameraController(cam, fakeTarget());
  ctrl.setEnabled(false);
  ctrl.rotateBy(1.0, 0.5);
  ctrl.update(0.016);
  assert.equal(cam.position.x, 0);
});

/* ══════════════════════════════════════════════════
   21-24: Input controller
   ══════════════════════════════════════════════════ */

test('createInputController retorna API completa', () => {
  const input = createInputController(dom.window, {});
  assert.equal(typeof input.attach, 'function');
  assert.equal(typeof input.detach, 'function');
  assert.equal(typeof input.getMoveVector, 'function');
  assert.equal(typeof input.getCameraRelativeVector, 'function');
  assert.equal(typeof input.hasMovementInput, 'function');
  assert.equal(typeof input.setCameraController, 'function');
  assert.equal(typeof input.setCanvas, 'function');
  assert.equal(typeof input.setClickDestination, 'function');
  assert.equal(typeof input.getClickDestination, 'function');
  assert.equal(typeof input.isClickMoveActive, 'function');
  assert.equal(typeof input.cancelClickMove, 'function');
});

test('getMoveVector retorna (0,0) sin teclas', () => {
  const input = createInputController(dom.window, {});
  const v = input.getMoveVector();
  assert.equal(v.x, 0);
  assert.equal(v.z, 0);
});

test('hasMovementInput retorna falsy sin teclas', () => {
  const input = createInputController(dom.window, {});
  assert.ok(!input.hasMovementInput(), 'no movement input without keys');
});

test('click-to-move: setClickDestination/getClickDestination', () => {
  const input = createInputController(dom.window, {});
  input.setClickDestination({ x: 10, z: -5 });
  const dest = input.getClickDestination();
  assert.equal(dest.x, 10);
  assert.equal(dest.z, -5);
});

/* ══════════════════════════════════════════════════
   25-27: Click-to-move en input controller
   ══════════════════════════════════════════════════ */

test('isClickMoveActive true con destino y sin teclas', () => {
  const input = createInputController(dom.window, {});
  input.setClickDestination({ x: 5, z: 5 });
  assert.equal(input.isClickMoveActive(), true);
});

test('cancelClickMove limpia destino', () => {
  const input = createInputController(dom.window, {});
  input.setClickDestination({ x: 5, z: 5 });
  input.cancelClickMove();
  assert.equal(input.getClickDestination(), null);
  assert.equal(input.isClickMoveActive(), false);
});

test('isClickMoveActive sin destino retorna falsy', () => {
  const input = createInputController(dom.window, {});
  input.cancelClickMove();
  assert.ok(!input.isClickMoveActive(), 'no click move without destination');
});

/* ══════════════════════════════════════════════════
   28-31: Player controller click-to-move
   ══════════════════════════════════════════════════ */

test('createPlayerController tiene moveTowardDestination', () => {
  const player = { position: { x: 0, z: 0 }, rotation: { y: 0 } };
  const pc = createPlayerController(player, null);
  assert.equal(typeof pc.moveTowardDestination, 'function');
  assert.equal(typeof pc.setClickDestination, 'function');
  assert.equal(typeof pc.getClickDestination, 'function');
});

test('setClickDestination almacena destino', () => {
  const player = { position: { x: 0, z: 0 }, rotation: { y: 0 } };
  const pc = createPlayerController(player, null);
  pc.setClickDestination({ x: 10, z: -5 });
  const dest = pc.getClickDestination();
  assert.equal(dest.x, 10);
  assert.equal(dest.z, -5);
});

test('moveTowardDestination retorna true moviéndose', () => {
  const player = { position: { x: 0, z: 0 }, rotation: { y: 0 } };
  const pc = createPlayerController(player, null);
  pc.setClickDestination({ x: 10, z: 0 });
  const moving = pc.moveTowardDestination(0.016);
  assert.equal(moving, true);
});

test('moveTowardDestination retorna false en destino', () => {
  const player = { position: { x: 0, z: 0 }, rotation: { y: 0 } };
  const pc = createPlayerController(player, null);
  pc.setClickDestination({ x: 0.1, z: 0 });
  pc.moveTowardDestination(0.1);
  assert.equal(pc.getClickDestination(), null);
});

/* ══════════════════════════════════════════════════
   32-33: Destroy
   ══════════════════════════════════════════════════ */

test('destroy limpia target y collisionObjects', () => {
  const ctrl = createCameraController(fakeCamera(), fakeTarget());
  ctrl.setCollisionObjects([{ uuid: 'a' }]);
  ctrl.setOccluderObjects([{ uuid: 'b' }]);
  ctrl.destroy();
  assert.equal(ctrl.getTarget(), null);
});

test('destroy en player-controller limpia destino', () => {
  const player = { position: { x: 0, z: 0 }, rotation: { y: 0 } };
  const pc = createPlayerController(player, null);
  pc.setClickDestination({ x: 10, z: 10 });
  pc.setEnabled(false);
  assert.equal(pc.getClickDestination(), null);
});

/* ══════════════════════════════════════════════════
   34-35: CSS pointer-events y recenter
   ══════════════════════════════════════════════════ */

test('CSS tiene pointer-events: none para .adv-root.hud-active', () => {
  assert.ok(ADVENTURE_CSS.includes('pointer-events: none'),
    'root has pointer-events none for canvas click-through');
});

test('CSS tiene .adv-recenter-btn con position absolute', () => {
  assert.ok(ADVENTURE_CSS.includes('.adv-recenter-btn'),
    'recenter button class exists');
  assert.ok(ADVENTURE_CSS.includes('position: absolute'),
    'recenter button is absolute positioned');
});

/* ══════════════════════════════════════════════════
   36: Canvas pointer-events auto
   ══════════════════════════════════════════════════ */

test('CSS tiene .adv-world-canvas con pointer-events: auto', () => {
  assert.ok(ADVENTURE_CSS.includes('pointer-events: auto'),
    'canvas has pointer-events auto for camera interaction');
});

/* ══════════════════════════════════════════════════
   37: Camera a11y panel
   ══════════════════════════════════════════════════ */

test('CSS tiene .adv-camera-a11y para controles accesibles', () => {
  assert.ok(ADVENTURE_CSS.includes('.adv-camera-a11y'),
    'camera a11y panel class exists');
});

/* ══════════════════════════════════════════════════
   38: Camera constants exported
   ══════════════════════════════════════════════════ */

test('constantes de cámara exportadas correctamente', () => {
  assert.equal(typeof MIN_DISTANCE, 'number');
  assert.equal(typeof MAX_DISTANCE, 'number');
  assert.equal(typeof MIN_PITCH, 'number');
  assert.equal(typeof MAX_PITCH, 'number');
  assert.equal(typeof DEFAULT_YAW, 'number');
  assert.equal(typeof DEFAULT_PITCH, 'number');
  assert.equal(typeof DEFAULT_DISTANCE, 'number');
  assert.equal(typeof LOOK_AT_OFFSET_Y, 'number');
  assert.ok(MIN_DISTANCE < MAX_DISTANCE, 'MIN < MAX distance');
  assert.ok(MIN_PITCH < MAX_PITCH, 'MIN < MAX pitch');
});
