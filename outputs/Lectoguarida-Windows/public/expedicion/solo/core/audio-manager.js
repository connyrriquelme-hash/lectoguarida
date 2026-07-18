/**
 * audio-manager.js
 * Gestor de audio del modo individual.
 * Soporta: voice, effects, ambient, mute, desbloqueo después de interacción,
 * fallback silencioso, captura de errores.
 * En esta fase usa sonidos sintéticos o pequeños archivos de prueba.
 * Un error de audio nunca debe impedir jugar.
 */

var AudioManager = (function () {
  'use strict';

  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var muted = false;
  var unlocked = false;

  function ensureContext() {
    if (ctx) return ctx;
    try {
      ctx = new AudioContext();
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  function unlock() {
    if (unlocked) return;
    var c = ensureContext();
    if (c && c.state === 'suspended') {
      c.resume().catch(function () { /* ignore */ });
    }
    unlocked = true;
  }

  function playTone(frequency, duration, type) {
    if (muted) return;
    var c = ensureContext();
    if (!c) return;
    try {
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = frequency || 440;
      gain.gain.value = 0.1;
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + (duration || 0.3));
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + (duration || 0.3));
    } catch (e) { /* audio error — never block */ }
  }

  function playCorrect() { playTone(523, 0.2, 'sine'); }
  function playIncorrect() { playTone(220, 0.3, 'square'); }
  function playClick() { playTone(800, 0.05, 'sine'); }
  function playComplete() {
    playTone(523, 0.15, 'sine');
    setTimeout(function () { playTone(659, 0.15, 'sine'); }, 150);
    setTimeout(function () { playTone(784, 0.2, 'sine'); }, 300);
  }
  function playHint() { playTone(440, 0.2, 'triangle'); }

  function playSound(type) {
    if (muted) return;
    unlock();
    switch (type) {
      case 'correct': playCorrect(); break;
      case 'incorrect': playIncorrect(); break;
      case 'click': playClick(); break;
      case 'complete': playComplete(); break;
      case 'hint': playHint(); break;
      default: playClick();
    }
  }

  function setMuted(value) {
    muted = !!value;
  }

  function isMuted() {
    return muted;
  }

  function isUnlocked() {
    return unlocked;
  }

  function destroy() {
    if (ctx) {
      try { ctx.close(); } catch (e) { /* ignore */ }
      ctx = null;
    }
    unlocked = false;
  }

  return {
    unlock: unlock,
    playSound: playSound,
    setMuted: setMuted,
    isMuted: isMuted,
    isUnlocked: isUnlocked,
    destroy: destroy
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioManager };
}
if (typeof window !== 'undefined') {
  window.AudioManager = AudioManager;
}
