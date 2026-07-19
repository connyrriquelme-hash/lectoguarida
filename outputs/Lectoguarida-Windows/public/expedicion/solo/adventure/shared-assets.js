/**
 * shared-assets.js
 * Caché de geometrías y materiales compartidos entre fábricas de personajes.
 */

import * as THREE from './vendor/three.module.js';

export function createSharedAssets() {
  var geoCache = {};
  var matCache = {};

  function geo(key, build) {
    if (!geoCache[key]) geoCache[key] = build();
    return geoCache[key];
  }
  function mat(key, color, opts) {
    if (!matCache[key]) {
      opts = opts || {};
      var m = new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.8 }, opts));
      matCache[key] = m;
    }
    return matCache[key];
  }

  return {
    geo: geo,
    mat: mat,
    dispose: function () {
      Object.keys(geoCache).forEach(function (k) { try { geoCache[k].dispose(); } catch (e) {} });
      Object.keys(matCache).forEach(function (k) { try { matCache[k].dispose(); } catch (e) {} });
    }
  };
}
