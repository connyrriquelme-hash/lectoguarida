/**
 * input-manager.js
 * Interfaz común de entrada para todas las plantillas.
 * Fuentes: mouse, touch, keyboard. (Cámara/hand se agregan después).
 * Prioridad: touch > mouse > keyboard.
 * No registra doble interacción cuando touch genera click.
 */

var InputManager = (function () {
  'use strict';

  function create() {
    var state = {
      x: 0,
      y: 0,
      active: false,
      source: null,
      timestamp: 0,
      pointerId: null,
      listeners: [],
      lastTouchTimestamp: 0
    };

    function subscribe(fn) {
      state.listeners.push(fn);
      return function () {
        state.listeners = state.listeners.filter(function (l) { return l !== fn; });
      };
    }

    function emit(input) {
      state.x = input.x;
      state.y = input.y;
      state.active = input.active;
      state.source = input.source;
      state.timestamp = input.timestamp;
      state.pointerId = input.pointerId;
      state.listeners.forEach(function (fn) {
        try { fn(input); } catch (e) { /* listener error */ }
      });
    }

    function getRelativePosition(e, target) {
      var rect = target.getBoundingClientRect();
      return {
        x: (e.clientX || 0) - rect.left,
        y: (e.clientY || 0) - rect.top
      };
    }

    function isTouchDevice() {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    function attach(target) {
      if (!target) return;

      target.addEventListener('touchstart', function (e) {
        e.preventDefault();
        var touch = e.touches[0];
        if (!touch) return;
        var pos = getRelativePosition(touch, target);
        state.lastTouchTimestamp = Date.now();
        emit({
          x: pos.x,
          y: pos.y,
          active: true,
          source: 'touch',
          timestamp: Date.now(),
          pointerId: touch.identifier
        });
      }, { passive: false });

      target.addEventListener('touchend', function (e) {
        emit({
          x: state.x,
          y: state.y,
          active: false,
          source: 'touch',
          timestamp: Date.now(),
          pointerId: null
        });
      });

      target.addEventListener('mousedown', function (e) {
        if (Date.now() - state.lastTouchTimestamp < 300) return;
        var pos = getRelativePosition(e, target);
        emit({
          x: pos.x,
          y: pos.y,
          active: true,
          source: 'mouse',
          timestamp: Date.now(),
          pointerId: null
        });
      });

      target.addEventListener('mouseup', function (e) {
        if (Date.now() - state.lastTouchTimestamp < 300) return;
        emit({
          x: state.x,
          y: state.y,
          active: false,
          source: 'mouse',
          timestamp: Date.now(),
          pointerId: null
        });
      });

      document.addEventListener('keydown', function (e) {
        if (!e.key) return;
        var keyMap = {
          'ArrowLeft': { dx: -1, dy: 0 },
          'ArrowRight': { dx: 1, dy: 0 },
          'ArrowUp': { dx: 0, dy: -1 },
          'ArrowDown': { dx: 0, dy: 1 },
          ' ': { action: 'select' },
          'Enter': { action: 'select' }
        };
        var mapping = keyMap[e.key];
        if (mapping) {
          e.preventDefault();
          emit({
            x: state.x,
            y: state.y,
            active: true,
            source: 'keyboard',
            timestamp: Date.now(),
            pointerId: null,
            key: e.key,
            dx: mapping.dx || 0,
            dy: mapping.dy || 0,
            action: mapping.action
          });
        }
      });

      document.addEventListener('keyup', function (e) {
        if (e.key === ' ' || e.key === 'Enter') {
          emit({
            x: state.x,
            y: state.y,
            active: false,
            source: 'keyboard',
            timestamp: Date.now(),
            pointerId: null,
            key: e.key
          });
        }
      });
    }

    function detach() {
      state.listeners = [];
    }

    function getState() {
      return {
        x: state.x,
        y: state.y,
        active: state.active,
        source: state.source,
        timestamp: state.timestamp,
        pointerId: state.pointerId
      };
    }

    function isTouchSource() {
      return state.source === 'touch';
    }

    return {
      subscribe: subscribe,
      attach: attach,
      detach: detach,
      getState: getState,
      isTouchDevice: isTouchDevice,
      isTouchSource: isTouchSource
    };
  }

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { InputManager };
}
if (typeof window !== 'undefined') {
  window.InputManager = InputManager;
}
