/**
 * effects-manager.js
 * Sistema de partículas (luciérnagas/brisa) con límite por calidad.
 */

import * as THREE from './vendor/three.module.js';

export function createEffectsManager(scene, quality) {
  var maxParticles = quality ? quality.getMaxParticles() : 100;
  var count = Math.max(10, Math.min(maxParticles, 120));

  var positions = new Float32Array(count * 3);
  var velocities = [];
  for (var i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = Math.random() * 4 + 0.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    velocities.push({ x: (Math.random() - 0.5) * 0.01, y: Math.random() * 0.01 + 0.005, z: (Math.random() - 0.5) * 0.01 });
  }

  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var material = new THREE.PointsMaterial({
    color: 0xfff3a0,
    size: 0.18,
    transparent: true,
    opacity: 0.8,
    depthWrite: false
  });
  var points = new THREE.Points(geometry, material);
  scene.add(points);

  function update(t) {
    var attr = geometry.getAttribute('position');
    for (var i = 0; i < count; i++) {
      var v = velocities[i];
      attr.array[i * 3] += v.x;
      attr.array[i * 3 + 1] += v.y;
      attr.array[i * 3 + 2] += v.z;
      if (attr.array[i * 3 + 1] > 5) { attr.array[i * 3 + 1] = 0.5; }
      if (Math.abs(attr.array[i * 3]) > 30) attr.array[i * 3] *= -1;
      if (Math.abs(attr.array[i * 3 + 2]) > 30) attr.array[i * 3 + 2] *= -1;
    }
    attr.needsUpdate = true;
  }

  return {
    points: points,
    update: update,
    dispose: function () {
      try { scene.remove(points); } catch (e) {}
      try { geometry.dispose(); } catch (e) {}
      try { material.dispose(); } catch (e) {}
    }
  };
}
