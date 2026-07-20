/**
 * initial-sound-learning-adapter.js
 * Adapter que envuelve initial-sound-detector.js existente.
 * No reescribe el minijuego. Inyecta rondas dinámicas desde stimulus-set
 * y captura eventos para generar evidencia de aprendizaje.
 */

export function createInitialSoundLearningAdapter(options) {
  var stimulusSet = options.stimulusSet;
  var eventBus = options.eventBus || null;
  var missionOrchestrator = options.missionOrchestrator;
  var masteryEngine = options.masteryEngine;
  var studentModel = options.studentModel;
  var difficulty = options.difficulty || 2;
  var onRoundComplete = options.onRoundComplete || null;
  var onChallengeComplete = options.onChallengeComplete || null;

  var rounds = [];
  var currentRoundIndex = 0;
  var results = [];
  var startTime = null;
  var roundStartTime = null;
  var destroyed = false;

  function buildRounds() {
    if (!stimulusSet) return [];
    var targets = stimulusSet.targets || [];
    var distractors = stimulusSet.distractors || [];
    var optionCount = difficulty === 1 ? 2 : difficulty === 2 ? 3 : 4;
    var roundsBuilt = [];

    for (var i = 0; i < targets.length && roundsBuilt.length < 8; i++) {
      var target = targets[i];
      var roundDistractors = [];
      for (var j = 0; j < distractors.length && roundDistractors.length < optionCount - 1; j++) {
        if (distractors[j].initialSound !== target.initialSound) {
          roundDistractors.push(distractors[j]);
        }
      }
      var options = [{ wordId: target.wordId, value: target.wordId, isCorrect: true }];
      for (var k = 0; k < roundDistractors.length; k++) {
        options.push({ wordId: roundDistractors[k].wordId, value: roundDistractors[k].wordId, isCorrect: false });
      }
      shuffleArray(options);
      roundsBuilt.push({
        stimulusId: target.wordId,
        correctValue: target.wordId,
        options: options,
        question: null
      });
    }
    return roundsBuilt;
  }

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function start() {
    rounds = buildRounds();
    currentRoundIndex = 0;
    results = [];
    startTime = Date.now();
    roundStartTime = Date.now();
    if (eventBus) {
      eventBus.emit('learning:challenge-started', { challengeId: 'initial-sound-detector', rounds: rounds.length });
    }
  }

  function processSelection(selectedValue) {
    if (destroyed || currentRoundIndex >= rounds.length) return null;
    var round = rounds[currentRoundIndex];
    var correct = selectedValue === round.correctValue;
    var responseMs = Date.now() - roundStartTime;

    var result = {
      stimulusId: round.stimulusId,
      responseId: selectedValue,
      correct: correct,
      responseMs: responseMs,
      roundIndex: currentRoundIndex,
      totalRounds: rounds.length
    };
    results.push(result);

    if (eventBus) {
      eventBus.emit('learning:answer-selected', result);
      eventBus.emit('learning:answer-result', { correct: correct, stimulusId: round.stimulusId });
    }

    if (missionOrchestrator) {
      missionOrchestrator.processRoundResult({
        challengeId: 'initial-sound-detector',
        stimulusId: round.stimulusId,
        responseId: selectedValue,
        correct: correct,
        responseMs: responseMs,
        hintsUsed: 0,
        audioRepetitions: 0,
        difficulty: difficulty
      });
    }

    if (onRoundComplete) {
      onRoundComplete(result);
    }

    currentRoundIndex += 1;
    roundStartTime = Date.now();

    if (currentRoundIndex >= rounds.length) {
      return completeChallenge();
    }

    return { completed: false, roundResult: result, nextRound: currentRoundIndex };
  }

  function completeChallenge() {
    var correctCount = results.filter(function (r) { return r.correct; }).length;
    var totalTime = Date.now() - startTime;
    var challengeResult = {
      completed: true,
      challengeId: 'initial-sound-detector',
      score: correctCount,
      totalRounds: rounds.length,
      correctCount: correctCount,
      attempts: results.length,
      totalTimeMs: totalTime
    };

    if (eventBus) {
      eventBus.emit('learning:challenge-completed', challengeResult);
    }

    if (onChallengeComplete) {
      onChallengeComplete(challengeResult);
    }

    return { completed: true, result: challengeResult };
  }

  function abandon() {
    destroyed = true;
    if (eventBus) {
      eventBus.emit('learning:challenge-abandoned', {
        challengeId: 'initial-sound-detector',
        roundsCompleted: currentRoundIndex,
        totalRounds: rounds.length
      });
    }
  }

  function getRounds() {
    return rounds.slice();
  }

  function getCurrentRound() {
    if (currentRoundIndex >= rounds.length) return null;
    return rounds[currentRoundIndex];
  }

  function getResults() {
    return results.slice();
  }

  function destroy() {
    destroyed = true;
    rounds = [];
    results = [];
  }

  return {
    start: start,
    processSelection: processSelection,
    abandon: abandon,
    getRounds: getRounds,
    getCurrentRound: getCurrentRound,
    getResults: getResults,
    destroy: destroy
  };
}
