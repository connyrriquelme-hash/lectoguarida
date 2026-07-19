/**
 * player-factory.js
 * Construye los cuatro personajes jugables originales y expone animaciones.
 */

import * as THREE from './vendor/three.module.js';
import { createSharedAssets } from './shared-assets.js';
import { CHARACTERS } from './adventure-config.js';

export function createPlayerFactory() {
  var assets = createSharedAssets();

  function buildBody(palette) {
    var g = new THREE.Group();

    var body = new THREE.Mesh(
      assets.geo('player-body', function () { return new THREE.CapsuleGeometry(0.35, 0.5, 4, 10); }),
      assets.mat('player-body-' + palette.primary, palette.primary)
    );
    body.position.y = 0.65;
    body.castShadow = true;

    var head = new THREE.Mesh(
      assets.geo('player-head', function () { return new THREE.SphereGeometry(0.32, 16, 12); }),
      assets.mat('player-head-' + palette.accent, palette.accent)
    );
    head.position.y = 1.25;
    head.castShadow = true;

    var eyeGeo = assets.geo('player-eye', function () { return new THREE.SphereGeometry(0.05, 8, 6); });
    var eyeMat = assets.mat('player-eye', 0x222222);
    var eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.12, 1.3, 0.28);
    var eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.12, 1.3, 0.28);

    var pack = new THREE.Mesh(
      assets.geo('player-pack', function () { return new THREE.BoxGeometry(0.4, 0.4, 0.2); }),
      assets.mat('player-pack-' + palette.secondary, palette.secondary)
    );
    pack.position.set(0, 0.7, -0.32);

    g.add(body, head, eyeL, eyeR, pack);
    g.userData.parts = { body: body, head: head, pack: pack };
    return g;
  }

  function create(characterId) {
    var def = null;
    for (var i = 0; i < CHARACTERS.length; i++) if (CHARACTERS[i].id === characterId) def = CHARACTERS[i];
    if (!def) def = CHARACTERS[0];
    var root = new THREE.Group();
    root.name = 'player-' + def.id;
    var model = buildBody(def.palette);
    root.add(model);
    root.userData.characterId = def.id;
    root.userData.parts = model.userData.parts;
    root.userData.bobBaseY = 0;
    return root;
  }

  function animate(player, state, t) {
    if (!player || !player.userData.parts) return;
    var head = player.userData.parts.head;
    if (state === 'idle') {
      head.rotation.z = Math.sin(t * 1.5) * 0.08;
      player.position.y = player.userData.bobBaseY + Math.abs(Math.sin(t * 2)) * 0.04;
    } else if (state === 'walk') {
      head.rotation.z = 0;
      player.position.y = player.userData.bobBaseY + Math.abs(Math.sin(t * 10)) * 0.08;
    } else if (state === 'celebrate') {
      player.position.y = player.userData.bobBaseY + Math.abs(Math.sin(t * 8)) * 0.25;
      head.rotation.z = Math.sin(t * 8) * 0.2;
    }
  }

  function celebrate(player, t) { animate(player, 'celebrate', t); }

  return {
    create: create,
    animate: animate,
    celebrate: celebrate,
    listCharacters: function () { return CHARACTERS.slice(); },
    dispose: function () { assets.dispose(); }
  };
}
