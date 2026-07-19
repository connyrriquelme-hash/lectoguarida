/**
 * camera-controller.js
 * Cámara isométrica elevada que sigue al jugador con suavizado y límites.
 */

import * as THREE from './vendor/three.module.js';

export function createCameraController(camera, target) {
  var offset = new THREE.Vector3(0, 14, 14);
  var lookAt = new THREE.Vector3();
  var desired = new THREE.Vector3();
  var bounds = { minX: -55, maxX: 55, minZ: -55, maxZ: 55 };
  var zoom = 1;
  var reducedMotion = false;

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
    lookAt.lerp(new THREE.Vector3(target.position.x, target.position.y + 1, target.position.z), smooth);
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

  return {
    update: update,
    focusOn: focusOn,
    setBounds: setBounds,
    clampPosition: clampPosition,
    resetZoom: function () { zoom = 1; offset.set(0, 14, 14); }
  };
}
