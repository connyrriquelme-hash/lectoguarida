/**
 * challenge-adapter.js
 * Abre un juego existente (rhyme-catcher, etc.) como desafío dentro de la
 * aventura, pausando el mundo 3D y capturando el resultado.
 * Reutiliza SoloGameAdapter.createEngine y NO duplica el motor pedagógico.
 */

export function createChallengeAdapter(deps) {
  var SoloGameAdapter = deps.SoloGameAdapter;
  var AudioManager = deps.AudioManager;
  var onResult = deps.onResult;

  function open(opts) {
    var gameId = opts.gameId;
    if (typeof GameIdNormalizer !== 'undefined') {
      gameId = GameIdNormalizer.normalizeGameId(gameId);
    } else if (gameId === 'rim-catcher') {
      gameId = 'rhyme-catcher';
    }
    var difficulty = opts.difficulty;
    var studentProfileId = opts.studentProfileId;
    var missionId = opts.missionId;
    var container = opts.container;
    var returnPath = opts.returnPath || '/expedicion/solo/no-lectores';

    if (typeof AudioManager !== 'undefined' && AudioManager.cancel) AudioManager.cancel();

    var adapter = SoloGameAdapter.createEngine({
      studentProfileId: studentProfileId,
      container: container,
      gameId: gameId,
      difficulty: difficulty
    });

    if (!adapter) {
      if (onResult) onResult({ completed: false, error: 'engine-missing', gameId: gameId });
      return null;
    }

    var engine = adapter.engine;
    var finished = false;

    engine.getStateMachine().subscribe(function (state, phase) {
      if (phase === 'GAME_COMPLETE' && !finished) {
        finished = true;
        var sc = engine.getScoring ? engine.getScoring() : null;
        var stars = sc ? (sc.score >= 200 ? 3 : sc.score >= 100 ? 2 : 1) : 1;
        if (onResult) onResult({
          completed: true,
          gameId: gameId,
          missionId: missionId,
          score: sc ? sc.score : 0,
          stars: stars,
          attempts: sc && sc.attempts ? sc.attempts : 1,
          rewardId: opts.rewardId || null,
          nextMissionId: opts.nextMissionId || null
        });
      }
      if (phase === 'GAME_FAILED' && !finished) {
        finished = true;
        if (onResult) onResult({ completed: false, gameId: gameId, missionId: missionId, error: 'failed' });
      }
    });

    adapter.loadAndStart();
    return { engine: engine, stop: function () { finished = true; } };
  }

  return { open: open };
}
