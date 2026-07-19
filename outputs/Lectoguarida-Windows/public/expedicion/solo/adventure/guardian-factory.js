/**
 * guardian-factory.js
 * Construye a los cuatro guardianes originales de fauna chilena.
 */

import * as THREE from './vendor/three.module.js';
import { createSharedAssets } from './shared-assets.js';
import { GUARDIANS } from './adventure-config.js';

export function createGuardianFactory() {
  var assets = createSharedAssets();

  function ranita(palette) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(
      assets.geo('gu-body', function () { return new THREE.SphereGeometry(0.5, 16, 12); }),
      assets.mat('gu-rina', palette.primary)
    );
    body.scale.set(1, 0.8, 1);
    body.position.y = 0.5;
    body.castShadow = true;
    var scarf = new THREE.Mesh(
      assets.geo('gu-scarf', function () { return new THREE.TorusGeometry(0.3, 0.08, 8, 16); }),
      assets.mat('gu-rina-scarf', palette.secondary)
    );
    scarf.rotation.x = Math.PI / 2;
    scarf.position.y = 0.8;
    var eyeGeo = assets.geo('gu-eye', function () { return new THREE.SphereGeometry(0.1, 8, 6); });
    var eyeMat = assets.mat('gu-eye', 0xffffff);
    var pupil = assets.mat('gu-pupil', 0x222222);
    var eL = new THREE.Mesh(eyeGeo, eyeMat); eL.position.set(-0.18, 0.7, 0.36);
    var eR = new THREE.Mesh(eyeGeo, eyeMat); eR.position.set(0.18, 0.7, 0.36);
    var pL = new THREE.Mesh(assets.geo('gu-pupil-g', function () { return new THREE.SphereGeometry(0.05, 6, 4); }), pupil);
    pL.position.set(-0.18, 0.7, 0.44);
    var pR = new THREE.Mesh(assets.geo('gu-pupil-g', function () { return new THREE.SphereGeometry(0.05, 6, 4); }), pupil);
    pR.position.set(0.18, 0.7, 0.44);
    // fern leaves on back (costal fusion)
    var fernMat = assets.mat('gu-rina-fern', 0x2e8b57);
    var f1 = new THREE.Mesh(assets.geo('gu-rina-fern1', function () { return new THREE.ConeGeometry(0.08, 0.5, 5); }), fernMat);
    f1.position.set(0, 0.95, -0.3); f1.rotation.x = -0.4;
    var f2 = new THREE.Mesh(assets.geo('gu-rina-fern2', function () { return new THREE.ConeGeometry(0.06, 0.4, 5); }), fernMat);
    f2.position.set(-0.12, 0.9, -0.28); f2.rotation.z = 0.3;
    var f3 = new THREE.Mesh(assets.geo('gu-rina-fern3', function () { return new THREE.ConeGeometry(0.06, 0.4, 5); }), fernMat);
    f3.position.set(0.12, 0.9, -0.28); f3.rotation.z = -0.3;
    // big lily pad
    var pad = new THREE.Mesh(
      assets.geo('gu-rina-pad', function () { return new THREE.CylinderGeometry(0.55, 0.55, 0.08, 16); }),
      assets.mat('gu-rina-pad', palette.accent)
    );
    pad.position.y = 0.04;
    g.add(body, scarf, eL, eR, pL, pR, f1, f2, f3, pad);
    g.userData.fernLeaves = [f1, f2, f3];
    return g;
  }

  function chucao(palette) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(
      assets.geo('gu-chucao-body', function () { return new THREE.SphereGeometry(0.45, 16, 12); }),
      assets.mat('gu-chispa', palette.primary)
    );
    body.scale.set(1, 1.1, 1);
    body.position.y = 0.55;
    var belly = new THREE.Mesh(
      assets.geo('gu-chucao-belly', function () { return new THREE.SphereGeometry(0.3, 12, 10); }),
      assets.mat('gu-chispa-belly', palette.secondary)
    );
    belly.scale.set(0.8, 1, 0.6); belly.position.set(0, 0.5, 0.2);
    var beak = new THREE.Mesh(
      assets.geo('gu-beak', function () { return new THREE.ConeGeometry(0.1, 0.3, 6); }),
      assets.mat('gu-beak', 0xffb300)
    );
    beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.7, 0.45);
    // copihue petals (fusion)
    var petalMat = assets.mat('gu-chispa-petal', 0xe53935);
    var p1 = new THREE.Mesh(assets.geo('gu-chispa-p1', function () { return new THREE.SphereGeometry(0.12, 8, 6); }), petalMat);
    p1.position.set(0, 0.5, 0.35); p1.scale.set(1, 1.4, 0.4);
    g.add(body, belly, beak, p1);
    return g;
  }

  function pudu(palette) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(
      assets.geo('gu-pudu-body', function () { return new THREE.CapsuleGeometry(0.35, 0.4, 4, 10); }),
      assets.mat('gu-pulo', palette.primary)
    );
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.6;
    var head = new THREE.Mesh(
      assets.geo('gu-pudu-head', function () { return new THREE.SphereGeometry(0.28, 14, 10); }),
      assets.mat('gu-pulo-head', palette.primary)
    );
    head.position.set(0.4, 0.8, 0);
    var cape = new THREE.Mesh(
      assets.geo('gu-pudu-cape', function () { return new THREE.SphereGeometry(0.3, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2); }),
      assets.mat('gu-pulo-cape', palette.secondary)
    );
    cape.position.set(0, 0.9, 0);
    // boldo leaves (fusion)
    var leafMat = assets.mat('gu-pulo-leaf', 0x6fae4f);
    var l1 = new THREE.Mesh(assets.geo('gu-pulo-l1', function () { return new THREE.SphereGeometry(0.12, 8, 6); }), leafMat);
    l1.position.set(0, 0.95, 0.05); l1.scale.set(1, 1.3, 0.3);
    g.add(body, head, cape, l1);
    return g;
  }

  function monito(palette) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(
      assets.geo('gu-mono-body', function () { return new THREE.SphereGeometry(0.4, 16, 12); }),
      assets.mat('gu-mimi', palette.primary)
    );
    body.position.y = 0.55;
    var tail = new THREE.Mesh(
      assets.geo('gu-mono-tail', function () { return new THREE.TorusGeometry(0.35, 0.08, 8, 16, Math.PI * 1.4); }),
      assets.mat('gu-mimi-tail', palette.secondary)
    );
    tail.position.set(-0.3, 0.4, -0.2);
    tail.rotation.z = Math.PI;
    var head = new THREE.Mesh(
      assets.geo('gu-mono-head', function () { return new THREE.SphereGeometry(0.3, 14, 10); }),
      assets.mat('gu-mimi-head', palette.primary)
    );
    head.position.y = 1.0;
    // quila vine tail (fusion)
    var vineMat = assets.mat('gu-mimi-vine', 0x7cb342);
    var vine = new THREE.Mesh(assets.geo('gu-mimi-vine', function () { return new THREE.CylinderGeometry(0.03, 0.03, 0.5, 5); }), vineMat);
    vine.position.set(-0.35, 0.35, -0.2); vine.rotation.z = 0.6;
    g.add(body, tail, head, vine);
    return g;
  }

  var builders = { rina: ranita, chispa: chucao, pulo: pudu, mimi: monito };

  function create(guardianId) {
    var def = GUARDIANS[guardianId];
    if (!def) return null;
    var root = new THREE.Group();
    root.name = 'guardian-' + guardianId;
    var model = (builders[guardianId] || ranita)(def.palette);
    root.add(model);
    root.userData.guardianId = guardianId;
    return root;
  }

  return {
    create: create,
    listGuardians: function () { return Object.keys(GUARDIANS); },
    dispose: function () { assets.dispose(); }
  };
}
