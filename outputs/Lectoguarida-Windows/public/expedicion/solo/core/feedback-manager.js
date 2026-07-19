/**
 * feedback-manager.js
 * Feedback común para todas las plantillas.
 * Tipos: correct, incorrect, hint, retry, complete, error.
 * Cada tipo permite: texto, ícono, animación opcional, sonido opcional, duración, acción siguiente.
 * No usa sonidos agresivos, pantalla roja completa, castigo, bloqueo prolongado.
 * Soporte para reducción de movimiento.
 */

var FeedbackManager = (function () {
  'use strict';

  var FEEDBACK_TYPES = {
    correct: { icon: '✓', color: '#4caf50', duration: 1200 },
    incorrect: { icon: '✗', color: '#f44336', duration: 1000 },
    hint: { icon: '💡', color: '#2196f3', duration: 2000 },
    retry: { icon: '↻', color: '#ff9800', duration: 1500 },
    complete: { icon: '⭐', color: '#4caf50', duration: 0 },
    error: { icon: '⚠', color: '#f44336', duration: 0 }
  };

  function create(options) {
    options = options || {};
    var container = options.container;
    var reducedMotion = options.reducedMotion || false;
    var onSound = options.onSound || null;
    var listeners = [];

    function subscribe(fn) {
      listeners.push(fn);
      return function () {
        listeners = listeners.filter(function (l) { return l !== fn; });
      };
    }

    function show(type, data) {
      data = data || {};
      var config = FEEDBACK_TYPES[type] || FEEDBACK_TYPES.incorrect;
      var el = document.createElement('div');
      el.className = 'solo-feedback solo-feedback--' + type;
      el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
        'background:' + config.color + ';color:#fff;padding:16px 24px;border-radius:12px;' +
        'font-size:1.2rem;font-weight:700;z-index:9999;pointer-events:none;text-align:center;' +
        'box-shadow:0 4px 20px rgba(0,0,0,0.3);';

      if (reducedMotion) {
        el.style.transition = 'none';
      } else {
        el.style.transition = 'opacity 0.3s ease';
      }

      var text = data.text || config.icon;
      el.textContent = text;

      if (container && container.appendChild) {
        container.appendChild(el);
      } else if (document.body) {
        document.body.appendChild(el);
      }

      if (onSound && type !== 'error') {
        try { onSound(type); } catch (e) { /* sound error */ }
      }

      var event = { type: type, text: text, data: data };
      listeners.forEach(function (fn) {
        try { fn(event); } catch (e) { /* listener error */ }
      });

      if (config.duration > 0) {
        setTimeout(function () {
          el.style.opacity = '0';
          setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
          }, 300);
        }, reducedMotion ? 0 : config.duration);
      }

      return el;
    }

    function showCorrect(text) { return show('correct', { text: text || '¡Correcto!' }); }
    function showIncorrect(text) { return show('incorrect', { text: text || 'Intenta de nuevo' }); }
    function showHint(text) { return show('hint', { text: text || '' }); }
    function showRetry(text) { return show('retry', { text: text || 'Reintenta' }); }
    function showComplete(text) { return show('complete', { text: text || '¡Completado!' }); }
    function showError(text) { return show('error', { text: text || 'Error' }); }

    function clearAll() {
      var els = document.querySelectorAll('.solo-feedback');
      els.forEach(function (el) { if (el.parentNode) el.parentNode.removeChild(el); });
    }

    return {
      subscribe: subscribe,
      show: show,
      showCorrect: showCorrect,
      showIncorrect: showIncorrect,
      showHint: showHint,
      showRetry: showRetry,
      showComplete: showComplete,
      showError: showError,
      clearAll: clearAll
    };
  }

  return { create: create, FEEDBACK_TYPES: FEEDBACK_TYPES };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FeedbackManager };
}
if (typeof window !== 'undefined') {
  window.FeedbackManager = FeedbackManager;
}
