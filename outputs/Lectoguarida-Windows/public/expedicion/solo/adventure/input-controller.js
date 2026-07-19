/**
 * input-controller.js
 * Control de teclado (WASD/flechas), rueda de zoom, arrastre de cámara y clic-en-suelo.
 * Movimiento relativo a la dirección de la cámara.
 */

export function createInputController(domElement, callbacks) {
  var keys = {};
  var enabled = true;
  var cameraController = null;
  var canvas = null;
  var isDraggingCamera = false;
  var lastPointerX = 0;
  var lastPointerY = 0;
  var rightDragActive = false;
  var moveTarget = null;
  var moveMarker = null;
  var clickMoveActive = false;
  var clickDestination = null;

  function onKeyDown(e) {
    if (!enabled) return;
    keys[e.key.toLowerCase()] = true;
    if (callbacks.onKey) callbacks.onKey(e.key, e);
  }
  function onKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
  }

  function onWheel(e) {
    if (!enabled || !cameraController) return;
    e.preventDefault();
    var delta = e.deltaY > 0 ? 1.5 : -1.5;
    cameraController.zoomBy(delta);
  }

  function onPointerDown(e) {
    if (!enabled || !canvas) return;
    if (e.target !== canvas) return;
    if (e.button === 2 || e.button === 1) {
      rightDragActive = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      e.preventDefault();
    }
  }

  function onPointerMove(e) {
    if (!rightDragActive || !cameraController) return;
    var dx = e.clientX - lastPointerX;
    var dy = e.clientY - lastPointerY;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    cameraController.rotateBy(-dx * 0.005, dy * 0.003);
  }

  function onPointerUp(e) {
    if (rightDragActive) {
      rightDragActive = false;
    }
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  var target = domElement || (typeof window !== 'undefined' ? window : null);

  function getMoveVector() {
    var v = { x: 0, z: 0 };
    if (keys['w'] || keys['arrowup']) v.z -= 1;
    if (keys['s'] || keys['arrowdown']) v.z += 1;
    if (keys['a'] || keys['arrowleft']) v.x -= 1;
    if (keys['d'] || keys['arrowright']) v.x += 1;
    var len = Math.sqrt(v.x * v.x + v.z * v.z);
    if (len > 0) { v.x /= len; v.z /= len; }
    return v;
  }

  function getCameraRelativeVector() {
    var raw = getMoveVector();
    if (!cameraController || (raw.x === 0 && raw.z === 0)) return raw;
    var forward = cameraController.getForwardDir();
    var right = cameraController.getRightDir();
    return {
      x: right.x * raw.x + forward.x * raw.z,
      z: right.z * raw.x + forward.z * raw.z
    };
  }

  function hasMovementInput() {
    return keys['w'] || keys['s'] || keys['a'] || keys['d'] ||
      keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright'];
  }

  function attach() {
    if (!target) return;
    target.addEventListener('keydown', onKeyDown);
    target.addEventListener('keyup', onKeyUp);
    if (canvas) {
      canvas.addEventListener('wheel', onWheel, { passive: false });
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('contextmenu', onContextMenu);
    }
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  function detach() {
    if (!target) return;
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('keyup', onKeyUp);
    if (canvas) {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('contextmenu', onContextMenu);
    }
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }

  return {
    attach: attach,
    detach: detach,
    getMoveVector: getMoveVector,
    getCameraRelativeVector: getCameraRelativeVector,
    hasMovementInput: hasMovementInput,
    setEnabled: function (v) { enabled = v; if (!v) keys = {}; },
    isEnabled: function () { return enabled; },
    setCameraController: function (cc) { cameraController = cc; },
    setCanvas: function (c) { canvas = c; },
    setClickDestination: function (dest) { clickDestination = dest; clickMoveActive = !!dest; },
    getClickDestination: function () { return clickDestination; },
    isClickMoveActive: function () { return clickMoveActive && !hasMovementInput(); },
    cancelClickMove: function () { clickDestination = null; clickMoveActive = false; },
    isRightDragActive: function () { return rightDragActive; }
  };
}
