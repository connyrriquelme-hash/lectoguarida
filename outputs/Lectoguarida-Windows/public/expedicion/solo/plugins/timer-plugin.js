/**
 * timer-plugin.js
 * Plugin de tiempo extendido. Si accessibility.extendedTime es true,
 * agrega tiempo extra o elimina límite de tiempo.
 */

var TimerPlugin = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var accessibility = options.accessibility;
    var elapsed = 0;
    var interval = null;
    var extended = accessibility && accessibility.get && accessibility.get('extendedTime');

    function init(context) {}
    function start() {
      elapsed = 0;
      interval = setInterval(function () { elapsed++; }, 1000);
    }
    function pause() { if (interval) clearInterval(interval); }
    function resume() { interval = setInterval(function () { elapsed++; }, 1000); }
    function destroy() { if (interval) clearInterval(interval); }
    function getElapsed() { return elapsed; }
    function isExtended() { return extended; }

    return { init: init, start: start, pause: pause, resume: resume, destroy: destroy, getElapsed: getElapsed, isExtended: isExtended };
  }

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TimerPlugin };
}
if (typeof window !== 'undefined') {
  window.TimerPlugin = TimerPlugin;
}
