/**
 * player-factory.js
 * Construye los cuatro personajes jugables originales y expone animaciones.
 */

import * as THREE from './vendor/three.module.js';
import { createSharedAssets } from './shared-assets.js';
import { CHARACTERS, REFINED_CHARACTERS } from './adventure-config.js';

export function createPlayerFactory() {
  var assets = createSharedAssets();

  function buildBody(palette, motif) {
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

    // motif accent (territorial identity)
    if (motif === 'sea-glass') {
      var glass = new THREE.Mesh(
        assets.geo('player-glass', function () { return new THREE.IcosahedronGeometry(0.12, 0); }),
        assets.mat('player-glass', 0x9fe3d6, { transparent: true, opacity: 0.7, roughness: 0.2 })
      );
      glass.position.set(0.18, 0.7, 0.32);
      g.add(glass);
    } else if (motif === 'sietecolores') {
      var cap = new THREE.Mesh(
        assets.geo('player-cap', function () { return new THREE.ConeGeometry(0.22, 0.25, 8); }),
        assets.mat('player-cap', 0xff8c69)
      );
      cap.position.set(0, 1.5, 0);
      g.add(cap);
    } else if (motif === 'chagual-totora') {
      var bag = new THREE.Mesh(
        assets.geo('player-bag', function () { return new THREE.CylinderGeometry(0.1, 0.14, 0.3, 8); }),
        assets.mat('player-bag', 0x9ad0f0)
      );
      bag.position.set(0.22, 0.7, 0.1);
      g.add(bag);
    } else if (motif === 'doca') {
      var cape = new THREE.Mesh(
        assets.geo('player-cape', function () { return new THREE.SphereGeometry(0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2); }),
        assets.mat('player-cape', 0x6fcf97)
      );
      cape.position.set(0, 0.8, -0.12);
      g.add(cape);
    }

    g.userData.parts = { body: body, head: head, pack: pack };
    return g;
  }

  function create(characterId) {
    var def = null;
    for (var i = 0; i < REFINED_CHARACTERS.length; i++) if (REFINED_CHARACTERS[i].id === characterId) def = REFINED_CHARACTERS[i];
    if (!def) def = REFINED_CHARACTERS[0];
    var root = new THREE.Group();
    root.name = 'player-' + def.id;
    var model = buildBody(def.palette, def.motif);
    root.add(model);
    root.userData.characterId = def.id;
    root.userData.motif = def.motif;
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
