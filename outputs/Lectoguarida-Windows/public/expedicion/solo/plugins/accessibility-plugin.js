/**
 * accessibility-plugin.js
 * Plugin de accesibilidad que aplica ajustes del usuario al DOM.
 */

var AccessibilityPlugin = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var accessibility = options.accessibility;

    function init(context) {}
    function start() {
      if (accessibility && accessibility.apply) accessibility.apply();
    }
    function pause() {}
    function resume() {}
    function destroy() {}

    return { init: init, start: start, pause: pause, resume: resume, destroy: destroy };
  }

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AccessibilityPlugin };
}
if (typeof window !== 'undefined') {
  window.AccessibilityPlugin = AccessibilityPlugin;
}
