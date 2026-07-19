/**
 * mobile-controls.js
 * Joystick virtual y botones táctiles para celular.
 */

export function createMobileControls(container, callbacks) {
  var joystickActive = false;
  var joyCenter = { x: 0, y: 0 };
  var joyVec = { x: 0, z: 0 };
  var elements = [];
  var disposers = [];

  function makeButton(label, className, onPress) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'adv-mobile-btn ' + (className || '');
    btn.setAttribute('aria-label', label);
    btn.textContent = label;
    btn.style.cssText = 'min-width:56px;min-height:56px;border-radius:50%;border:none;background:var(--accent,#4fd1c5);color:#fff;font-size:1.1rem;font-weight:700;touch-action:none;cursor:pointer;';
    btn.addEventListener('touchstart', function (e) { e.preventDefault(); onPress(); }, { passive: false });
    btn.addEventListener('click', function (e) { e.preventDefault(); onPress(); });
    container.appendChild(btn);
    elements.push(btn);
    return btn;
  }

  function buildJoystick() {
    var wrap = document.createElement('div');
    wrap.className = 'adv-joystick';
    wrap.style.cssText = 'position:absolute;left:18px;bottom:18px;width:110px;height:110px;border-radius:50%;background:rgba(0,0,0,0.15);touch-action:none;';
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

  function build() {
    buildJoystick();
    makeButton('▶', 'adv-interact', function () { if (callbacks.onInteract) callbacks.onInteract(); });
    makeButton('♪', 'adv-listen', function () { if (callbacks.onListen) callbacks.onListen(); });
    makeButton('↻', 'adv-repeat', function () { if (callbacks.onRepeat) callbacks.onRepeat(); });
    makeButton('?', 'adv-hint', function () { if (callbacks.onHint) callbacks.onHint(); });
    makeButton('⏸', 'adv-pause', function () { if (callbacks.onPause) callbacks.onPause(); });
    elements.forEach(function (el) {
      if (el.classList.contains('adv-mobile-btn')) {
        el.style.position = 'absolute';
        el.style.bottom = '24px';
      }
    });
    var right = elements.filter(function (el) { return el.classList.contains('adv-mobile-btn'); });
    right.forEach(function (el, i) {
      el.style.right = (18 + i * 64) + 'px';
    });
  }

  build();

  return {
    getJoystickVector: function () { return { x: joyVec.x, z: joyVec.z }; },
    isJoystickActive: function () { return joystickActive; },
    destroy: function () {
      elements.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
      elements = [];
    }
  };
}
