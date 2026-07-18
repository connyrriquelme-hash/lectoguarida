/**
 * solo-game-adapter.js
 * Adaptador entre el motor solo, el contenido JSON, el template,
 * feedback, reward y progress.
 * No duplica lógica — orquesta las piezas existentes.
 */

var SoloGameAdapter = (function () {
  'use strict';

  var GAME_REGISTRY = {};

  function registerGame(gameDef) {
    GAME_REGISTRY[gameDef.id] = gameDef;
  }

  function getGameDef(gameId) {
    return GAME_REGISTRY[gameId] || null;
  }

  function listGames(profile) {
    var result = [];
    var keys = Object.keys(GAME_REGISTRY);
    for (var i = 0; i < keys.length; i++) {
      var def = GAME_REGISTRY[keys[i]];
      if (!profile || def.profile === profile) {
        result.push({ id: def.id, title: def.title, template: def.template, profile: def.profile });
      }
    }
    return result;
  }

  function createEngine(options) {
    options = options || {};
    var studentProfileId = options.studentProfileId || 'default';
    var container = options.container;
    var gameId = options.gameId;

    var gameDef = getGameDef(gameId);
    if (!gameDef) return null;

    var engine = SoloGameEngine.create({
      studentProfileId: studentProfileId,
      container: container
    });

    var template = gameDef.createTemplate(container, gameDef.content, engine);

    engine.setTemplate(template);
    engine.addPlugin(AudioInstructionPlugin.create({ audioManager: AudioManager }));
    engine.addPlugin(TimerPlugin.create({ accessibility: engine.getAccessibility() }));
    engine.addPlugin(KeyboardInputPlugin.create({ inputManager: engine.getInputManager() }));
    engine.addPlugin(RewardPlugin.create({ rewardManager: engine.getRewardManager() }));
    engine.addPlugin(AccessibilityPlugin.create({ accessibility: engine.getAccessibility() }));

    var config = {
      id: gameDef.id,
      title: gameDef.title,
      profile: gameDef.profile,
      template: gameDef.template,
      instructions: gameDef.instructions,
      accessibility: gameDef.accessibility,
      content: gameDef.content,
      scoring: gameDef.scoring,
      rewards: gameDef.rewards,
      completion: gameDef.completion
    };

    return {
      engine: engine,
      config: config,
      loadAndStart: function () {
        engine.loadGame(config);
        engine.startGame();
      }
    };
  }

  return {
    registerGame: registerGame,
    getGameDef: getGameDef,
    listGames: listGames,
    createEngine: createEngine
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoloGameAdapter };
}
if (typeof window !== 'undefined') {
  window.SoloGameAdapter = SoloGameAdapter;
}
