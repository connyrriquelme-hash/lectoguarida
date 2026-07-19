/**
 * neblin-controller.js
 * Controla el modelo y las etapas visuales de Neblín (nube costera confundida).
 * No es un enemigo: se aclara al resolver actividades.
 */

import * as THREE from './vendor/three.module.js';
import { createSharedAssets } from './shared-assets.js';
import { NEBLIN } from './adventure-config.js';

export function createNeblinController() {
  var assets = createSharedAssets();
  var root = new THREE.Group();
  root.name = 'neblin';

  var body = new THREE.Mesh(
    assets.geo('neblin-body', function () { return new THREE.SphereGeometry(1.4, 18, 14); }),
    assets.mat('neblin-body', NEBLIN.palette.dense, { transparent: true, opacity: 0.85, flatShading: false })
  );
  body.scale.set(1.2, 0.85, 1);
  var eyeGeo = assets.geo('neblin-eye', function () { return new THREE.SphereGeometry(0.16, 8, 6); });
  var eyeMat = assets.mat('neblin-eye', 0x223344);
  var eL = new THREE.Mesh(eyeGeo, eyeMat); eL.position.set(-0.35, 0.2, 1.2);
  var eR = new THREE.Mesh(eyeGeo, eyeMat); eR.position.set(0.35, 0.2, 1.2);

  var puff = new THREE.Mesh(
    assets.geo('neblin-puff', function () { return new THREE.SphereGeometry(0.6, 12, 10); }),
    assets.mat('neblin-puff', NEBLIN.palette.dense, { transparent: true, opacity: 0.7 })
  );
  puff.position.set(-1.2, 0.1, 0.2); puff.scale.set(1, 0.7, 1);
  var puff2 = new THREE.Mesh(
    assets.geo('neblin-puff2', function () { return new THREE.SphereGeometry(0.5, 12, 10); }),
    assets.mat('neblin-puff2', NEBLIN.palette.dense, { transparent: true, opacity: 0.7 })
  );
  puff2.position.set(1.2, 0.1, 0.1); puff2.scale.set(1, 0.7, 1);

  root.add(body, eL, eR, puff, puff2);
  root.userData.state = NEBLIN.states.DENSE;

  function setState(state) {
    root.userData.state = state;
    var color = NEBLIN.palette.dense;
    if (state === NEBLIN.states.CLEARING) color = NEBLIN.palette.clearing;
    else if (state === NEBLIN.states.FRIENDLY) color = NEBLIN.palette.friendly;
    [body, puff, puff2].forEach(function (m) {
      try { m.material.color.setHex(color); } catch (e) {}
    });
    body.material.opacity = state === NEBLIN.states.FRIENDLY ? 0.6 : 0.85;
  }

  function animate(t) {
    root.position.y = (root.userData.baseY || 2.5) + Math.sin(t * 0.8) * 0.25;
    puff.position.y = Math.sin(t * 1.3 + 1) * 0.15;
    puff2.position.y = Math.cos(t * 1.1) * 0.15;
  }

  return {
    root: root,
    setState: setState,
    animate: animate,
    setPosition: function (x, y, z) { root.position.set(x, y, z); root.userData.baseY = y; },
    dispose: function () { assets.dispose(); }
  };
}
