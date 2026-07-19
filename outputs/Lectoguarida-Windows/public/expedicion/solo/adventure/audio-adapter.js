/**
 * audio-adapter.js
 * Envuelve AudioManager existente para la aventura.
 * Mantiene una sola locución activa, permite repetir y reduce velocidad en Apoyo.
 * No modifica el motor pedagógico del AudioManager.
 */

export function createAudioAdapter(deps) {
  var AudioManager = deps.AudioManager;
  var defaultRate = 0.9;

  function speak(text, opts) {
    opts = opts || {};
    if (!AudioManager || !AudioManager.speak) return false;
    if (opts.rate) AudioManager.setDefaultSpeechRate(opts.rate);
    else if (defaultRate) AudioManager.setDefaultSpeechRate(defaultRate);
    try { AudioManager.speak(text, opts); return true; } catch (e) { return false; }
  }

  function repeat(text, opts) {
    if (!AudioManager || !AudioManager.cancel) return speak(text, opts);
    try { AudioManager.cancel(); } catch (e) {}
    return speak(text, opts);
  }

  function cancel() {
    if (AudioManager && AudioManager.cancel) {
      try { AudioManager.cancel(); } catch (e) {}
    }
  }

  function setSupportRate(difficulty) {
    if (!AudioManager || !AudioManager.setDefaultSpeechRate) return;
    var rate = difficulty === 'apoyo' ? 0.75 : difficulty === 'desafio' ? 0.95 : 0.88;
    AudioManager.setDefaultSpeechRate(rate);
  }

  return {
    speak: speak,
    repeat: repeat,
    cancel: cancel,
    setSupportRate: setSupportRate
  };
}
