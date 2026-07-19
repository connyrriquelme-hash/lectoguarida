/**
 * legacy-audio-adapter.js
 * Bridges V2 AudioSystem events to existing AudioManager.
 * Uses speakInstruction / stopSpeech API (FASE D.2 fix).
 */

export function createLegacyAudioAdapter(options) {
  var context = options.context;
  var AudioManager = options.AudioManager;
  var destroyed = false;

  function init() {
    if (!context || !context.eventBus) return;
    context.eventBus.on('audio:play', onAudioPlay);
    context.eventBus.on('audio:stop', onAudioStop);
    context.eventBus.on('audio:repeat', onAudioRepeat);
  }

  function onAudioPlay(payload) {
    if (destroyed) return;
    var text = payload && payload.text;
    var opts = payload && payload.options;
    if (text && AudioManager && typeof AudioManager.speakInstruction === 'function') {
      AudioManager.speakInstruction(text, opts);
    }
  }

  function onAudioStop() {
    if (destroyed) return;
    if (AudioManager && typeof AudioManager.stopSpeech === 'function') {
      AudioManager.stopSpeech();
    }
  }

  function onAudioRepeat(payload) {
    if (destroyed) return;
    var text = payload && payload.text;
    if (text && AudioManager && typeof AudioManager.speakInstruction === 'function') {
      AudioManager.speakInstruction(text, { repeat: true });
    }
  }

  function destroy() {
    destroyed = true;
    if (context && context.eventBus) {
      context.eventBus.off('audio:play', onAudioPlay);
      context.eventBus.off('audio:stop', onAudioStop);
      context.eventBus.off('audio:repeat', onAudioRepeat);
    }
  }

  init();

  return {
    destroy: destroy
  };
}