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

    var assetLoader = options.assetLoader || (typeof AssetLoader !== 'undefined' ? AssetLoader.create({}) : null);
    var manifestUrl = (gameDef.profile === 'non_reader')
      ? ('/expedicion/solo/games/non-reader/' + gameDef.id + '/assets-manifest.json')
      : null;

    var assetsReady = Promise.resolve(null);
    if (assetLoader && manifestUrl) {
      assetsReady = assetLoader.loadManifest(manifestUrl).then(function (manifest) {
        return assetLoader.preloadAssets(manifest.assets);
      }).catch(function () { return null; });
    }

    var difficultyId = options.difficulty;
    if (!difficultyId && typeof NonReaderDifficultyStore !== 'undefined' && NonReaderDifficultyStore.getDifficulty) {
      difficultyId = NonReaderDifficultyStore.getDifficulty(studentProfileId, gameDef.profile);
    }
    var difficultyConfig = (typeof NonReaderDifficulty !== 'undefined' && NonReaderDifficulty.getNonReaderDifficultyConfig)
      ? NonReaderDifficulty.getNonReaderDifficultyConfig(difficultyId)
      : null;
    if (!difficultyConfig) {
      difficultyConfig = { id: 'standard', label: 'Estándar', optionCount: 4, largeTargets: false, visualDemo: false, hintsAvailable: true, closeDistractors: false, speechRate: 0.88, fallSpeed: 1.2 };
    }

    var userAccessibility = options.accessibility || {};
    var difficultyAccessibility = {
      largeTargets: !!difficultyConfig.largeTargets,
      visualDemo: !!difficultyConfig.visualDemo,
      hintsAvailable: !!difficultyConfig.hintsAvailable,
      timer: false
    };
    var baseAccessibility = gameDef.accessibility || {};
    var mergedAccessibility = Object.assign({}, baseAccessibility, difficultyAccessibility, userAccessibility);

    var content = buildDifficultyContent(gameDef, difficultyConfig, mergedAccessibility, engine);

    if (typeof AudioManager !== 'undefined' && typeof AudioManager.setDefaultSpeechRate === 'function') {
      AudioManager.setDefaultSpeechRate(difficultyConfig.speechRate || 0.88);
    }

    var template = gameDef.createTemplate(container, content, engine);

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
      accessibility: mergedAccessibility,
      content: content,
      scoring: gameDef.scoring,
      rewards: gameDef.rewards,
      completion: gameDef.completion,
      difficulty: {
        id: difficultyConfig.id,
        label: difficultyConfig.label,
        optionCount: difficultyConfig.optionCount,
        largeTargets: !!difficultyConfig.largeTargets,
        visualDemo: !!difficultyConfig.visualDemo,
        hintsAvailable: !!difficultyConfig.hintsAvailable,
        closeDistractors: !!difficultyConfig.closeDistractors,
        timer: !!difficultyConfig.timer,
        speechRate: difficultyConfig.speechRate,
        fallSpeed: difficultyConfig.fallSpeed
      },
      __assetLoader: assetLoader,
      __assetsReady: assetsReady
    };

    function startGameSafe() {
      engine.loadGame(config);
      engine.startGame();
      if (assetLoader && container) {
        assetsReady.then(function () {
          try {
            if (window.ResilientGameAsset) window.ResilientGameAsset.decorate(container, assetLoader, {
              reducedMotion: !!(config.accessibility && config.accessibility.reducedMotion)
            });
          } catch (e) { /* ignore decoración tardía */ }
        });
      }
    }

    return {
      engine: engine,
      config: config,
      assetLoader: assetLoader,
      assetsReady: assetsReady,
      difficulty: config.difficulty,
      loadAndStart: function () {
        startGameSafe();
      }
    };
  }

  function buildDifficultyContent(gameDef, difficultyConfig, accessibility, engine) {
    var content = gameDef.content || {};
    if (!content || typeof content !== 'object') return content;
    var copy = Object.assign({}, content);

    if (gameDef.id === 'syllable-counter') {
      var minSyl = difficultyConfig.id === 'challenge' ? 2 : 1;
      var maxSyl = difficultyConfig.id === 'support' ? 2 : (difficultyConfig.id === 'challenge' ? 4 : 3);
      if (Array.isArray(content)) {
        var filtered = content.filter(function (round) {
          var n = round && Array.isArray(round.syllables) ? round.syllables.length : 1;
          return n >= minSyl && n <= maxSyl;
        });
        copy = filtered.length ? filtered : content;
      } else if (Array.isArray(content.syllables)) {
        var filteredTop = content.syllables.filter(function (item) {
          var n = item && typeof item.syllables === 'number' ? item.syllables : (item && Array.isArray(item.parts) ? item.parts.length : 1);
          return n >= minSyl && n <= maxSyl;
        });
        copy.syllables = filteredTop.length ? filteredTop : content.syllables;
      }
      var sylCopy = Array.isArray(copy) ? copy : content;
      if (engine && typeof engine.setDifficulty === 'function') {
        engine.setDifficulty({
          id: difficultyConfig.id,
          visualDemo: !!difficultyConfig.visualDemo,
          staticGrid: !!accessibility.reducedMotion
        });
      }
      if (Array.isArray(copy)) {
        copy.forEach(function (r) {
          if (r) { r.visualDemo = !!difficultyConfig.visualDemo; r.staticGrid = !!accessibility.reducedMotion; }
        });
      }
      return copy;
    }

    if (gameDef.template === 'falling_items') {
      copy.fallSpeed = difficultyConfig.fallSpeed;
      copy.closeDistractors = !!difficultyConfig.closeDistractors;
      copy.largeTargets = !!difficultyConfig.largeTargets;
      copy.staticGrid = !!accessibility.reducedMotion;
      return copy;
    }

    if (Array.isArray(content)) {
      return content.map(function (round) {
        if (round && round.options && Array.isArray(round.options)) {
          var r = Object.assign({}, round);
          r.options = round.options.slice(0, difficultyConfig.optionCount);
          return r;
        }
        return round;
      });
    }

    if (content.options && Array.isArray(content.options)) {
      copy.options = content.options.slice(0, difficultyConfig.optionCount);
      copy.closeDistractors = !!difficultyConfig.closeDistractors;
      copy.largeTargets = !!difficultyConfig.largeTargets;
      if (content.rounds && Array.isArray(content.rounds)) {
        copy.rounds = content.rounds.map(function (round) {
          if (round && round.options && Array.isArray(round.options)) {
            var r = Object.assign({}, round);
            r.options = round.options.slice(0, difficultyConfig.optionCount);
            return r;
          }
          return round;
        });
      }
      return copy;
    }

    return copy;
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
