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
    var book = new THREE.Mesh(
      assets.geo('gu-book', function () { return new THREE.BoxGeometry(0.4, 0.3, 0.08); }),
      assets.mat('gu-book', palette.accent)
    );
    book.position.set(0, 1.0, 0.1);
    book.rotation.x = -0.3;
    g.add(body, scarf, eL, eR, pL, pR, book);
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
    g.add(body, belly, beak);
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
    g.add(body, head, cape);
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
    g.add(body, tail, head);
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
