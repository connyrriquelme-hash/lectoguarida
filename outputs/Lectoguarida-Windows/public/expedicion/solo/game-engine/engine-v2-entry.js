/**
 * engine-v2-entry.js
 * Entry point for Game Engine V2.
 * Creates engine, registers components/systems/prefabs, loads Plaza scene,
 * connects Three.js render, and legacy adapters.
 */

import { createGameEngine, EngineState } from './core/game-engine.js';
import { createThreeRenderAdapter } from './adapters/three-render-adapter.js';
import { createLegacyInputAdapter } from './adapters/legacy-input-adapter.js';
import { createLegacyCameraAdapter } from './adapters/legacy-camera-adapter.js';
import { createLegacyNarrativeAdapter } from './adapters/legacy-narrative-adapter.js';
import { createLegacyAudioAdapter } from './adapters/legacy-audio-adapter.js';
import { createLegacyChallengeAdapter } from './adapters/legacy-challenge-adapter.js';
import { createLegacyProgressAdapter } from './adapters/legacy-progress-adapter.js';
import { isLearningV1Enabled } from '../game-learning/runtime/learning-feature-flag.js';
import { createLearningRuntime } from '../game-learning/runtime/learning-runtime.js';
import { registerComponents } from './core/component-registration.js';
import { registerSystems } from './core/system-registration.js';
import { registerPrefabs } from './core/prefab-registration.js';
import { loadSceneData } from './core/scene-loader.js';

export function createGameEngineV2(options) {
  options = options || {};
  var container = options.container;
  var studentProfileId = options.studentProfileId || 'default-student';
  var difficulty = options.difficulty || 'estandar';
  var searchParams = options.searchParams || null;
  var deps = options.deps || {};
  var debug = options.debug || false;

  var engine = null;
  var context = null;
  var renderAdapter = null;
  var legacyAdapters = {
    input: null,
    camera: null,
    narrative: null,
    audio: null,
    challenge: null,
    progress: null
  };
  var learningRuntime = null;
  var destroyed = false;

  function initialize() {
    if (destroyed) return Promise.reject(new Error('Engine already destroyed'));

    engine = createGameEngine({
      container: container,
      THREE: deps.THREE,
      AudioManager: deps.AudioManager,
      progress: deps.SoloProgressRepository ? createProgressAdapter(deps.SoloProgressRepository, studentProfileId) : null,
      debug: debug
    });

    context = engine.getContext();

    registerComponents(context.componentRegistry);
    registerSystems(context.systemManager);
    registerPrefabs(context.prefabRegistry);

    return loadSceneData('plaza-guarida')
      .then(function (sceneData) {
        context.sceneManager.registerScene(sceneData);
        return engine.loadScene('plaza-guarida');
      })
      .then(function (loaded) {
        if (!loaded) throw new Error('Failed to load plaza-guarida scene');
        return createAdaptersAndEntities();
      })
      .then(function () {
        return engine.initialize();
      });
  }

  function createAdaptersAndEntities() {
    renderAdapter = createThreeRenderAdapter({
      context: context,
      scene: context.world && context.world.scene,
      renderer: context.world && context.world.renderer,
      camera: context.world && context.world.camera
    });

    legacyAdapters.input = createLegacyInputAdapter({
      context: context,
      joystick: deps.joystick,
      wasd: deps.wasd,
      clickToMove: deps.clickToMove
    });

    legacyAdapters.camera = createLegacyCameraAdapter({
      context: context,
      cameraController: context.world && context.world.cameraController
    });

    legacyAdapters.narrative = createLegacyNarrativeAdapter({
      context: context,
      narrativePanel: deps.narrativePanel,
      captionController: deps.captionController,
      dialogueManager: deps.dialogueManager
    });

    legacyAdapters.audio = createLegacyAudioAdapter({
      context: context,
      AudioManager: deps.AudioManager
    });

    var learningV1 = isLearningV1Enabled(searchParams);

    if (learningV1) {
      try {
        learningRuntime = createLearningRuntime({
          searchParams: searchParams,
          studentId: studentProfileId,
          eventBus: context.eventBus,
          SoloProgressRepository: deps.SoloProgressRepository,
          RewardManager: deps.RewardManager,
          missionData: deps.missionData || null
        });
      } catch (e) {
        learningRuntime = null;
      }
    }

    if (!learningRuntime) {
      legacyAdapters.challenge = createLegacyChallengeAdapter({
        context: context,
        SoloGameAdapter: deps.SoloGameAdapter,
        AudioManager: deps.AudioManager,
        studentProfileId: studentProfileId,
        difficulty: difficulty,
        container: container,
        onComplete: function (result) {
          if (result && result.completed) {
            context.eventBus.emit('quest:challenge-complete', result);
          }
        }
      });

      legacyAdapters.progress = createLegacyProgressAdapter({
        context: context,
        SoloProgressRepository: deps.SoloProgressRepository,
        studentProfileId: studentProfileId
      });
    }

    spawnPlayerAndEntities();
  }

  function spawnPlayerAndEntities() {
    var em = context.entityManager;
    var prefabRegistry = context.prefabRegistry;
    var sceneManager = context.sceneManager;
    var spawnPoint = sceneManager.getSpawnPoint('default');

    var characterId = (legacyAdapters.progress && legacyAdapters.progress.getCharacter) ? legacyAdapters.progress.getCharacter() : 'lumi';
    var playerEntity = prefabRegistry.instantiate('player-' + characterId, {
      transform: spawnPoint ? { position: spawnPoint.position } : {}
    });
    var playerId = em.createEntity(playerEntity);
    context.playerEntityId = playerId;
    em.addTag(playerId, 'player');
    em.addTag(playerId, 'cameraTarget');

    legacyAdapters.input.setPlayerEntity(playerId);
    legacyAdapters.camera.setTarget(playerId);

    var rinaEntity = prefabRegistry.instantiate('rina-guardian');
    var rinaId = em.createEntity(rinaEntity);
    em.addTag(rinaId, 'guardian');

    var bellEntity = prefabRegistry.instantiate('lagoon-bell', {
      transform: { position: [0, 0, -50] },
      active: false
    });
    var bellId = em.createEntity(bellEntity);
    em.addTag(bellId, 'bell');
    context.bellEntityId = bellId;
  }

  function start() {
    if (!engine || destroyed) return false;
    if (engine.getState() !== EngineState.READY) return false;
    engine.start();
    if (renderAdapter) renderAdapter.start();
    return true;
  }

  function pause() {
    if (!engine) return false;
    return engine.pause();
  }

  function resume() {
    if (!engine) return false;
    return engine.resume();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;

    if (learningRuntime && learningRuntime.destroy) {
      learningRuntime.destroy();
    }

    Object.keys(legacyAdapters).forEach(function (key) {
      if (legacyAdapters[key] && legacyAdapters[key].destroy) {
        legacyAdapters[key].destroy();
      }
    });

    if (renderAdapter && renderAdapter.destroy) renderAdapter.destroy();
    if (engine) engine.destroy();
  }

  function getEngine() { return engine; }
  function getContext() { return context; }
  function getLearningRuntime() { return learningRuntime; }

  return {
    initialize: initialize,
    start: start,
    pause: pause,
    resume: resume,
    destroy: destroy,
    getEngine: getEngine,
    getContext: getContext,
    getLearningRuntime: getLearningRuntime
  };
}

