/**
 * keyboard-input-plugin.js
 * Plugin de navegación por teclado para plantillas.
 */

var KeyboardInputPlugin = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var inputManager = options.inputManager;

    function init(context) {}
    function start() {}
    function pause() {}
    function resume() {}
    function destroy() {}

    return { init: init, start: start, pause: pause, resume: resume, destroy: destroy };
  }

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KeyboardInputPlugin };
}
if (typeof window !== 'undefined') {
  window.KeyboardInputPlugin = KeyboardInputPlugin;
}
