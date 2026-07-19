/**
 * voice-guidance-ui.js
 * Barra de locución guiada para el perfil No Lectores (es-CL).
 * Renderiza hasta tres botones reales:
 *   - Escuchar instrucción
 *   - Escuchar nuevamente
 *   - Escuchar nombre (palabra / sílaba / fonema)
 * Todos usan AudioManager (voz del navegador). Sin micrófono, sin grabación.
 *
 * Cada template llama a createVoiceGuidanceBar con los datos de la ronda.
 */

var VoiceGuidanceUI = (function () {
  'use strict';

  function getAudio() {
    return (typeof window !== 'undefined' && window.AudioManager) ? window.AudioManager : null;
  }

  function buttonMarkup(extraClass, label) {
    return '<button type="button" class="solo-voice-btn' + (extraClass ? ' ' + extraClass : '') + '" tabindex="0">' +
      '<span class="solo-voice-btn-label">' + label + '</span></button>';
  }

  /**
   * options:
   *   container: nodo donde insertar la barra
   *   instruction: texto de la instrucción (string)
   *   word: palabra a deletrear/pronunciar (string|null)
   *   phoneme: fonema aislado (string|null)
   *   phonemeExamples: array de ejemplos para el fonema
   * Devuelve el nodo de la barra o null si no hay AudioManager.
   */
  function createVoiceGuidanceBar(options) {
    options = options || {};
    var parent = options.container;
    if (!parent) return null;
    var audio = getAudio();
    if (!audio) return null;

    if (!options.instruction && !options.word && !options.phoneme) {
      return null;
    }

    var bar = document.createElement('div');
    bar.className = 'solo-voice-guidance';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Orientación por voz');

    var speechOn = audio.isSpeechAvailable();
    if (!speechOn) {
      bar.setAttribute('data-speech', 'unavailable');
    }

    if (options.instruction) {
      var instrBtn = document.createElement('button');
      instrBtn.type = 'button';
      instrBtn.className = 'solo-voice-btn solo-voice-btn--instruction';
      instrBtn.tabIndex = 0;
      instrBtn.setAttribute('aria-label', 'Escuchar instrucción');
      instrBtn.innerHTML = '<span class="solo-voice-btn-label">Escuchar instrucción</span>';
      instrBtn.addEventListener('click', function (e) { e.preventDefault(); audio.speakInstruction(options.instruction); });
      instrBtn.addEventListener('touchend', function (e) { e.preventDefault(); audio.speakInstruction(options.instruction); });
      bar.appendChild(instrBtn);

      var againBtn = document.createElement('button');
      againBtn.type = 'button';
      againBtn.className = 'solo-voice-btn solo-voice-btn--repeat';
      againBtn.tabIndex = 0;
      againBtn.setAttribute('aria-label', 'Escuchar nuevamente');
      againBtn.innerHTML = '<span class="solo-voice-btn-label">Escuchar nuevamente</span>';
      againBtn.addEventListener('click', function (e) { e.preventDefault(); audio.repeatLastInstruction(); });
      againBtn.addEventListener('touchend', function (e) { e.preventDefault(); audio.repeatLastInstruction(); });
      bar.appendChild(againBtn);
    }

    if (options.word) {
      var wordBtn = document.createElement('button');
      wordBtn.type = 'button';
      wordBtn.className = 'solo-voice-btn solo-voice-btn--word';
      wordBtn.tabIndex = 0;
      wordBtn.setAttribute('aria-label', 'Escuchar nombre');
      wordBtn.innerHTML = '<span class="solo-voice-btn-label">Escuchar nombre</span>';
      wordBtn.addEventListener('click', function (e) { e.preventDefault(); audio.speakWord(options.word); });
      wordBtn.addEventListener('touchend', function (e) { e.preventDefault(); audio.speakWord(options.word); });
      bar.appendChild(wordBtn);
    }

    if (options.phoneme) {
      var phonBtn = document.createElement('button');
      phonBtn.type = 'button';
      phonBtn.className = 'solo-voice-btn solo-voice-btn--phoneme';
      phonBtn.tabIndex = 0;
      phonBtn.setAttribute('aria-label', 'Escuchar sonido');
      phonBtn.innerHTML = '<span class="solo-voice-btn-label">Escuchar sonido</span>';
      phonBtn.addEventListener('click', function (e) { e.preventDefault(); audio.speakPhoneme(options.phoneme, options.phonemeExamples || []); });
      phonBtn.addEventListener('touchend', function (e) { e.preventDefault(); audio.speakPhoneme(options.phoneme, options.phonemeExamples || []); });
      bar.appendChild(phonBtn);
    }

    parent.appendChild(bar);
    return bar;
  }

  return { createVoiceGuidanceBar: createVoiceGuidanceBar };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VoiceGuidanceUI };
}
if (typeof window !== 'undefined') {
  window.VoiceGuidanceUI = VoiceGuidanceUI;
}
