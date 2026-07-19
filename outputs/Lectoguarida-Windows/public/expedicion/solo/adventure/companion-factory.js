/**
 * companion-factory.js
 * Construye a Lumiércoles, la luciérnaga guía.
 */

import * as THREE from './vendor/three.module.js';
import { createSharedAssets } from './shared-assets.js';
import { COMPANION } from './adventure-config.js';

export function createCompanionFactory() {
  var assets = createSharedAssets();

  function create() {
    var root = new THREE.Group();
    root.name = 'companion-' + COMPANION.id;
    var body = new THREE.Mesh(
      assets.geo('comp-body', function () { return new THREE.SphereGeometry(0.14, 12, 10); }),
      assets.mat('comp-body', COMPANION.palette.body, { emissive: COMPANION.palette.glow, emissiveIntensity: 0.6 })
    );
    var glow = new THREE.Mesh(
      assets.geo('comp-glow', function () { return new THREE.SphereGeometry(0.26, 12, 10); }),
      assets.mat('comp-glow', COMPANION.palette.glow, { transparent: true, opacity: 0.2 })
    );
    var wingGeo = assets.geo('comp-wing', function () { return new THREE.CircleGeometry(0.22, 10); });
    var wingMat = assets.mat('comp-wing', COMPANION.palette.wing, { transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    var wL = new THREE.Mesh(wingGeo, wingMat); wL.position.set(-0.18, 0, 0); wL.rotation.y = Math.PI / 2;
    var wR = new THREE.Mesh(wingGeo, wingMat); wR.position.set(0.18, 0, 0); wR.rotation.y = -Math.PI / 2;
    var antenna = new THREE.Mesh(
      assets.geo('comp-antenna', function () { return new THREE.CylinderGeometry(0.01, 0.01, 0.18, 4); }),
      assets.mat('comp-antenna', COMPANION.palette.body)
    );
    antenna.position.set(0, 0.2, 0);
    root.add(body, glow, wL, wR, antenna);
    root.userData.parts = { body: body, glow: glow, wings: [wL, wR] };
    root.userData.baseIntensity = 0.6;
    return root;
  }

  function animate(companion, t, target) {
    if (!companion) return;
    companion.position.y = 1.8 + Math.sin(t * 2.4) * 0.18;
    if (target) {
      var dx = target.x - companion.position.x;
      var dz = target.z - companion.position.z;
      companion.position.x += dx * 0.05;
      companion.position.z += dz * 0.05;
    }
    if (companion.userData.parts && companion.userData.parts.glow) {
      companion.userData.parts.glow.material.opacity = 0.15 + Math.abs(Math.sin(t * 3)) * 0.12;
    }
    if (companion.userData.parts && companion.userData.parts.wings) {
      var flap = Math.sin(t * 22) * 0.7;
      companion.userData.parts.wings[0].rotation.z = flap;
      companion.userData.parts.wings[1].rotation.z = -flap;
    }
  }

  return {
    create: create,
    animate: animate,
    pollenCount: function (tier) { return COMPANION.pollenPool[tier] || 12; },
    dispose: function () { assets.dispose(); }
  };
}
