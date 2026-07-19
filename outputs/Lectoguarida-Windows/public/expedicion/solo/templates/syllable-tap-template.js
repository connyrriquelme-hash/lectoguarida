/**
 * syllable-tap-template.js
 * Plantilla de toque de sílabas.
 * Muestra una palabra dividida en sílabas como bloques visuales.
 * El estudiante debe tocar cada sílaba en orden correcto.
 * Soporta: avatar, teclado, touch, feedback, rondas.
 */

var SyllableTapTemplate = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var container = options.container;
    var config = options.config;
    var engine = options.engine;
    var inputManager = engine ? engine.getInputManager() : null;
    var feedback = engine ? engine.getFeedback() : null;

    var state = {
      currentRound: 0,
      totalRounds: 0,
      currentSyllableIndex: 0,
      answered: false,
      correctInRound: 0,
      incorrectInRound: 0,
      taps: []
    };

    function start() {
      state.currentRound = 0;
      state.totalRounds = (config && config.content) ? config.content.length : 0;
      state.currentSyllableIndex = 0;
      state.answered = false;
      state.taps = [];
      render();
    }

    function render() {
      if (!container || !config || !config.content) return;
      var round = config.content[state.currentRound];
      if (!round) { finish(); return; }

      state.currentSyllableIndex = 0;
      state.taps = [];

      var html = '<div class="solo-syllable-tap">';
      html += '<div class="solo-syllable-header">';
      html += '<span class="solo-round-label">Ronda ' + (state.currentRound + 1) + '/' + state.totalRounds + '</span>';
      if (round.question) html += '<h3>' + round.question + '</h3>';
      html += '</div>';

      if (round.wordImage) {
        html += '<div class="solo-syllable-image"><img src="' + round.wordImage + '" alt="' + (round.word || '') + '"></div>';
      } else if (round.avatarAssetId) {
        html += '<div class="solo-syllable-image"><img class="solo-syllable-avatar" data-asset-id="' + round.avatarAssetId + '" alt="Avatar explorador" data-fallback="' + (round.avatarFallback || '🧒') + '"></div>';
      }

      html += '<div class="solo-syllable-blocks" data-role="syllable-tap-zone">';

      if (round.visualDemo) {
        html += '<div class="solo-syllable-demo" role="note">Toca en este orden: ' + (round.syllables || []).map(function (s, i) { return (i + 1) + '.' + s; }).join('  ') + '</div>';
      }

      var syllables = round.syllables || [];
      syllables.forEach(function (syl, i) {
        var sizeClass = (config.accessibility && config.accessibility.largeTargets) ? ' solo-syllable--large' : '';
        html += '<button class="solo-syllable' + sizeClass + '" data-syl-index="' + i + '" data-syl="' + syl + '" tabindex="0">';
        html += '<img class="solo-syllable-circle" data-asset-id="circulo-silabico" alt="" data-fallback="🔵">';
        html += '<span class="solo-syllable-text">' + syl + '</span>';
        html += '<span class="solo-syllable-order">' + (i + 1) + '</span>';
        html += '</button>';
      });

      html += '</div>';

      if (round.word) {
        html += '<div class="solo-syllable-word">';
        html += '<span class="solo-word-complete">' + round.word + '</span>';
        html += '</div>';
      }

      html += '</div>';
      container.innerHTML = html;

      maybeRenderVoiceGuidance(round);
      decorateAssets();
      bindSyllables(round);
    }

    function decorateAssets() {
      if (window.ResilientGameAsset && config && config.__assetLoader) {
        try {
          window.ResilientGameAsset.decorate(container, config.__assetLoader, {
            reducedMotion: !!(config.accessibility && config.accessibility.reducedMotion)
          });
        } catch (e) { /* ignore */ }
      }
    }

    function maybeRenderVoiceGuidance(round) {
      if (!window.VoiceGuidanceUI) return;
      if (!(config && config.accessibility && config.accessibility.voiceGuidance)) return;
      var word = (round && round.word) ? round.word : null;
      window.VoiceGuidanceUI.createVoiceGuidanceBar({
        container: container,
        instruction: (round && round.question) ? round.question : (config.instructions && config.instructions.text),
        word: word,
        phoneme: (round && round.phoneme) ? round.phoneme : null,
        phonemeExamples: (round && round.phonemeExamples) ? round.phonemeExamples : []
      });
    }

    function bindSyllables(round) {
      var buttons = container.querySelectorAll('.solo-syllable');
      buttons.forEach(function (btn) {
        function handleTap(e) {
          e.preventDefault();
          if (state.answered) return;
          var idx = parseInt(btn.getAttribute('data-syl-index'), 10);
          handleSyllableTap(idx, btn, round);
        }
        btn.addEventListener('click', handleTap);
        btn.addEventListener('touchend', handleTap);
      });

      if (inputManager) {
        inputManager.subscribe(function (input) {
          if (input.source === 'keyboard' && input.action === 'select') {
            var focused = document.activeElement;
            if (focused && focused.classList.contains('solo-syllable')) {
              var idx = parseInt(focused.getAttribute('data-syl-index'), 10);
              handleSyllableTap(idx, focused, round);
            }
          }
        });
      }
    }

    function handleSyllableTap(index, btn, round) {
      var syllables = round.syllables || [];
      var expectedIndex = state.currentSyllableIndex;

      if (index !== expectedIndex) {
        state.incorrectInRound++;
        btn.classList.add('solo-syllable--incorrect');
        if (feedback) feedback.showIncorrect();
        setTimeout(function () {
          btn.classList.remove('solo-syllable--incorrect');
        }, 600);
        return;
      }

      state.taps.push(index);
      btn.classList.add('solo-syllable--tapped');
      btn.disabled = true;
      state.currentSyllableIndex++;

      if (feedback) feedback.showCorrect();

      if (engine && typeof engine.emit === 'function') {
        try {
          engine.emit('answerSubmitted', {
            correct: true,
            wordId: (round && round.wordId) ? round.wordId : null,
            expectedCount: (round && round.syllables) ? round.syllables.length : null,
            selectedCount: state.taps.length
          });
        } catch (e) { /* noop */ }
      }

      if (state.currentSyllableIndex >= syllables.length) {
        state.correctInRound++;
        state.answered = true;
        var allBtns = container.querySelectorAll('.solo-syllable');
        allBtns.forEach(function (b) { b.disabled = true; });

        setTimeout(function () {
          state.answered = false;
          state.currentRound++;
          if (state.currentRound >= state.totalRounds) {
            finish();
          } else {
            render();
          }
        }, 1200);
      }
    }

    function finish() {
      if (engine && typeof engine.emit === 'function') {
        try { engine.emit('roundCompleted', { rounds: state.totalRounds, correctAnswers: state.correctInRound }); } catch (e) { /* noop */ }
      }
      if (engine && engine.completeGame) {
        engine.completeGame({
          correctAnswers: state.correctInRound,
          totalRounds: state.totalRounds
        });
      }
    }

    function pause() {}
    function resume() {}

    function destroy() {
      if (container) container.innerHTML = '';
    }

    return {
      start: start,
      pause: pause,
      resume: resume,
      destroy: destroy,
      getState: function () { return Object.assign({}, state); }
    };
  }

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SyllableTapTemplate };
}
if (typeof window !== 'undefined') {
  window.SyllableTapTemplate = SyllableTapTemplate;
}
