/**
 * audio-instruction-plugin.js
 * Plugin que reproduce instrucciones de audio antes de cada ronda.
 */

var AudioInstructionPlugin = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var audioManager = options.audioManager || AudioManager;
    var config = options.config;

    function init(context) {}
    function start() {
      if (config && config.instructions && config.instructions.audio) {
        audioManager.playSound('voice');
      }
    }
    function pause() {}
    function resume() {}
    function destroy() {}

    return { init: init, start: start, pause: pause, resume: resume, destroy: destroy };
  }

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioInstructionPlugin };
}
if (typeof window !== 'undefined') {
  window.AudioInstructionPlugin = AudioInstructionPlugin;
}
