/**
 * camera-controller.js
 * Cámara isométrica elevada que sigue al jugador con suavizado y límites.
 * Incluye presets responsivos para distintos viewports.
 */

import * as THREE from './vendor/three.module.js';

/**
 * Presets de cámara para distintos tipos de viewport.
 * Calculados para lograr: terreno 65-78% altura visible, cielo 18-30%, personaje 7-12% altura.
 */
const CAMERA_PRESETS = {
  DESKTOP_WIDE: {
    // 1920x1080, 1366x768 — terreno 68-75%, cielo 18-25%
    fov: 34,
    zoom: 1.08,
    offsetY: 10,
    offsetZ: 10,
    lookAtY: 1.2,
    near: 0.1,
    far: 200
  },
  DESKTOP_COMPACT: {
    // 941x608, 1366x600 — altura reducida
    fov: 32,
    zoom: 1.12,
    offsetY: 9,
    offsetZ: 9,
    lookAtY: 1.0,
    near: 0.1,
    far: 200
  },
  TABLET: {
    // 768x1024 — vertical
    fov: 36,
    zoom: 1.15,
    offsetY: 9,
    offsetZ: 8,
    lookAtY: 1.0,
    near: 0.1,
    far: 200
  },
  MOBILE_PORTRAIT: {
    // 390x844, 360x640 — móvil vertical
    fov: 34,
    zoom: 1.20,
    offsetY: 8,
    offsetZ: 8,
    lookAtY: 0.9,
    near: 0.1,
    far: 200
  },
  MOBILE_LANDSCAPE: {
    // 844x390 — móvil horizontal
    fov: 36,
    zoom: 1.15,
    offsetY: 9,
    offsetZ: 8,
    lookAtY: 1.0,
    near: 0.1,
    far: 200
  }
};

/**
 * Selecciona el preset adecuado según dimensiones del viewport.
 * Usa altura útil y aspect ratio, no solo ancho.
 */
function resolveCameraPreset(width, height) {
  const shorter = Math.min(width, height);
  const isLandscape = width > height;
  const isMobile = shorter < 430;
  const isTablet = !isMobile && width < 1024 && height >= 768 && width < 900;

  if (isMobile) {
    return isLandscape ? CAMERA_PRESETS.MOBILE_LANDSCAPE : CAMERA_PRESETS.MOBILE_PORTRAIT;
  }
  if (isTablet) {
    return CAMERA_PRESETS.TABLET;
  }
  if (height < 700) {
    return CAMERA_PRESETS.DESKTOP_COMPACT;
  }
  return CAMERA_PRESETS.DESKTOP_WIDE;
}

/**
 * Aplica un preset a la cámara y controlador.
 */
function applyPreset(camera, controller, preset) {
  camera.fov = preset.fov;
  camera.near = preset.near;
  camera.far = preset.far;
  camera.updateProjectionMatrix();

  if (controller) {
    if (controller._setZoom) {
      controller._setZoom(preset.zoom);
    }
    if (controller._setOffset) {
      controller._setOffset(0, preset.offsetY, preset.offsetZ);
    }
  }
}

export function createCameraController(camera, target) {
  var offset = new THREE.Vector3(0, 14, 14);
  var lookAt = new THREE.Vector3();
  var desired = new THREE.Vector3();
  var bounds = { minX: -55, maxX: 55, minZ: -55, maxZ: 55 };
  var zoom = 1;
  var reducedMotion = false;
  var currentPreset = null;

  try {
    reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) { /* noop */ }

  function update(dt) {
    if (!target) return;
    var smooth = reducedMotion ? 1 : Math.min(1, dt * 4);
    desired.set(
      target.position.x + offset.x * zoom,
      target.position.y + offset.y * zoom,
      target.position.z + offset.z * zoom
    );
    camera.position.lerp(desired, smooth);
    lookAt.lerp(new THREE.Vector3(target.position.x, target.position.y + (currentPreset ? currentPreset.lookAtY : 1), target.position.z), smooth);
    camera.lookAt(lookAt);
  }

  function focusOn(position, distance) {
    if (distance) zoom = distance;
    offset.set(0, 14 * distance, 14 * distance);
  }

  function setBounds(b) { bounds = b || bounds; }

  function clampPosition(pos) {
    pos.x = Math.max(bounds.minX, Math.min(bounds.maxX, pos.x));
    pos.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, pos.z));
  }

  function applyViewportPreset(width, height) {
    var preset = resolveCameraPreset(width, height);
    currentPreset = preset;
    applyPreset(camera, { _setZoom: function (z) { zoom = z; }, _setOffset: function (x, y, z) { offset.set(x, y, z); } }, preset);
  }

  function setTarget(newTarget) { target = newTarget; }

  return {
    update: update,
    focusOn: focusOn,
    setBounds: setBounds,
    clampPosition: clampPosition,
    resetZoom: function () { zoom = 1; offset.set(0, 14, 14); currentPreset = null; },
    applyViewportPreset: applyViewportPreset,
    setTarget: setTarget
  };
}

export { CAMERA_PRESETS, resolveCameraPreset, applyPreset };