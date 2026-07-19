/**
 * solo-state-machine.js
 * Máquina de estados explícita para el modo individual.
 * Estados: BOOT → PROFILE_READY → LOADING_GAME → INSTRUCTIONS → READY →
 *   PLAYING → PAUSED / FEEDBACK → GAME_COMPLETE / GAME_FAILED → RETURNING_TO_MAP
 *   ERROR_RECOVERABLE en cualquier momento.
 */

var SoloStateMachine = (function () {
  'use strict';

  var PHASES = {
    BOOT: 'BOOT',
    PROFILE_READY: 'PROFILE_READY',
    LOADING_GAME: 'LOADING_GAME',
    INSTRUCTIONS: 'INSTRUCTIONS',
    READY: 'READY',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    FEEDBACK: 'FEEDBACK',
    GAME_COMPLETE: 'GAME_COMPLETE',
    GAME_FAILED: 'GAME_FAILED',
    ERROR_RECOVERABLE: 'ERROR_RECOVERABLE',
    RETURNING_TO_MAP: 'RETURNING_TO_MAP'
  };

  var VALID_TRANSITIONS = {};
  VALID_TRANSITIONS[PHASES.BOOT] = [PHASES.PROFILE_READY, PHASES.ERROR_RECOVERABLE];
  VALID_TRANSITIONS[PHASES.PROFILE_READY] = [PHASES.LOADING_GAME, PHASES.RETURNING_TO_MAP, PHASES.ERROR_RECOVERABLE];
  VALID_TRANSITIONS[PHASES.LOADING_GAME] = [PHASES.INSTRUCTIONS, PHASES.ERROR_RECOVERABLE];
  VALID_TRANSITIONS[PHASES.INSTRUCTIONS] = [PHASES.READY, PHASES.PLAYING, PHASES.RETURNING_TO_MAP, PHASES.ERROR_RECOVERABLE];
  VALID_TRANSITIONS[PHASES.READY] = [PHASES.PLAYING, PHASES.RETURNING_TO_MAP, PHASES.ERROR_RECOVERABLE];
  VALID_TRANSITIONS[PHASES.PLAYING] = [PHASES.PAUSED, PHASES.FEEDBACK, PHASES.GAME_COMPLETE, PHASES.GAME_FAILED, PHASES.ERROR_RECOVERABLE];
  VALID_TRANSITIONS[PHASES.PAUSED] = [PHASES.PLAYING, PHASES.RETURNING_TO_MAP, PHASES.ERROR_RECOVERABLE];
  VALID_TRANSITIONS[PHASES.FEEDBACK] = [PHASES.PLAYING, PHASES.GAME_COMPLETE, PHASES.GAME_FAILED, PHASES.ERROR_RECOVERABLE];
  VALID_TRANSITIONS[PHASES.GAME_COMPLETE] = [PHASES.RETURNING_TO_MAP, PHASES.LOADING_GAME, PHASES.ERROR_RECOVERABLE];
  VALID_TRANSITIONS[PHASES.GAME_FAILED] = [PHASES.RETURNING_TO_MAP, PHASES.LOADING_GAME, PHASES.ERROR_RECOVERABLE];
  VALID_TRANSITIONS[PHASES.ERROR_RECOVERABLE] = [PHASES.PROFILE_READY, PHASES.RETURNING_TO_MAP, PHASES.BOOT];
  VALID_TRANSITIONS[PHASES.RETURNING_TO_MAP] = [PHASES.PROFILE_READY, PHASES.BOOT];

  function create() {
    var state = {
      phase: PHASES.BOOT,
      readerProfile: null,
      gameId: null,
      templateId: null,
      score: 0,
      attempts: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      hintsUsed: 0,
      inputMode: 'mouse',
      reward: null,
      startedAt: null,
      completedAt: null,
      error: null
    };

    var listeners = [];

    function subscribe(fn) {
      listeners.push(fn);
      return function () {
        listeners = listeners.filter(function (l) { return l !== fn; });
      };
    }

    function notify(phase, reason) {
      listeners.forEach(function (fn) {
        try { fn(state, phase, reason); } catch (e) { /* listener error */ }
      });
    }

    function transitionTo(nextPhase, reason) {
      var allowed = VALID_TRANSITIONS[state.phase];
      if (!allowed || allowed.indexOf(nextPhase) === -1) {
        return { ok: false, from: state.phase, to: nextPhase };
      }
      var prev = state.phase;
      state.phase = nextPhase;
      notify(nextPhase, reason || 'transition');
      return { ok: true, from: prev, to: nextPhase };
    }

    function loadGame(config) {
      state.gameId = config.id;
      state.templateId = config.template;
      state.readerProfile = config.profile;
      state.score = 0;
      state.attempts = 0;
      state.correctAnswers = 0;
      state.incorrectAnswers = 0;
      state.hintsUsed = 0;
      state.reward = null;
      state.startedAt = null;
      state.completedAt = null;
      state.error = null;
      return transitionTo(PHASES.LOADING_GAME, 'loadGame');
    }

    function startGame() {
      state.startedAt = Date.now();
      return transitionTo(PHASES.PLAYING, 'startGame');
    }

    function pauseGame() {
      return transitionTo(PHASES.PAUSED, 'pauseGame');
    }

    function resumeGame() {
      return transitionTo(PHASES.PLAYING, 'resumeGame');
    }

    function completeGame(result) {
      state.completedAt = Date.now();
      state.score = result.score;
      state.correctAnswers = result.correctAnswers;
      state.reward = result.reward;
      return transitionTo(PHASES.GAME_COMPLETE, 'completeGame');
    }

    function failGame(reason) {
      state.error = reason;
      return transitionTo(PHASES.GAME_FAILED, 'failGame');
    }

    function resetGame() {
      state.phase = PHASES.BOOT;
      state.gameId = null;
      state.templateId = null;
      state.score = 0;
      state.attempts = 0;
      state.correctAnswers = 0;
      state.incorrectAnswers = 0;
      state.hintsUsed = 0;
      state.reward = null;
      state.startedAt = null;
      state.completedAt = null;
      state.error = null;
    }

    function returnToProfileMap() {
      return transitionTo(PHASES.RETURNING_TO_MAP, 'returnToProfileMap');
    }

    function recoverFromError() {
      return transitionTo(PHASES.ERROR_RECOVERABLE, 'recoverFromError');
    }

    function getState() {
      return Object.assign({}, state);
    }

    return {
      PHASES: PHASES,
      subscribe: subscribe,
      transitionTo: transitionTo,
      loadGame: loadGame,
      startGame: startGame,
      pauseGame: pauseGame,
      resumeGame: resumeGame,
      completeGame: completeGame,
      failGame: failGame,
      resetGame: resetGame,
      returnToProfileMap: returnToProfileMap,
      recoverFromError: recoverFromError,
      getState: getState
    };
  }

  return { create: create, PHASES: PHASES };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoloStateMachine };
}
if (typeof window !== 'undefined') {
  window.SoloStateMachine = SoloStateMachine;
}
