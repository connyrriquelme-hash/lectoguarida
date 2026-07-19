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
    var engine = options.engine || null;

    function emit(event) {
      if (engine && typeof engine.emit === 'function') {
        try { engine.emit(event); } catch (e) { /* noop */ }
      }
    }

    function init(context) {}
    function start() {
      if (config && config.instructions && config.instructions.text) {
        audioManager.speakInstruction(config.instructions.text);
      }
      emit('instructionPlayed');
    }
    function pause() {
      if (audioManager && audioManager.stopSpeech) audioManager.stopSpeech();
    }
    function resume() {
      if (config && config.instructions && config.instructions.text) {
        audioManager.repeatLastInstruction();
      }
      emit('instructionRepeated');
    }
    function destroy() {
      if (audioManager && audioManager.stopSpeech) audioManager.stopSpeech();
    }

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
