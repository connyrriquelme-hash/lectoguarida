/**
 * interaction-controller.js
 * Raycasting para seleccionar guardianes, portales y coleccionables.
 * Soporta teclado (Enter/Espacio) y puntero/touch.
 */

import * as THREE from './vendor/three.module.js';

export function createInteractionController(camera, domElement, scene) {
  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  var interactables = [];
  var onSelect = null;

  function setInteractables(list) { interactables = list || []; }

  function pick(clientX, clientY) {
    var rect = domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(interactables, true);
    if (hits.length === 0) return null;
    var obj = hits[0].object;
    while (obj && !obj.userData.collectibleId && !obj.userData.guardianId && !obj.userData.zoneId && obj.parent) {
      obj = obj.parent;
    }
    return obj;
  }

  function handlePointer(clientX, clientY) {
    var obj = pick(clientX, clientY);
    if (obj && onSelect) onSelect(obj);
  }

  function setOnSelect(fn) { onSelect = fn; }

  return {
    setInteractables: setInteractables,
    setOnSelect: setOnSelect,
    handlePointer: handlePointer,
    pick: pick
  };
}
