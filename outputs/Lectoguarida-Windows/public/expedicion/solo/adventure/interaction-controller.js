/**
 * interaction-controller.js
 * Raycasting para seleccionar guardianes, portales, coleccionables
 * y terreno caminable (click-to-move).
 */

import * as THREE from './vendor/three.module.js';

export function createInteractionController(camera, domElement, scene) {
  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2();
  var interactables = [];
  var groundPlane = null;
  var onSelect = null;
  var onGroundClick = null;
  var groundObjects = [];

  function setInteractables(list) { interactables = list || []; }
  function setGroundObjects(list) { groundObjects = list || []; }

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

  function pickGround(clientX, clientY) {
    var rect = domElement.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    var targets = groundObjects.length > 0 ? groundObjects : scene.children;
    var hits = raycaster.intersectObjects(targets, true);
    for (var i = 0; i < hits.length; i++) {
      var p = hits[i].point;
      var dxw = p.x;
      var dzw = p.z + 26;
      if (Math.sqrt(dxw * dxw + dzw * dzw) > 11) {
        return { x: p.x, z: p.z };
      }
    }
    return null;
  }

  function handlePointer(clientX, clientY) {
    var obj = pick(clientX, clientY);
    if (obj && onSelect) {
      onSelect(obj);
      return true;
    }
    var ground = pickGround(clientX, clientY);
    if (ground && onGroundClick) {
      onGroundClick(ground);
    }
    return false;
  }

  function setOnSelect(fn) { onSelect = fn; }
  function setOnGroundClick(fn) { onGroundClick = fn; }

  return {
    setInteractables: setInteractables,
    setGroundObjects: setGroundObjects,
    setOnSelect: setOnSelect,
    setOnGroundClick: setOnGroundClick,
    handlePointer: handlePointer,
    pick: pick,
    pickGround: pickGround
  };
}
