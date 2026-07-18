/**
 * solo-game-engine.js
 * Motor principal del modo individual.
 * Orquesta: state machine, config validator, input, scoring, feedback,
 * rewards, audio, accessibility, error boundary, y plugins.
 * No importa ni modifica estados del colaborativo.
 */

var SoloGameEngine = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var studentProfileId = options.studentProfileId || 'default';
    var container = options.container;

    var stateMachine = SoloStateMachine.create();
    var inputManager = InputManager.create();
    var scoringEngine = null;
    var feedbackManager = FeedbackManager.create({
      container: container,
      reducedMotion: false,
      onSound: function (type) { AudioManager.playSound(type); }
    });
    var rewardManager = RewardManager.create(SoloProgressRepository, studentProfileId);
    var accessibility = AccessibilityManager.create(studentProfileId);
    var errorBoundary = ErrorBoundary.create({
      onError: function (info) {
        stateMachine.recoverFromError();
      }
    });

    var currentTemplate = null;
    var plugins = [];
    var gameConfig = null;

    function loadGame(config) {
      var validation = GameConfigValidator.validate(config);
      if (!validation.valid) {
        feedbackManager.showError('Configuración inválida');
        stateMachine.recoverFromError();
        return false;
      }
      gameConfig = config;
      scoringEngine = ScoringEngine.create(config.scoring);
      if (stateMachine.getState().phase === 'BOOT') {
        stateMachine.transitionTo('PROFILE_READY', 'boot-ready');
      }
      stateMachine.loadGame(config);
      return true;
    }

    function startGame() {
      if (!gameConfig) return false;
      stateMachine.transitionTo('INSTRUCTIONS', 'loadGame-complete');
      stateMachine.transitionTo('READY', 'instructions-done');
      stateMachine.transitionTo('PLAYING', 'startGame');
      scoringEngine.start();
      feedbackManager.clearAll();
      startPlugins();
      if (currentTemplate && currentTemplate.start) {
        currentTemplate.start();
      }
      return true;
    }

    function pauseGame() {
      var result = stateMachine.pauseGame();
      if (result.ok) {
        pausePlugins();
        if (currentTemplate && currentTemplate.pause) currentTemplate.pause();
      }
      return result.ok;
    }

    function resumeGame() {
      var result = stateMachine.resumeGame();
      if (result.ok) {
        resumePlugins();
        if (currentTemplate && currentTemplate.resume) currentTemplate.resume();
      }
      return result.ok;
    }

    function completeGame(result) {
      scoringEngine.finish();
      var scoreResult = scoringEngine.calculate();
      var finalResult = Object.assign({}, scoreResult, result || {});
      stateMachine.completeGame(finalResult);

      var stars = scoringEngine.getStars(finalResult.score);
      rewardManager.awardStars(gameConfig.profile, gameConfig.id, stars);
      SoloProgressRepository.completeGame(studentProfileId, gameConfig.profile, gameConfig.id, stars);

      feedbackManager.showComplete('¡Completado! Estrellas: ' + stars);
      stopPlugins();
      return finalResult;
    }

    function failGame(reason) {
      stateMachine.failGame(reason || 'unknown');
      feedbackManager.showError('Juego fallido');
      stopPlugins();
      return false;
    }

    function resetGame() {
      stopPlugins();
      stateMachine.resetGame();
      currentTemplate = null;
      gameConfig = null;
      feedbackManager.clearAll();
    }

    function returnToProfileMap() {
      stopPlugins();
      stateMachine.returnToProfileMap();
    }

    function recoverFromError() {
      errorBoundary.recover();
      stateMachine.recoverFromError();
    }

    function setTemplate(template) {
      currentTemplate = template;
    }

    function addPlugin(plugin) {
      plugins.push(plugin);
    }

    function startPlugins() {
      plugins.forEach(function (p) {
        try { if (p.start) p.start(); } catch (e) { /* plugin error */ }
      });
    }

    function pausePlugins() {
      plugins.forEach(function (p) {
        try { if (p.pause) p.pause(); } catch (e) { /* plugin error */ }
      });
    }

    function resumePlugins() {
      plugins.forEach(function (p) {
        try { if (p.resume) p.resume(); } catch (e) { /* plugin error */ }
      });
    }

    function stopPlugins() {
      plugins.forEach(function (p) {
        try { if (p.destroy) p.destroy(); } catch (e) { /* plugin error */ }
      });
      plugins = [];
    }

    function getState() { return stateMachine.getState(); }
    function getInput() { return inputManager.getState(); }
    function getScoring() { return scoringEngine ? scoringEngine.calculate() : null; }
    function getAccessibility() { return accessibility; }
    function getRewardManager() { return rewardManager; }
    function getFeedback() { return feedbackManager; }
    function getInputManager() { return inputManager; }
    function getStateMachine() { return stateMachine; }

    return {
      loadGame: loadGame,
      startGame: startGame,
      pauseGame: pauseGame,
      resumeGame: resumeGame,
      completeGame: completeGame,
      failGame: failGame,
      resetGame: resetGame,
      returnToProfileMap: returnToProfileMap,
      recoverFromError: recoverFromError,
      setTemplate: setTemplate,
      addPlugin: addPlugin,
      getState: getState,
      getInput: getInput,
      getScoring: getScoring,
      getAccessibility: getAccessibility,
      getRewardManager: getRewardManager,
      getFeedback: getFeedback,
      getInputManager: getInputManager,
      getStateMachine: getStateMachine
    };
  }

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoloGameEngine };
}
if (typeof window !== 'undefined') {
  window.SoloGameEngine = SoloGameEngine;
}