function createProgressAdapter(SoloProgressRepository, studentProfileId) {
  return {
    loadAdventure: function () {
      return SoloProgressRepository.getProfileProgress(studentProfileId, 'non_reader') || {};
    },
    saveAdventure: function (patch) {
      var p = SoloProgressRepository.getProfileProgress(studentProfileId, 'non_reader') || {};
      var next = Object.assign({}, p, patch);
      SoloProgressRepository.updateProfileProgress(studentProfileId, 'non_reader', next);
      return next;
    },
    getCharacter: function () {
      return SoloProgressRepository.getProfileProgress(studentProfileId, 'non_reader')?.adventure?.characterId;
    },
    markCollectible: function (id) {
      var a = SoloProgressRepository.getProfileProgress(studentProfileId, 'non_reader') || {};
      var adv = Object.assign({}, a.adventure || {});
      var found = adv.collectiblesFound || [];
      if (found.indexOf(id) < 0) found.push(id);
      adv.collectiblesFound = found;
      SoloProgressRepository.updateProfileProgress(studentProfileId, 'non_reader', Object.assign({}, a, { adventure: adv }));
    },
    addReward: function (rewardId) {
      var a = SoloProgressRepository.getProfileProgress(studentProfileId, 'non_reader') || {};
      var adv = Object.assign({}, a.adventure || {});
      var rewards = adv.rewardIds || [];
      if (rewards.indexOf(rewardId) < 0) rewards.push(rewardId);
      adv.rewardIds = rewards;
      SoloProgressRepository.updateProfileProgress(studentProfileId, 'non_reader', Object.assign({}, a, { adventure: adv }));
    },
    completeMission: function (missionId) {
      var a = SoloProgressRepository.getProfileProgress(studentProfileId, 'non_reader') || {};
      var adv = Object.assign({}, a.adventure || {});
      var completed = adv.completedMissions || [];
      if (completed.indexOf(missionId) < 0) completed.push(missionId);
      adv.completedMissions = completed;
      SoloProgressRepository.updateProfileProgress(studentProfileId, 'non_reader', Object.assign({}, a, { adventure: adv }));
    },
    addStars: function (amount) {
      var a = SoloProgressRepository.getProfileProgress(studentProfileId, 'non_reader') || {};
      var adv = Object.assign({}, a.adventure || {});
      adv.stars = Math.max(0, (adv.stars || 0) + amount);
      SoloProgressRepository.updateProfileProgress(studentProfileId, 'non_reader', Object.assign({}, a, { adventure: adv }));
    }
  };
}