/**
 * audio-manager.js
 * Gestor de audio del modo individual.
 * Soporta: voice, effects, ambient, mute, desbloqueo después de interacción,
 * fallback silencioso, captura de errores.
 * En esta fase usa sonidos sintéticos o pequeños archivos de prueba.
 * Un error de audio nunca debe impedir jugar.
 *
 * PASO 5 — Audio Pedagógico Extendido (No Lectores, es-CL):
 * Locución guiada del navegador con voz chilena (es-CL). Una sola locución
 * activa a la vez; se cancela la anterior antes de emitir una nueva.
 * Sin micrófono, sin getUserMedia, sin MediaRecorder, sin persistencia de audio.
 */

var AudioManager = (function () {
  'use strict';

  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var muted = false;
  var unlocked = false;

  var SPEECH_LOCALE = 'es-CL';
  var SPEECH_FALLBACKS = ['es-419', 'es-MX', 'es-AR', 'es-CO', 'es-US', 'es-ES'];

  var activeUtterance = null;
  var lastInstruction = null;
  var speechErrorHandler = null;
  var defaultSpeechRate = 0.88;

  function getSynth() {
    return (typeof window !== 'undefined' && window.speechSynthesis) ? window.speechSynthesis : null;
  }

  function getVoices() {
    var synth = getSynth();
    if (!synth || typeof synth.getVoices !== 'function') return [];
    try { return synth.getVoices() || []; } catch (e) { return []; }
  }

  /**
   * Selecciona la mejor voz en español, priorizando siempre es-CL.
   * Orden: 1) es-CL exacto, 2) otra voz es-CL, 3) es-419, 4) otra voz
   * latinoamericana, 5) es-ES como último fallback técnico.
   * Nunca usa es-ES como voz principal si hay otra opción hispanoamericana.
   */
  function selectChileanSpanishVoice() {
    var voices = getVoices();
    if (!voices || voices.length === 0) return null;

    var exactCl = voices.filter(function (v) { return v.lang === 'es-CL'; });
    if (exactCl.length) return exactCl[0];

    var clLike = voices.filter(function (v) {
      return typeof v.lang === 'string' && v.lang.toLowerCase().indexOf('es-cl') === 0;
    });
    if (clLike.length) return clLike[0];

    var latam = voices.filter(function (v) {
      if (typeof v.lang !== 'string') return false;
      if (v.lang === 'es-ES') return false;
      return v.lang.toLowerCase().indexOf('es-') === 0;
    });

    if (latam.length) {
      var es419 = latam.filter(function (v) { return v.lang === 'es-419'; });
      if (es419.length) return es419[0];
      return latam[0];
    }

    var esES = voices.filter(function (v) { return v.lang === 'es-ES'; });
    if (esES.length) return esES[0];

    return null;
  }

  function buildUtterance(text, options) {
    var synth = getSynth();
    if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') return null;
    var u;
    try {
      u = new window.SpeechSynthesisUtterance(text);
    } catch (e) {
      return null;
    }
    var voice = selectChileanSpanishVoice();
    if (voice) u.voice = voice;
    u.lang = (voice && voice.lang) ? voice.lang : SPEECH_LOCALE;
    u.rate = (options && typeof options.rate === 'number') ? options.rate : defaultSpeechRate;
    u.pitch = (options && typeof options.pitch === 'number') ? options.pitch : 1.0;
    u.volume = (muted) ? 0 : ((options && typeof options.volume === 'number') ? options.volume : 1.0);
    u.onerror = function (err) {
      if (typeof speechErrorHandler === 'function') {
        try { speechErrorHandler(err); } catch (e) { /* ignore */ }
      }
    };
    return u;
  }

  function speakInternal(text, options) {
    var synth = getSynth();
    if (!synth || !text) return false;
    try {
      if (typeof synth.cancel === 'function') synth.cancel();
    } catch (e) { /* ignore */ }
    activeUtterance = buildUtterance(text, options);
    if (!activeUtterance) return false;
    try {
      synth.speak(activeUtterance);
      return true;
    } catch (e) {
      activeUtterance = null;
      return false;
    }
  }

  function isSpeechAvailable() {
    var synth = getSynth();
    return !!synth && typeof synth.speak === 'function' && typeof window.SpeechSynthesisUtterance === 'function';
  }

  function speakInstruction(text, options) {
    if (!isSpeechAvailable()) return false;
    var instructionText = (text != null) ? text : '';
    lastInstruction = instructionText;
    return speakInternal(instructionText, options);
  }

  function speakWord(word, options) {
    if (!isSpeechAvailable()) return false;
    return speakInternal((word != null) ? String(word) : '', options);
  }

  var PHONEME_SPEECH_HINTS = {
    'f': 'fff como al comenzar foca',
    'm': 'mmm como al comenzar mono',
    's': 'sss como al comenzar sapo',
    'p': 'ppp como al comenzar perro',
    'l': 'lll como al comenzar luna',
    'r': 'rrr como al comenzar rosa',
    't': 'ttt como al comenzar tortuga',
    'n': 'nnn como al comenzar nube',
    'a': 'aaa como al comenzar agua',
    'o': 'ooo como al comenzar oso',
    'e': 'eee como al comenzar elefante'
  };

  function phonemeHint(phoneme) {
    if (!phoneme) return '';
    var key = String(phoneme).toLowerCase().charAt(0);
    return PHONEME_SPEECH_HINTS[key] || ('sonido ' + phoneme);
  }

  function speakPhoneme(phoneme, examples, options) {
    if (!isSpeechAvailable()) return false;
    var text = phonemeHint(phoneme);
    var exampleList = examples || [];
    if (exampleList.length) {
      text += '. Por ejemplo: ' + exampleList.join(', ');
    }
    lastInstruction = text;
    return speakInternal(text, options);
  }

  function repeatLastInstruction(options) {
    if (!isSpeechAvailable()) return false;
    if (!lastInstruction) return false;
    return speakInternal(lastInstruction, options);
  }

  function stopSpeech() {
    var synth = getSynth();
    activeUtterance = null;
    if (synth && typeof synth.cancel === 'function') {
      try { synth.cancel(); } catch (e) { /* ignore */ }
    }
  }

  function setSpeechErrorHandler(fn) {
    speechErrorHandler = (typeof fn === 'function') ? fn : null;
  }

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

  function setDefaultSpeechRate(rate) {
    if (typeof rate === 'number' && rate > 0 && rate <= 2) {
      defaultSpeechRate = rate;
    }
  }

  function getDefaultSpeechRate() {
    return defaultSpeechRate;
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
    stopSpeech();
    unlocked = false;
  }

  return {
    unlock: unlock,
    playSound: playSound,
    setMuted: setMuted,
    setDefaultSpeechRate: setDefaultSpeechRate,
    getDefaultSpeechRate: getDefaultSpeechRate,
    isMuted: isMuted,
    isUnlocked: isUnlocked,
    destroy: destroy,
    isSpeechAvailable: isSpeechAvailable,
    selectChileanSpanishVoice: selectChileanSpanishVoice,
    speakInstruction: speakInstruction,
    speakWord: speakWord,
    speakPhoneme: speakPhoneme,
    repeatLastInstruction: repeatLastInstruction,
    stopSpeech: stopSpeech,
    setSpeechErrorHandler: setSpeechErrorHandler,
    PHONEME_SPEECH_HINTS: PHONEME_SPEECH_HINTS
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AudioManager };
}
if (typeof window !== 'undefined') {
  window.AudioManager = AudioManager;
}
