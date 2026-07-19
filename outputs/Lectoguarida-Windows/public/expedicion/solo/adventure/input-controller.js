/**
 * input-controller.js
 * Control de teclado (WASD/flechas) y clic-en-suelo para escritorio.
 */

export function createInputController(domElement, callbacks) {
  var keys = {};
  var clickTarget = null;
  var enabled = true;

  function onKeyDown(e) {
    if (!enabled) return;
    keys[e.key.toLowerCase()] = true;
    if (callbacks.onKey) callbacks.onKey(e.key, e);
  }
  function onKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
  }
  function onClick(e) {
    if (!enabled) return;
    if (callbacks.onClick) callbacks.onClick(e);
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

  function attach() {
    if (!target) return;
    target.addEventListener('keydown', onKeyDown);
    target.addEventListener('keyup', onKeyUp);
  }
  function detach() {
    if (!target) return;
    target.removeEventListener('keydown', onKeyDown);
    target.removeEventListener('keyup', onKeyUp);
  }

  return {
    attach: attach,
    detach: detach,
    getMoveVector: getMoveVector,
    setEnabled: function (v) { enabled = v; if (!v) keys = {}; },
    isEnabled: function () { return enabled; },
    onClick: onClick,
    bindClick: function (el) { if (el) el.addEventListener('click', onClick); },
    unbindClick: function (el) { if (el) el.removeEventListener('click', onClick); }
  };
}
