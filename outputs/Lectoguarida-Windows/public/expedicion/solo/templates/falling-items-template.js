/**
 * falling-items-template.js
 * Plantilla de items que caen con tecla/mouse de captura.
 * Los items caen de arriba a abajo. El jugador debe tocar/clickear
 * el item correcto antes de que salga de pantalla.
 * Soporta: teclado (espacio), touch, mouse, feedback.
 */

var FallingItemsTemplate = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var container = options.container;
    var config = options.config;
    var engine = options.engine;
    var feedback = engine ? engine.getFeedback() : null;

    var state = {
      currentRound: 0,
      totalRounds: 0,
      items: [],
      capturedIds: [],
      missedIds: [],
      correctInRound: 0,
      incorrectInRound: 0,
      answered: false,
      animationFrame: null,
      lastSpawn: 0,
      spawnInterval: 1500,
      itemSpeed: 1.2,
      running: false
    };

    function start() {
      state.currentRound = 0;
      state.totalRounds = (config && config.content) ? config.content.length : 0;
      state.capturedIds = [];
      state.missedIds = [];
      state.items = [];
      state.running = true;
      state.lastSpawn = Date.now();
      render();
    }

    function render() {
      if (!container || !config || !config.content) return;
      var round = config.content[state.currentRound];
      if (!round) { finish(); return; }

      state.answered = false;
      state.items = [];
      state.capturedIds = [];
      state.missedIds = [];

      var html = '<div class="solo-falling-items">';
      html += '<div class="solo-falling-header">';
      html += '<span class="solo-round-label">Ronda ' + (state.currentRound + 1) + '/' + state.totalRounds + '</span>';
      if (round.question) html += '<h3>' + round.question + '</h3>';
      html += '</div>';
      html += '<div class="solo-falling-zone" data-role="falling-zone" style="position:relative;height:300px;overflow:hidden;border:2px solid #ccc;border-radius:8px;">';
      html += '<div class="solo-falling-catcher" style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:60px;height:30px;background:#4CAF50;border-radius:4px;" data-role="catcher"></div>';
      html += '</div>';
      html += '<div class="solo-falling-instructions"><p>Toca el item correcto antes de que caiga al fondo</p></div>';
      html += '</div>';
      container.innerHTML = html;

      maybeRenderVoiceGuidance(round);
      bindRound(round);
      startAnimation(round);
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

    function bindRound(round) {
      var zone = container.querySelector('[data-role="falling-zone"]');
      if (!zone) return;

      function handleCapture() {
        if (state.answered || !state.running) return;
        checkCapture(round);
      }

      zone.addEventListener('click', handleCapture);
      zone.addEventListener('touchend', function (e) {
        e.preventDefault();
        handleCapture();
      });

      document.addEventListener('keydown', function handler(e) {
        if (e.code === 'Space' && !state.answered && state.running) {
          e.preventDefault();
          handleCapture();
        }
        if (!state.running) {
          document.removeEventListener('keydown', handler);
        }
      });
    }

    function startAnimation(round) {
      if (!state.running) return;

      var zone = container ? container.querySelector('[data-role="falling-zone"]') : null;
      if (!zone) return;

      var now = Date.now();
      if (now - state.lastSpawn > state.spawnInterval) {
        spawnItem(round, zone);
        state.lastSpawn = now;
      }

      updateItems(zone, round);

      state.animationFrame = requestAnimationFrame(function () {
        startAnimation(round);
      });
    }

    function spawnItem(round, zone) {
      var options = round.options || [];
      var correctIdx = round.answers ? round.answers[0] : 0;
      var isCorrect = Math.random() < 0.4;

      var itemData;
      if (isCorrect) {
        itemData = { label: options[correctIdx].label, id: options[correctIdx].id, isCorrect: true };
      } else {
        var wrongOptions = options.filter(function (o, i) {
          return !(round.answers && round.answers.indexOf(i) !== -1);
        });
        if (wrongOptions.length === 0) return;
        var pick = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        itemData = { label: pick.label, id: pick.id, isCorrect: false };
      }

      var el = document.createElement('div');
      el.className = 'solo-falling-item';
      el.setAttribute('data-item-id', itemData.id);
      el.setAttribute('data-correct', itemData.isCorrect ? '1' : '0');
      el.style.cssText = 'position:absolute;top:-40px;left:' + (10 + Math.random() * 80) + '%;width:60px;height:40px;display:flex;align-items:center;justify-content:center;background:#FF9800;border-radius:6px;font-weight:bold;font-size:16px;cursor:pointer;transition:top 0.05s linear;';
      el.textContent = itemData.label;
      zone.appendChild(el);
    }

    function updateItems(zone, round) {
      var items = zone.querySelectorAll('.solo-falling-item');
      var zoneHeight = zone.offsetHeight;

      items.forEach(function (el) {
        var top = parseFloat(el.style.top) || 0;
        top += state.itemSpeed;
        el.style.top = top + 'px';

        if (top > zoneHeight + 40) {
          var id = el.getAttribute('data-item-id');
          var correct = el.getAttribute('data-correct') === '1';
          if (correct && state.capturedIds.indexOf(id) === -1) {
            state.missedIds.push(id);
          }
          el.remove();
        }
      });
    }

    function checkCapture(round) {
      var zone = container ? container.querySelector('[data-role="falling-zone"]') : null;
      if (!zone) return;

      var items = zone.querySelectorAll('.solo-falling-item');
      var lowestItem = null;
      var lowestTop = -1;

      items.forEach(function (el) {
        var top = parseFloat(el.style.top) || 0;
        if (top > lowestTop) {
          lowestTop = top;
          lowestItem = el;
        }
      });

      if (!lowestItem) return;

      var isCorrect = lowestItem.getAttribute('data-correct') === '1';
      var itemId = lowestItem.getAttribute('data-item-id');

      if (isCorrect) {
        state.capturedIds.push(itemId);
        state.correctInRound++;
        lowestItem.style.background = '#4CAF50';
        if (feedback) feedback.showCorrect();
      } else {
        state.incorrectInRound++;
        lowestItem.style.background = '#f44336';
        if (feedback) feedback.showIncorrect();
      }

      lowestItem.remove();

      var allCorrectCaptured = round.answers ? round.answers.every(function (ai) {
        var opt = (round.options || [])[ai];
        return opt && state.capturedIds.indexOf(opt.id) !== -1;
      }) : false;

      if (allCorrectCaptured) {
        state.answered = true;
        state.running = false;
        if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
        setTimeout(function () {
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
      state.running = false;
      if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
      if (engine && engine.completeGame) {
        engine.completeGame({
          correctAnswers: state.correctInRound,
          totalRounds: state.totalRounds
        });
      }
    }

    function pause() {
      state.running = false;
      if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
    }

    function resume() {
      state.running = true;
      var round = (config && config.content) ? config.content[state.currentRound] : null;
      if (round) startAnimation(round);
    }

    function destroy() {
      state.running = false;
      if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
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
  module.exports = { FallingItemsTemplate };
}
if (typeof window !== 'undefined') {
  window.FallingItemsTemplate = FallingItemsTemplate;
}
