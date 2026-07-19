/**
 * legacy-challenge-adapter.js
 * Bridges V2 QuestSystem challenge events to existing AdventureChallengeAdapter.
 * Opens rhyme-catcher (or other game) via SoloGameAdapter.
 */

export function createLegacyChallengeAdapter(options) {
  var context = options.context;
  var SoloGameAdapter = options.SoloGameAdapter;
  var AudioManager = options.AudioManager;
  var studentProfileId = options.studentProfileId;
  var difficulty = options.difficulty || 'estandar';
  var container = options.container;
  var onComplete = options.onComplete;
  var destroyed = false;
  var challengeInstance = null;

  function init() {
    if (!context || !context.eventBus) return;
    context.eventBus.on('quest:challenge', onChallenge);
    context.eventBus.on('quest:challenge-complete', onChallengeComplete);
  }

  function onChallenge(payload) {
    if (destroyed) return;
    var gameId = payload && payload.gameId;
    var missionId = payload && payload.missionId;
    var rewardId = payload && payload.rewardId;
    var nextMissionId = payload && payload.nextMissionId;

    if (!gameId) return;
    if (typeof GameIdNormalizer !== 'undefined') {
      gameId = GameIdNormalizer.normalizeGameId(gameId);
    } else if (gameId === 'rim-catcher') {
      gameId = 'rhyme-catcher';
    }

    if (AudioManager && typeof AudioManager.stopSpeech === 'function') {
      AudioManager.stopSpeech();
    }

    var challengeContainer = document.createElement('div');
    challengeContainer.id = 'adv-challenge-v2';
    challengeContainer.style.cssText = 'position:absolute;inset:0;background:rgba(255,255,255,0.97);z-index:60;overflow:auto;';
    (container || document.body).appendChild(challengeContainer);

    if (context && context.eventBus) {
      context.eventBus.emit('engine:pause', {});
    }

    var adapter = SoloGameAdapter.createEngine({
      studentProfileId: studentProfileId,
      container: challengeContainer,
      gameId: gameId,
      difficulty: difficulty
    });

    if (!adapter) {
      if (onComplete) onComplete({ completed: false, error: 'engine-missing', gameId: gameId });
      cleanupChallenge();
      return;
    }

    challengeInstance = adapter;
    var engine = adapter.engine;
    var finished = false;

    engine.getStateMachine().subscribe(function (state, phase) {
      if (phase === 'GAME_COMPLETE' && !finished) {
        finished = true;
        var sc = engine.getScoring ? engine.getScoring() : null;
        var stars = sc ? (sc.score >= 200 ? 3 : sc.score >= 100 ? 2 : 1) : 1;
        if (onComplete) onComplete({
          completed: true,
          gameId: gameId,
          missionId: missionId,
          score: sc ? sc.score : 0,
          stars: stars,
          attempts: sc && sc.attempts ? sc.attempts : 1,
          rewardId: rewardId,
          nextMissionId: nextMissionId
        });
        cleanupChallenge();
      }
      if (phase === 'GAME_FAILED' && !finished) {
        finished = true;
        if (onComplete) onComplete({ completed: false, gameId: gameId, missionId: missionId, error: 'failed' });
        cleanupChallenge();
      }
    });

    adapter.loadAndStart();
  }

  function onChallengeComplete(payload) {
    // Challenge completed via event, handled by onChallenge subscribe
  }

  function cleanupChallenge() {
    if (challengeInstance) {
      var el = document.getElementById('adv-challenge-v2');
      if (el && el.parentNode) el.parentNode.removeChild(el);
      challengeInstance = null;
    }
    if (context && context.eventBus) {
      context.eventBus.emit('engine:resume', {});
    }
  }

  function destroy() {
    destroyed = true;
    cleanupChallenge();
    if (context && context.eventBus) {
      context.eventBus.off('quest:challenge', onChallenge);
      context.eventBus.off('quest:challenge-complete', onChallengeComplete);
    }
  }

  init();

  return {
    destroy: destroy
  };
}