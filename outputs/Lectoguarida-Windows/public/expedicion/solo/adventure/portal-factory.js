/**
 * portal-factory.js
 * Construye los portales pedagógicos de cada zona con estilos visuales distintos.
 */

import * as THREE from './vendor/three.module.js';
import { createSharedAssets } from './shared-assets.js';
import { ZONES } from './adventure-config.js';

var PORTAL_STYLE = {
  'rhyme-catcher': { colorA: 0x4fd1c5, colorB: 0xff7eb6, ring: 'torus', label: 'Rimas' },
  'initial-sound-detector': { colorA: 0x6fcf97, colorB: 0xffd166, ring: 'wood', label: 'Sonido inicial' },
  'syllable-counter': { colorA: 0xffb86b, colorB: 0x4c8bf5, ring: 'stones', label: 'Sílabas' },
  'final-sound-catcher': { colorA: 0x9b6dff, colorB: 0x9ad0f0, ring: 'wind', label: 'Sonido final' }
};

export function createPortalFactory() {
  var assets = createSharedAssets();

  function buildRing(style) {
    var ring = new THREE.Mesh(
      assets.geo('portal-ring', function () { return new THREE.TorusGeometry(1.2, 0.18, 10, 24); }),
      assets.mat('portal-ring', style.colorA, { emissive: style.colorA, emissiveIntensity: 0.3 })
    );
    ring.position.y = 1.4;
    return ring;
  }

  function buildColumn(style) {
    var c = new THREE.Group();
    var left = new THREE.Mesh(
      assets.geo('portal-col', function () { return new THREE.CylinderGeometry(0.18, 0.22, 2.8, 8); }),
      assets.mat('portal-col', style.colorB)
    );
    left.position.set(-1.2, 1.4, 0);
    var right = left.clone();
    right.position.x = 1.2;
    var top = new THREE.Mesh(
      assets.geo('portal-cap', function () { return new THREE.BoxGeometry(2.9, 0.3, 0.5); }),
      assets.mat('portal-cap', style.colorB)
    );
    top.position.y = 2.8;
    c.add(left, right, top);
    return c;
  }

  function createForZone(zone) {
    if (!zone || !zone.portal) return null;
    var style = PORTAL_STYLE[zone.gameId] || { colorA: 0x4fd1c5, colorB: 0xffd166, label: zone.name };
    var root = new THREE.Group();
    root.name = 'portal-' + zone.id;
    root.add(buildColumn(style));
    root.add(buildRing(style));

    var icon = new THREE.Mesh(
      assets.geo('portal-icon', function () { return new THREE.OctahedronGeometry(0.35, 0); }),
      assets.mat('portal-icon-' + zone.gameId, style.colorA, { emissive: style.colorA, emissiveIntensity: 0.4 })
    );
    icon.position.y = 1.4;
    root.add(icon);
    root.userData.icon = icon;
    root.userData.zoneId = zone.id;
    root.userData.gameId = zone.gameId;
    root.userData.locked = !!zone.locked;
    root.userData.upcoming = !!zone.upcoming;
    return root;
  }

  return {
    createForZone: createForZone,
    createAll: function () {
      return ZONES.filter(function (z) { return z.portal; }).map(function (z) { return createForZone(z); });
    },
    animate: function (portal, t) {
      if (!portal || !portal.userData.icon) return;
      portal.userData.icon.rotation.y = t * 1.5;
      portal.userData.icon.position.y = 1.4 + Math.sin(t * 2) * 0.15;
    },
    dispose: function () { assets.dispose(); }
  };
}
