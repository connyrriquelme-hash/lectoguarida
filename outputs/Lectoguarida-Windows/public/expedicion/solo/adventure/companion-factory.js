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
      assets.geo('comp-body', function () { return new THREE.SphereGeometry(0.18, 12, 10); }),
      assets.mat('comp-body', COMPANION.palette.body, { emissive: COMPANION.palette.glow, emissiveIntensity: 0.6 })
    );
    var glow = new THREE.Mesh(
      assets.geo('comp-glow', function () { return new THREE.SphereGeometry(0.28, 12, 10); }),
      assets.mat('comp-glow', COMPANION.palette.glow, { transparent: true, opacity: 0.25 })
    );
    var wingGeo = assets.geo('comp-wing', function () { return new THREE.CircleGeometry(0.15, 8); });
    var wingMat = assets.mat('comp-wing', COMPANION.palette.glow, { transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    var wL = new THREE.Mesh(wingGeo, wingMat); wL.position.set(-0.2, 0, 0); wL.rotation.y = Math.PI / 2;
    var wR = new THREE.Mesh(wingGeo, wingMat); wR.position.set(0.2, 0, 0); wR.rotation.y = -Math.PI / 2;
    root.add(body, glow, wL, wR);
    root.userData.parts = { body: body, glow: glow, wings: [wL, wR] };
    root.userData.baseIntensity = 0.6;
    return root;
  }

  function animate(companion, t, target) {
    if (!companion) return;
    companion.position.y = 1.8 + Math.sin(t * 2) * 0.2;
    if (target) {
      var dx = target.x - companion.position.x;
      var dz = target.z - companion.position.z;
      companion.position.x += dx * 0.04;
      companion.position.z += dz * 0.04;
    }
    if (companion.userData.parts && companion.userData.parts.glow) {
      companion.userData.parts.glow.material.opacity = 0.2 + Math.abs(Math.sin(t * 3)) * 0.15;
    }
    if (companion.userData.parts && companion.userData.parts.wings) {
      var flap = Math.sin(t * 18) * 0.6;
      companion.userData.parts.wings[0].rotation.z = flap;
      companion.userData.parts.wings[1].rotation.z = -flap;
    }
  }

  return {
    create: create,
    animate: animate,
    dispose: function () { assets.dispose(); }
  };
}
