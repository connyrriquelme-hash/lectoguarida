/**
 * scoring-engine.js
 * Motor de puntaje compartido para todas las plantillas.
 * Puntaje mínimo: 0. No castigo negativo.
 * Separa: puntaje visible, métricas pedagógicas, recompensas.
 */

var ScoringEngine = (function () {
  'use strict';

  function create(config) {
    config = config || {};
    var basePoints = config.basePoints || 100;
    var accuracyBonus = config.accuracyBonus || 50;
    var persistenceBonus = config.persistenceBonus || 20;
    var hintsPenalty = config.hintsPenalty || 10;
    var timeBonus = config.timeBonus || 0;

    var metrics = {
      correct: 0,
      incorrect: 0,
      hintsUsed: 0,
      attempts: 0,
      startTime: null,
      endTime: null
    };

    function start() {
      metrics.startTime = Date.now();
    }

    function recordCorrect() {
      metrics.correct++;
      metrics.attempts++;
    }

    function recordIncorrect() {
      metrics.incorrect++;
      metrics.attempts++;
    }

    function recordHint() {
      metrics.hintsUsed++;
    }

    function finish() {
      metrics.endTime = Date.now();
    }

    function calculate() {
      var totalAttempts = metrics.correct + metrics.incorrect;
      if (totalAttempts === 0) return { score: 0, metrics: Object.assign({}, metrics) };

      var accuracy = totalAttempts > 0 ? metrics.correct / totalAttempts : 0;
      var base = metrics.correct * basePoints;
      var accBonus = accuracy * accuracyBonus;
      var persBonus = metrics.attempts > metrics.correct ? persistenceBonus : 0;
      var hintPen = metrics.hintsUsed * hintsPenalty;
      var elapsed = (metrics.endTime || Date.now()) - (metrics.startTime || Date.now());
      var timeB = timeBonus > 0 ? Math.max(0, timeBonus - Math.floor(elapsed / 1000)) : 0;

      var finalScore = Math.max(0, Math.round(base + accBonus + persBonus + timeB - hintPen));

      return {
        score: finalScore,
        base: Math.round(base),
        accuracyBonus: Math.round(accBonus),
        persistenceBonus: Math.round(persBonus),
        timeBonus: Math.round(timeB),
        hintsPenalty: Math.round(hintPen),
        metrics: Object.assign({}, metrics)
      };
    }

    function getStars(score, maxScore) {
      maxScore = maxScore || 300;
      var ratio = maxScore > 0 ? score / maxScore : 0;
      if (ratio >= 0.9) return 3;
      if (ratio >= 0.6) return 2;
      if (ratio >= 0.3) return 1;
      return 0;
    }

    function reset() {
      metrics.correct = 0;
      metrics.incorrect = 0;
      metrics.hintsUsed = 0;
      metrics.attempts = 0;
      metrics.startTime = null;
      metrics.endTime = null;
    }

    return {
      start: start,
      recordCorrect: recordCorrect,
      recordIncorrect: recordIncorrect,
      recordHint: recordHint,
      finish: finish,
      calculate: calculate,
      getStars: getStars,
      reset: reset
    };
  }

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ScoringEngine };
}
if (typeof window !== 'undefined') {
  window.ScoringEngine = ScoringEngine;
}
