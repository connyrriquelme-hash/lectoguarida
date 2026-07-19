/**
 * environment-factory.js
 * Construye el terreno del Humedal de las Palabras: plaza, laguna, islas,
 * puente, senderos, montañas y cielo. Usa geometrías/materiales compartidos.
 */

import * as THREE from './vendor/three.module.js';
import { ZONES } from './adventure-config.js';

export function createEnvironmentFactory(cache) {
  var geometries = cache && cache.geo ? cache : null;
  var geoCache = {};
  var matCache = {};

  function geo(key, build) {
    if (!geoCache[key]) geoCache[key] = build();
    return geoCache[key];
  }
  function mat(key, build) {
    if (!matCache[key]) matCache[key] = build();
    return matCache[key];
  }

  function ground() {
    var g = new THREE.Mesh(
      geo('ground', function () { return new THREE.PlaneGeometry(120, 120, 1, 1); }),
      mat('ground', function () { return new THREE.MeshStandardMaterial({ color: 0x8bcf7a, roughness: 1 }); })
    );
    g.rotation.x = -Math.PI / 2;
    g.receiveShadow = true;
    return g;
  }

  function water(quality) {
    var animated = quality ? quality.isAnimationEnabled() : true;
    var g = new THREE.Mesh(
      geo('water', function () { return new THREE.CircleGeometry(11, 32); }),
      mat('water', function () { return new THREE.MeshStandardMaterial({ color: 0x4fd1c5, transparent: true, opacity: 0.8, roughness: 0.2, metalness: 0.1 }); })
    );
    g.rotation.x = -Math.PI / 2;
    g.position.set(0, 0.02, -26);
    g.userData.animated = animated;
    g.userData.baseY = 0.02;
    return g;
  }

  function plaza() {
    var g = new THREE.Group();
    g.name = 'plaza';

    var disc = new THREE.Mesh(
      geo('plaza', function () { return new THREE.CylinderGeometry(6, 6, 0.1, 24); }),
      mat('plaza', function () { return new THREE.MeshStandardMaterial({ color: 0xe8d8b0, roughness: 0.95 }); })
    );
    disc.position.y = 0.05;
    disc.receiveShadow = true;
    g.add(disc);

    var kiosco = new THREE.Group();
    kiosco.name = 'kiosco';
    var kioscoBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.4, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 1 })
    );
    kioscoBase.position.y = 0.2;
    kiosco.add(kioscoBase);
    var kioscoRoof = new THREE.Mesh(
      new THREE.ConeGeometry(1.8, 1.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.8 })
    );
    kioscoRoof.position.y = 1.1;
    kiosco.add(kioscoRoof);
    var kioscoPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 1.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 1 })
    );
    kioscoPole.position.y = 1.0;
    kiosco.add(kioscoPole);
    kiosco.position.set(0, 0, -2);
    g.add(kiosco);

    var treePositions = [[-4, -3], [4, -3], [-3, 2], [3, 2]];
    treePositions.forEach(function (tp) {
      var tree = new THREE.Group();
      var trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 2, 6),
        new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 1 })
      );
      trunk.position.y = 1;
      tree.add(trunk);
      var canopy = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 1, flatShading: true })
      );
      canopy.position.y = 2.4;
      canopy.scale.set(1, 0.7, 1);
      tree.add(canopy);
      tree.position.set(tp[0], 0, tp[1]);
      g.add(tree);
    });

    return g;
  }

  function bridge() {
    var g = new THREE.Group();
    var deck = new THREE.Mesh(
      geo('bridge-deck', function () { return new THREE.BoxGeometry(3, 0.2, 8); }),
      mat('bridge', function () { return new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 1 }); })
    );
    deck.position.set(0, 0.1, -13);
    g.add(deck);
    return g;
  }

  function path() {
    var g = new THREE.Mesh(
      geo('path', function () { return new THREE.PlaneGeometry(2, 28); }),
      mat('path', function () { return new THREE.MeshStandardMaterial({ color: 0xd7c39a, roughness: 1 }); })
    );
    g.rotation.x = -Math.PI / 2;
    g.position.set(0, 0.06, -13);
    return g;
  }

  function mountains() {
    var g = new THREE.Group();
    g.name = 'mountains';

    var peaks = [
      { x: -50, z: -55, h: 12, r: 16, color: 0xc8d8e4 },
      { x: -38, z: -48, h: 8, r: 12, color: 0xd0dce6 },
      { x: 52, z: -52, h: 14, r: 18, color: 0xc0d2e0 },
      { x: 40, z: -44, h: 6, r: 10, color: 0xd8e4ec },
      { x: -4, z: -58, h: 10, r: 14, color: 0xd4e0ea },
      { x: 20, z: -54, h: 7, r: 11, color: 0xdce8f0 },
      { x: -24, z: -56, h: 9, r: 13, color: 0xd6e2ec }
    ];

    peaks.forEach(function (p, i) {
      var segments = 5 + (i % 3);
      var m = new THREE.Mesh(
        new THREE.ConeGeometry(p.r, p.h, segments),
        new THREE.MeshStandardMaterial({ color: p.color, roughness: 1, flatShading: true })
      );
      m.position.set(p.x, p.h * 0.5, p.z);
      m.rotation.y = (i * 1.3) % (Math.PI * 2);
      m.castShadow = false;
      m.receiveShadow = false;
      g.add(m);
    });

    return g;
  }

  function buildEnvironment(quality) {
    var group = new THREE.Group();
    group.name = 'environment';
    group.add(ground());
    group.add(water(quality));
    group.add(plaza());
    group.add(path());
    group.add(bridge());
    group.add(mountains());
    return group;
  }

  function dispose() {
    Object.keys(geoCache).forEach(function (k) { try { geoCache[k].dispose(); } catch (e) {} });
    Object.keys(matCache).forEach(function (k) { try { matCache[k].dispose(); } catch (e) {} });
  }

  return {
    buildEnvironment: buildEnvironment,
    zones: ZONES,
    dispose: dispose
  };
}
