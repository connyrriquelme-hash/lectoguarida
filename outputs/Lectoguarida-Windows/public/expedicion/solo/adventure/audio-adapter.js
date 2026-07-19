/**
 * audio-adapter.js
 * Envuelve AudioManager existente para la aventura.
 * Mantiene una sola locución activa, permite repetir y reduce velocidad en Apoyo.
 * AudioManager expone speakInstruction/stopSpeech (no speak/cancel).
 */

export function createAudioAdapter(deps) {
  var AudioManager = deps.AudioManager;
  var defaultRate = 0.9;
  var onSpeakStart = null;
  var onSpeakEnd = null;

  function speak(text, opts) {
    opts = opts || {};
    if (!AudioManager) return false;
    if (opts.rate) AudioManager.setDefaultSpeechRate(opts.rate);
    else if (defaultRate) AudioManager.setDefaultSpeechRate(defaultRate);
    var adapterOpts = {};
    if (opts.rate) adapterOpts.rate = opts.rate;
    if (opts.onstart) adapterOpts.onstart = opts.onstart;
    if (opts.onend) adapterOpts.onend = opts.onend;
    try {
      if (typeof AudioManager.speakInstruction === 'function') {
        return AudioManager.speakInstruction(text, adapterOpts);
      }
      if (typeof AudioManager.speak === 'function') {
        return AudioManager.speak(text, adapterOpts);
      }
      return false;
    } catch (e) { return false; }
  }

  function repeat(text, opts) {
    if (!AudioManager) return speak(text, opts);
    try {
      if (typeof AudioManager.stopSpeech === 'function') AudioManager.stopSpeech();
      else if (typeof AudioManager.cancel === 'function') AudioManager.cancel();
    } catch (e) {}
    return speak(text, opts);
  }

  function cancel() {
    if (!AudioManager) return;
    try {
      if (typeof AudioManager.stopSpeech === 'function') AudioManager.stopSpeech();
      else if (typeof AudioManager.cancel === 'function') AudioManager.cancel();
    } catch (e) {}
    if (onSpeakEnd) onSpeakEnd();
  }

  function setSupportRate(difficulty) {
    if (!AudioManager || !AudioManager.setDefaultSpeechRate) return;
    var rate = difficulty === 'apoyo' ? 0.75 : difficulty === 'desafio' ? 0.95 : 0.88;
    AudioManager.setDefaultSpeechRate(rate);
  }

  function setOnSpeakStart(fn) { onSpeakStart = fn; }
  function setOnSpeakEnd(fn) { onSpeakEnd = fn; }

  return {
    speak: speak,
    repeat: repeat,
    cancel: cancel,
    setSupportRate: setSupportRate,
    setOnSpeakStart: setOnSpeakStart,
    setOnSpeakEnd: setOnSpeakEnd
  };
}
