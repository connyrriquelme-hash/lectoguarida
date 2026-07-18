/**
 * click-selection-template.js
 * Plantilla genérica de selección por clic.
 * Soporta: opciones visuales, una o varias respuestas correctas,
 * feedback inmediato, navegación con teclado, touch, mouse,
 * objetivos grandes, rondas, pistas, finalización.
 */

var ClickSelectionTemplate = (function () {
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
      selectedOption: null,
      answered: false,
      correctInRound: 0,
      incorrectInRound: 0
    };

    function start() {
      state.currentRound = 0;
      state.totalRounds = (config && config.content) ? config.content.length : 0;
      state.answered = false;
      render();
    }

    function render() {
      if (!container || !config || !config.content) return;
      var round = config.content[state.currentRound];
      if (!round) { finish(); return; }

      var html = '<div class="solo-click-selection">';
      html += '<div class="solo-click-header">';
      html += '<span class="solo-round-label">Ronda ' + (state.currentRound + 1) + '/' + state.totalRounds + '</span>';
      if (round.question) html += '<h3>' + round.question + '</h3>';
      html += '</div>';
      html += '<div class="solo-click-options">';

      var options = round.options || [];
      options.forEach(function (opt, i) {
        var sizeClass = (config.accessibility && config.accessibility.largeTargets) ? ' solo-option--large' : '';
        html += '<button class="solo-option' + sizeClass + '" data-index="' + i + '" tabindex="0">';
        if (opt.assetId) {
          html += '<img class="solo-option-img" data-asset-id="' + opt.assetId + '" alt="' + (opt.label || '') + '" data-fallback="' + (opt.fallbackEmoji || (opt.fallback || '')) + '">';
        } else if (opt.image) {
          html += '<img src="' + opt.image + '" alt="' + (opt.label || '') + '">';
        }
        if (opt.label) html += '<span>' + opt.label + '</span>';
        html += '</button>';
      });

      html += '</div>';
      html += '</div>';
      container.innerHTML = html;

      maybeRenderVoiceGuidance(round);
      decorateAssets();
      bindOptions();
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

    function bindOptions() {
      var buttons = container.querySelectorAll('.solo-option');
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          if (state.answered) return;
          handleSelect(parseInt(btn.getAttribute('data-index'), 10));
        });
        btn.addEventListener('touchend', function (e) {
          e.preventDefault();
          if (state.answered) return;
          handleSelect(parseInt(btn.getAttribute('data-index'), 10));
        });
      });

      if (inputManager) {
        inputManager.subscribe(function (input) {
          if (input.source === 'keyboard' && input.action === 'select') {
            var focused = document.activeElement;
            if (focused && focused.classList.contains('solo-option')) {
              handleSelect(parseInt(focused.getAttribute('data-index'), 10));
            }
          }
        });
      }
    }

    function handleSelect(index) {
      state.answered = true;
      state.selectedOption = index;
      var round = config.content[state.currentRound];
      var isCorrect = round.answers && round.answers.indexOf(index) !== -1;

      var buttons = container.querySelectorAll('.solo-option');
      buttons.forEach(function (btn, i) {
        btn.disabled = true;
        if (round.answers && round.answers.indexOf(i) !== -1) {
          btn.classList.add('solo-option--correct');
        }
        if (i === index && !isCorrect) {
          btn.classList.add('solo-option--incorrect');
        }
      });

      if (isCorrect) {
        state.correctInRound++;
        if (feedback) feedback.showCorrect();
      } else {
        state.incorrectInRound++;
        if (feedback) feedback.showIncorrect();
      }

      if (engine && engine.getStateMachine) {
        engine.getStateMachine().transitionTo('FEEDBACK', 'click-answer');
      }

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

    function finish() {
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
  module.exports = { ClickSelectionTemplate };
}
if (typeof window !== 'undefined') {
  window.ClickSelectionTemplate = ClickSelectionTemplate;
}
