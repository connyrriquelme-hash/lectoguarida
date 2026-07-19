/**
 * vegetation-factory.js
 * Fábrica de vegetación chilena low-poly con geometrías y materiales compartidos.
 */

import * as THREE from './vendor/three.module.js';

function makeCache() {
  var geometries = {};
  var materials = {};
  return {
    geo: function (key, build) { if (!geometries[key]) geometries[key] = build(); return geometries[key]; },
    mat: function (key, build) { if (!materials[key]) materials[key] = build(); return materials[key]; },
    dispose: function () {
      Object.keys(geometries).forEach(function (k) { try { geometries[k].dispose(); } catch (e) {} });
      Object.keys(materials).forEach(function (k) { try { materials[k].dispose(); } catch (e) {} });
    }
  };
}

export function createVegetationFactory(cache) {
  var shared = cache || makeCache();

  function copihue() {
    var g = new THREE.Group();
    var stem = new THREE.Mesh(
      shared.geo('copihue-stem', function () { return new THREE.CylinderGeometry(0.03, 0.05, 0.6, 6); }),
      shared.mat('copihue-stem', function () { return new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.9 }); })
    );
    stem.position.y = 0.3;
    var leaf = new THREE.Mesh(
      shared.geo('copihue-leaf', function () { return new THREE.SphereGeometry(0.18, 8, 6); }),
      shared.mat('copihue-leaf', function () { return new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.8 }); })
    );
    leaf.scale.set(1, 1.6, 0.4);
    leaf.position.y = 0.6;
    var flower = new THREE.Mesh(
      shared.geo('copihue-flower', function () { return new THREE.SphereGeometry(0.12, 8, 6); }),
      shared.mat('copihue-flower', function () { return new THREE.MeshStandardMaterial({ color: 0xe53935, roughness: 0.6 }); })
    );
    flower.position.set(0, 0.72, 0.1);
    g.add(stem, leaf, flower);
    return g;
  }

  function araucaria() {
    var g = new THREE.Group();
    var trunk = new THREE.Mesh(
      shared.geo('araucaria-trunk', function () { return new THREE.CylinderGeometry(0.12, 0.2, 1.4, 7); }),
      shared.mat('araucaria-trunk', function () { return new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 1 }); })
    );
    trunk.position.y = 0.7;
    for (var i = 0; i < 3; i++) {
      var tier = new THREE.Mesh(
        shared.geo('araucaria-tier', function () { return new THREE.ConeGeometry(0.7 - i * 0.18, 0.5, 7); }),
        shared.mat('araucaria-tier', function () { return new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.9 }); })
      );
      tier.position.y = 1.1 + i * 0.35;
      g.add(tier);
    }
    g.add(trunk);
    return g;
  }

  function fern() {
    var g = new THREE.Group();
    for (var i = 0; i < 5; i++) {
      var blade = new THREE.Mesh(
        shared.geo('fern-blade', function () { return new THREE.ConeGeometry(0.05, 0.5, 4); }),
        shared.mat('fern-blade', function () { return new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.9 }); })
      );
      blade.position.y = 0.25;
      blade.rotation.z = (i / 5) * Math.PI - Math.PI / 2;
      blade.position.x = Math.cos(i / 5 * Math.PI * 2) * 0.1;
      g.add(blade);
    }
    return g;
  }

  function totora() {
    var g = new THREE.Group();
    var stalk = new THREE.Mesh(
      shared.geo('totora-stalk', function () { return new THREE.CylinderGeometry(0.04, 0.05, 1.1, 5); }),
      shared.mat('totora-stalk', function () { return new THREE.MeshStandardMaterial({ color: 0x9ccc65, roughness: 1 }); })
    );
    stalk.position.y = 0.55;
    var tip = new THREE.Mesh(
      shared.geo('totora-tip', function () { return new THREE.ConeGeometry(0.08, 0.25, 5); }),
      shared.mat('totora-tip', function () { return new THREE.MeshStandardMaterial({ color: 0x7cb342, roughness: 1 }); })
    );
    tip.position.y = 1.15;
    g.add(stalk, tip);
    return g;
  }

  function flower(color) {
    var g = new THREE.Group();
    var stem = new THREE.Mesh(
      shared.geo('flower-stem', function () { return new THREE.CylinderGeometry(0.02, 0.02, 0.3, 5); }),
      shared.mat('flower-stem', function () { return new THREE.MeshStandardMaterial({ color: 0x2e7d32 }); })
    );
    stem.position.y = 0.15;
    var head = new THREE.Mesh(
      shared.geo('flower-head', function () { return new THREE.SphereGeometry(0.08, 8, 6); }),
      shared.mat('flower-head-' + color, function () { return new THREE.MeshStandardMaterial({ color: color, roughness: 0.7 }); })
    );
    head.position.y = 0.32;
    g.add(stem, head);
    return g;
  }

  function rock() {
    var m = new THREE.Mesh(
      shared.geo('rock', function () { return new THREE.DodecahedronGeometry(0.3, 0); }),
      shared.mat('rock', function () { return new THREE.MeshStandardMaterial({ color: 0x9e9e9e, roughness: 1 }); })
    );
    m.position.y = 0.15;
    m.scale.y = 0.7;
    return m;
  }

  return {
    create: function (kind) {
      switch (kind) {
        case 'copihue': return copihue();
        case 'araucaria': return araucaria();
        case 'fern': return fern();
        case 'totora': return totora();
        case 'flower-yellow': return flower(0xffd166);
        case 'flower-coral': return flower(0xff8c69);
        case 'rock': return rock();
        default: return flower(0xffd166);
      }
    },
    dispose: function () { shared.dispose(); }
  };
}
