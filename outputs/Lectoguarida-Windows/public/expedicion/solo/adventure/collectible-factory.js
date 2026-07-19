/**
 * collectible-factory.js
 * Crea los objetos coleccionables pedagógicos (campanas de palabras, etc.).
 */

import * as THREE from './vendor/three.module.js';
import { createSharedAssets } from './shared-assets.js';

export function createCollectibleFactory() {
  var assets = createSharedAssets();

  function bell(palette) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(
      assets.geo('col-bell', function () { return new THREE.CylinderGeometry(0.18, 0.28, 0.4, 12, 1, true); }),
      assets.mat('col-bell', palette || 0xffd166, { side: THREE.DoubleSide, metalness: 0.3, roughness: 0.4 })
    );
    body.position.y = 0.3;
    var top = new THREE.Mesh(
      assets.geo('col-bell-top', function () { return new THREE.SphereGeometry(0.18, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2); }),
      assets.mat('col-bell', palette || 0xffd166, { metalness: 0.3, roughness: 0.4 })
    );
    top.position.y = 0.5;
    g.add(body, top);
    return g;
  }

  function seed(palette) {
    var g = new THREE.Mesh(
      assets.geo('col-seed', function () { return new THREE.SphereGeometry(0.2, 10, 8); }),
      assets.mat('col-seed', palette || 0x9ccc65)
    );
    g.scale.set(1, 1.4, 1);
    g.position.y = 0.3;
    return g;
  }

  function stone(palette) {
    var g = new THREE.Mesh(
      assets.geo('col-stone', function () { return new THREE.DodecahedronGeometry(0.22, 0); }),
      assets.mat('col-stone', palette || 0xb0bec5)
    );
    g.position.y = 0.25;
    return g;
  }

  function word(palette) {
    var g = new THREE.Group();
    var card = new THREE.Mesh(
      assets.geo('col-word', function () { return new THREE.PlaneGeometry(0.4, 0.5); }),
      assets.mat('col-word', palette || 0xfff7ed, { side: THREE.DoubleSide })
    );
    card.position.y = 0.4;
    g.add(card);
    return g;
  }

  var builders = { bell: bell, seed: seed, stone: stone, word: word };

  function create(kind, id, palette) {
    var root = new THREE.Group();
    root.name = 'collectible-' + id;
    var model = (builders[kind] || bell)(palette);
    root.add(model);
    root.userData.collectibleId = id;
    root.userData.kind = kind;
    root.userData.collected = false;
    root.userData.bobBaseY = 0.4;
    return root;
  }

  function animate(collectible, t) {
    if (!collectible || collectible.userData.collected) return;
    collectible.position.y = collectible.userData.bobBaseY + Math.sin(t * 2 + collectible.position.x) * 0.1;
    collectible.rotation.y = t * 1.2;
  }

  return {
    create: create,
    animate: animate,
    dispose: function () { assets.dispose(); }
  };
}
