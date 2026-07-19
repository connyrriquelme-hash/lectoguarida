/**
 * mobile-controls.js
 * Joystick virtual, botones táctiles, rotación de cámara con drag,
 * zoom con pinza y botón de recentrado.
 */

export function createMobileControls(container, callbacks) {
  var joystickActive = false;
  var joyCenter = { x: 0, y: 0 };
  var joyVec = { x: 0, z: 0 };
  var elements = [];
  var disposers = [];

  var cameraController = null;
  var canvas = null;
  var rightDragActive = false;
  var lastTouchX = 0;
  var lastTouchY = 0;
  var pinchStartDist = 0;
  var pinchActive = false;
  var rightHalfStart = 0;

  function makeButton(label, className, onPress) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'adv-mobile-btn ' + (className || '');
    btn.setAttribute('aria-label', label);
    btn.textContent = label;
    btn.style.cssText = 'min-width:56px;min-height:56px;border-radius:50%;border:none;background:var(--accent,#4fd1c5);color:#fff;font-size:1.1rem;font-weight:700;touch-action:none;cursor:pointer;';
    btn.addEventListener('touchstart', function (e) { e.preventDefault(); e.stopPropagation(); onPress(); }, { passive: false });
    btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); onPress(); });
    container.appendChild(btn);
    elements.push(btn);
    return btn;
  }

  function buildJoystick() {
    var wrap = document.createElement('div');
    wrap.className = 'adv-joystick';
    wrap.style.cssText = 'position:absolute;left:18px;bottom:18px;width:110px;height:110px;border-radius:50%;background:rgba(0,0,0,0.15);touch-action:none;z-index:15;';
    var knob = document.createElement('div');
    knob.style.cssText = 'position:absolute;left:35px;top:35px;width:40px;height:40px;border-radius:50%;background:var(--accent,#4fd1c5);';
    wrap.appendChild(knob);
    wrap.addEventListener('touchstart', function (e) {
      e.preventDefault();
      joystickActive = true;
      var rect = wrap.getBoundingClientRect();
      joyCenter.x = rect.left + rect.width / 2;
      joyCenter.y = rect.top + rect.height / 2;
      moveKnob(e.touches[0]);
    }, { passive: false });
    wrap.addEventListener('touchmove', function (e) {
      e.preventDefault();
      if (joystickActive) moveKnob(e.touches[0]);
    }, { passive: false });
    wrap.addEventListener('touchend', function (e) {
      e.preventDefault();
      joystickActive = false;
      joyVec.x = 0; joyVec.z = 0;
      knob.style.left = '35px'; knob.style.top = '35px';
    }, { passive: false });
    function moveKnob(touch) {
      var dx = touch.clientX - joyCenter.x;
      var dy = touch.clientY - joyCenter.y;
      var max = 35;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > max) { dx = dx / dist * max; dy = dy / dist * max; }
      knob.style.left = (35 + dx) + 'px';
      knob.style.top = (35 + dy) + 'px';
      joyVec.x = dx / max;
      joyVec.z = dy / max;
    }
    container.appendChild(wrap);
    elements.push(wrap);
  }

  function buildCameraTouchZone() {
    var zone = document.createElement('div');
    zone.style.cssText = 'position:absolute;right:0;top:0;width:50%;height:60%;touch-action:none;z-index:1;pointer-events:auto;';
    zone.setAttribute('aria-hidden', 'true');

    zone.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        rightDragActive = true;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        rightHalfStart = Date.now();
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
        var dx = e.touches[0].clientX - lastTouchX;
        var dy = e.touches[0].clientY - lastTouchY;
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
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
    makeButton('▶', 'adv-interact', function () { if (callbacks.onInteract) callbacks.onInteract(); });
    makeButton('♪', 'adv-listen', function () { if (callbacks.onListen) callbacks.onListen(); });
    makeButton('↻', 'adv-repeat', function () { if (callbacks.onRepeat) callbacks.onRepeat(); });
    makeButton('?', 'adv-hint', function () { if (callbacks.onHint) callbacks.onHint(); });
    makeButton('⏸', 'adv-pause', function () { if (callbacks.onPause) callbacks.onPause(); });

    var recenterBtn = makeButton('⊙', 'adv-recenter', function () {
      if (cameraController) cameraController.recenter();
    });
    recenterBtn.setAttribute('aria-label', 'Centrar cámara');
    recenterBtn.style.cssText += 'position:absolute;top:18px;right:18px;z-index:15;min-width:44px;min-height:44px;';

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
    setCameraController: function (cc) { cameraController = cc; },
    setCanvas: function (c) { canvas = c; },
    destroy: function () {
      elements.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
      elements = [];
    }
  };
}
