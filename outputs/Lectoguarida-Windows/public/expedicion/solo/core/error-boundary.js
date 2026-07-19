/**
 * error-boundary.js
 * Captura errores y permite recuperación sin bloquear el juego.
 * Error recuperable → vuelve al mapa o al estado anterior.
 * No muestra pantalla vacía.
 */

var ErrorBoundary = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var onError = options.onError || null;
    var onRecover = options.onRecover || null;

    function wrap(fn) {
      return function () {
        try {
          return fn.apply(this, arguments);
        } catch (e) {
          handleError(e);
          return null;
        }
      };
    }

    function handleError(error) {
      var info = {
        message: error && error.message ? error.message : 'Unknown error',
        stack: error && error.stack ? error.stack : '',
        timestamp: Date.now(),
        recoverable: true
      };
      if (onError) {
        try { onError(info); } catch (e) { /* nested error */ }
      }
      return info;
    }

    function recover() {
      if (onRecover) {
        try { onRecover(); } catch (e) { /* recovery error */ }
      }
    }

    return { wrap: wrap, handleError: handleError, recover: recover };
  }

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErrorBoundary };
}
if (typeof window !== 'undefined') {
  window.ErrorBoundary = ErrorBoundary;
}
