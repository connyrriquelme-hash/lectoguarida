/**
 * mobile-controls.js
 * Controles universales: joystick de movimiento, botones táctiles,
 * rotación de cámara con drag, zoom con pinza y botón de recentrado.
 * Visible en escritorio, tablet y celular. Usa Pointer Events.
 */

var DEAD_ZONE = 0.14;
var SENSITIVITY_NORMAL = 1.0;
var SENSITIVITY_LOW = 0.6;
var SENSITIVITY_HIGH = 1.5;

export function createMobileControls(container, callbacks) {
  var joystickActive = false;
  var joyCenter = { x: 0, y: 0 };
  var joyVec = { x: 0, z: 0 };
  var activePointerId = null;
  var elements = [];
  var sensitivity = SENSITIVITY_NORMAL;

  var cameraController = null;
  var canvas = null;
  var rightDragActive = false;
  var lastPointerX = 0;
  var lastPointerY = 0;
  var pinchStartDist = 0;
  var pinchActive = false;
  var consumedPointers = new Set();

  function makeButton(label, className, onPress) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'adv-mobile-btn ' + (className || '');
    btn.setAttribute('aria-label', label);
    btn.textContent = label;
    btn.style.cssText = 'min-width:56px;min-height:56px;border-radius:50%;border:none;background:var(--accent,#4fd1c5);color:#fff;font-size:1.1rem;font-weight:700;touch-action:none;cursor:pointer;';
    btn.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      consumedPointers.add(e.pointerId);
      onPress();
    });
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      onPress();
    });
    container.appendChild(btn);
    elements.push(btn);
    return btn;
  }

  function buildJoystick() {
    var wrap = document.createElement('div');
    wrap.className = 'adv-joystick';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Joystick de movimiento');
    wrap.style.cssText = 'position:absolute;left:18px;bottom:18px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(79,209,197,0.12) 0%,rgba(45,106,79,0.18) 100%);border:3px solid rgba(79,209,197,0.4);touch-action:none;z-index:14;pointer-events:auto;box-shadow:0 4px 12px rgba(0,0,0,0.25),inset 0 1px 3px rgba(255,255,255,0.2);';

    var knob = document.createElement('div');
    knob.className = 'adv-joystick-knob';
    knob.style.cssText = 'position:absolute;left:40px;top:40px;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle,#b8f0e8 0%,#4fd1c5 70%,#2d9e8f 100%);box-shadow:0 2px 8px rgba(0,0,0,0.3),0 0 12px rgba(79,209,197,0.4);transition:transform 0.08s ease;pointer-events:none;';
    wrap.appendChild(knob);

    var maxRadius = 40;

    function applyDeadZone(dx, dy) {
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < DEAD_ZONE) return { x: 0, z: 0 };
      var adjusted = (dist - DEAD_ZONE) / (1 - DEAD_ZONE);
      if (adjusted > 1) adjusted = 1;
      var nx = (dx / dist) * adjusted * sensitivity;
      var ny = (dy / dist) * adjusted * sensitivity;
      return { x: nx, z: ny };
    }

    function moveKnob(px, py) {
      var dx = px - joyCenter.x;
      var dy = py - joyCenter.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxRadius) { dx = dx / dist * maxRadius; dy = dy / dist * maxRadius; }
      knob.style.left = (40 + dx) + 'px';
      knob.style.top = (40 + dy) + 'px';
      if (dist > maxRadius * 0.3) {
        knob.style.transform = 'scale(1.1)';
      } else {
        knob.style.transform = 'scale(1)';
      }
      var vec = applyDeadZone(dx / maxRadius, dy / maxRadius);
      joyVec.x = vec.x;
      joyVec.z = vec.z;
    }

    function resetKnob() {
      knob.style.left = '40px';
      knob.style.top = '40px';
      knob.style.transform = 'scale(1)';
      joyVec.x = 0;
      joyVec.z = 0;
    }

    wrap.addEventListener('pointerdown', function (e) {
      if (activePointerId !== null) return;
      e.preventDefault();
      e.stopPropagation();
      activePointerId = e.pointerId;
      consumedPointers.add(e.pointerId);
      joystickActive = true;
      try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      var rect = wrap.getBoundingClientRect();
      joyCenter.x = rect.left + rect.width / 2;
      joyCenter.y = rect.top + rect.height / 2;
      moveKnob(e.clientX, e.clientY);
    });

    wrap.addEventListener('pointermove', function (e) {
      if (e.pointerId !== activePointerId) return;
      e.preventDefault();
      moveKnob(e.clientX, e.clientY);
    });

    function endPointer(e) {
      if (e.pointerId !== activePointerId) return;
      e.preventDefault();
      activePointerId = null;
      joystickActive = false;
      resetKnob();
      try { wrap.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
    }

    wrap.addEventListener('pointerup', endPointer);
    wrap.addEventListener('pointercancel', endPointer);
    wrap.addEventListener('lostpointercapture', endPointer);

    container.appendChild(wrap);
    elements.push(wrap);
  }

  function buildCameraTouchZone() {
    var zone = document.createElement('div');
    zone.className = 'adv-camera-touch-zone';
    zone.style.cssText = 'position:absolute;right:0;top:0;width:50%;height:60%;touch-action:none;z-index:1;pointer-events:auto;';
    zone.setAttribute('aria-hidden', 'true');

    zone.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        rightDragActive = true;
        lastPointerX = e.touches[0].clientX;
        lastPointerY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        rightDragActive = false;
        pinchActive = true;
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchStartDist = Math.sqrt(dx * dx + dy * dy);
      }
    }, { passive: true });

    zone.addEventListener('touchmove', function (e) {
      if (rightDragActive && e.touches.length === 1 && cameraController) {
        var dx = e.touches[0].clientX - lastPointerX;
        var dy = e.touches[0].clientY - lastPointerY;
        lastPointerX = e.touches[0].clientX;
        lastPointerY = e.touches[0].clientY;
        cameraController.rotateBy(-dx * 0.008, dy * 0.005);
      } else if (pinchActive && e.touches.length === 2 && cameraController) {
        var dx2 = e.touches[0].clientX - e.touches[1].clientX;
        var dy2 = e.touches[0].clientY - e.touches[1].clientY;
        var dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        var delta = (pinchStartDist - dist) * 0.05;
        cameraController.zoomBy(delta);
        pinchStartDist = dist;
      }
    }, { passive: true });

    zone.addEventListener('touchend', function (e) {
      if (e.touches.length < 2) pinchActive = false;
      if (e.touches.length === 0) rightDragActive = false;
    }, { passive: true });

    container.appendChild(zone);
    elements.push(zone);
  }

  function build() {
    buildJoystick();
    buildCameraTouchZone();
    makeButton('\u25B6', 'adv-interact', function () { if (callbacks.onInteract) callbacks.onInteract(); });
    makeButton('\u266A', 'adv-listen', function () { if (callbacks.onListen) callbacks.onListen(); });
    makeButton('\u21BB', 'adv-repeat', function () { if (callbacks.onRepeat) callbacks.onRepeat(); });
    makeButton('?', 'adv-hint', function () { if (callbacks.onHint) callbacks.onHint(); });
    makeButton('\u23F8', 'adv-pause', function () { if (callbacks.onPause) callbacks.onPause(); });

    var recenterBtn = makeButton('\u2299', 'adv-recenter', function () {
      if (cameraController) cameraController.recenter();
    });
    recenterBtn.setAttribute('aria-label', 'Centrar c\u00e1mara');
    recenterBtn.style.cssText += 'position:absolute;top:18px;right:18px;z-index:14;min-width:44px;min-height:44px;';

    elements.forEach(function (el) {
      if (el.classList.contains('adv-mobile-btn') && !el.classList.contains('adv-recenter')) {
        el.style.position = 'absolute';
        el.style.bottom = '24px';
      }
    });
    var right = elements.filter(function (el) {
      return el.classList.contains('adv-mobile-btn') && !el.classList.contains('adv-recenter');
    });
    right.forEach(function (el, i) {
      el.style.right = (18 + i * 64) + 'px';
    });
  }

  build();

  return {
    getJoystickVector: function () { return { x: joyVec.x, z: joyVec.z }; },
    isJoystickActive: function () { return joystickActive; },
    isPointerConsumed: function (id) { return consumedPointers.has(id); },
    setCameraController: function (cc) { cameraController = cc; },
    setCanvas: function (c) { canvas = c; },
    setSensitivity: function (level) {
      if (level === 'low') sensitivity = SENSITIVITY_LOW;
      else if (level === 'high') sensitivity = SENSITIVITY_HIGH;
      else sensitivity = SENSITIVITY_NORMAL;
    },
    getSensitivity: function () { return sensitivity; },
    setJoystickVisible: function (visible) {
      var joy = container.querySelector('.adv-joystick');
      if (joy) joy.style.display = visible ? '' : 'none';
    },
    isJoystickVisible: function () {
      var joy = container.querySelector('.adv-joystick');
      return joy ? joy.style.display !== 'none' : false;
    },
    destroy: function () {
      consumedPointers.clear();
      activePointerId = null;
      elements.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
      elements = [];
    }
  };
}
