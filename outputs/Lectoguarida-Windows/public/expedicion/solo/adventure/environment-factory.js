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
    var g = new THREE.Mesh(
      geo('plaza', function () { return new THREE.CylinderGeometry(6, 6, 0.1, 24); }),
      mat('plaza', function () { return new THREE.MeshStandardMaterial({ color: 0xe8d8b0, roughness: 0.95 }); })
    );
    g.position.y = 0.05;
    g.receiveShadow = true;
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
    var positions = [[-40, -50], [40, -50], [0, 56], [-44, 20], [44, 20]];
    positions.forEach(function (p) {
      var m = new THREE.Mesh(
        geo('mountain', function () { return new THREE.ConeGeometry(14, 16, 5); }),
        mat('mountain', function () { return new THREE.MeshStandardMaterial({ color: 0x9fb8c9, roughness: 1, flatShading: true }); })
      );
      m.position.set(p[0], 8, p[1]);
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
