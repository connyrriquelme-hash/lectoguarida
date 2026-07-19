/**
 * metrics-plugin.js
 * Plugin del motor que delega en MetricsCollector.
 *
 * Responsabilidades:
 * - iniciar sessionId;
 * - escuchar eventos semánticos del engine;
 * - acumular contadores de sesión;
 * - registrar eventos pedagógicos;
 * - completar resumen;
 * - limpiar listeners en destroy.
 *
 * Nunca bloquea el juego: todo queda envuelto en try/catch.
 */

var MetricsPlugin = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var collector = options.collector || null;
    var engine = options.engine || null;
    var gameConfig = options.gameConfig || null;
    var devMode = !!options.devMode;

    var sessionId = 'session-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    var sessionStart = Date.now();
    var counters = {
      hintsUsed: 0,
      repeatedAudio: 0,
      attempts: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      rounds: 0
    };
    var offs = [];
    var destroyed = false;

    function safeRecord(event) {
      if (destroyed || !collector) return null;
      try {
        return collector.recordEvent(event);
      } catch (e) {
        return null;
      }
    }

    function basePayload(extra) {
      var base = {
        sessionId: sessionId,
        readerProfile: (gameConfig && gameConfig.profile) ? gameConfig.profile : 'non_reader',
        gameId: (gameConfig && gameConfig.id) ? gameConfig.id : 'unknown',
        difficulty: (gameConfig && gameConfig.difficulty && gameConfig.difficulty.id) ? gameConfig.difficulty.id : 'standard',
        subskill: (typeof GameIdNormalizer !== 'undefined' && gameConfig && gameConfig.id)
          ? null
          : null,
        inputMode: detectInputMode()
      };
      if (extra) base = Object.assign({}, base, extra);
      return base;
    }

    function detectInputMode() {
      try {
        if (typeof navigator !== 'undefined') {
          if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) return 'touch';
        }
        if (typeof matchMedia !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return 'touch';
      } catch (e) { /* noop */ }
      try {
        if (typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent || '')) return 'touch';
      } catch (e) { /* noop */ }
      return 'unknown';
    }

    function init() {}
    function setGameConfig(cfg) {
      gameConfig = cfg || gameConfig;
    }
    function start() {
      safeRecord(basePayload({ eventType: 'session_started' }));
      if (engine && typeof engine.on === 'function') {
        offs.push(engine.on('gameCompleted', function (result) {
          onGameCompleted(result);
        }));
        offs.push(engine.on('gameAbandoned', function (info) {
          safeRecord(basePayload({
            eventType: 'game_abandoned',
            reason: (info && info.reason) ? String(info.reason).slice(0, 64) : 'unknown',
            durationMs: Date.now() - sessionStart,
            attempts: counters.attempts,
            correctAnswers: counters.correctAnswers,
            incorrectAnswers: counters.incorrectAnswers
          }));
        }));
      }
    }

    function onGameCompleted(result) {
      var res = result || {};
      var stars = (typeof res.score === 'number') ? (Math.max(0, Math.min(3, Math.round(res.score / 100)))) : 0;
      safeRecord(basePayload({
        eventType: 'game_completed',
        rounds: counters.rounds,
        correctAnswers: counters.correctAnswers,
        incorrectAnswers: counters.incorrectAnswers,
        attempts: counters.attempts,
        hintsUsed: counters.hintsUsed,
        repeatedAudio: counters.repeatedAudio,
        durationMs: Date.now() - sessionStart,
        completed: true,
        stars: stars
      }));
    }

    function pause() {}
    function resume() {}

    function recordInstruction() {
      safeRecord(basePayload({ eventType: 'instruction_played' }));
    }
    function recordAudioRepeat() {
      counters.repeatedAudio++;
      safeRecord(basePayload({ eventType: 'instruction_repeated', repeatedAudio: counters.repeatedAudio }));
    }
    function recordHint() {
      counters.hintsUsed++;
      safeRecord(basePayload({ eventType: 'hint_used', hintsUsed: counters.hintsUsed }));
    }
    function recordAnswer(payload) {
      payload = payload || {};
      if (typeof payload.correct === 'boolean') {
        counters.attempts++;
        if (payload.correct) counters.correctAnswers++;
        else counters.incorrectAnswers++;
      }
      safeRecord(basePayload(Object.assign({ eventType: 'answer_submitted' }, payload)));
    }
    function recordRound(payload) {
      payload = payload || {};
      if (typeof payload.rounds === 'number') counters.rounds = payload.rounds;
      else counters.rounds++;
      safeRecord(basePayload(Object.assign({ eventType: 'round_completed' }, payload)));
    }
    function complete(payload) {
      onGameCompleted(payload || {});
    }
    function abandon(reason) {
      safeRecord(basePayload({
        eventType: 'game_abandoned',
        reason: (typeof reason === 'string') ? reason.slice(0, 64) : 'unknown',
        durationMs: Date.now() - sessionStart,
        attempts: counters.attempts,
        correctAnswers: counters.correctAnswers,
        incorrectAnswers: counters.incorrectAnswers
      }));
    }
    function recoverableError(info) {
      safeRecord(basePayload({
        eventType: 'game_error_recovered',
        errorType: (info && info.type) ? String(info.type).slice(0, 64) : 'unknown'
      }));
    }

    function destroy() {
      destroyed = true;
      offs.forEach(function (off) { try { off(); } catch (e) { /* noop */ } });
      offs = [];
      if (collector && typeof collector.destroy === 'function') {
        try { collector.destroy(); } catch (e) { /* noop */ }
      }
    }

    return {
      init: init,
      start: start,
      setGameConfig: setGameConfig,
      pause: pause,
      resume: resume,
      destroy: destroy,
      recordInstruction: recordInstruction,
      recordAudioRepeat: recordAudioRepeat,
      recordHint: recordHint,
      recordAnswer: recordAnswer,
      recordRound: recordRound,
      complete: complete,
      abandon: abandon,
      recoverableError: recoverableError,
      getSessionId: function () { return sessionId; }
    };
  }

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MetricsPlugin };
}
if (typeof window !== 'undefined') {
  window.MetricsPlugin = MetricsPlugin;
}
