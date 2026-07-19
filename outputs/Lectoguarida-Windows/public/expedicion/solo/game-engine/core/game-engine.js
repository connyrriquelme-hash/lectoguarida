/**
 * game-engine.js
 * Main game engine — orchestrates lifecycle, ECS, scenes, and systems.
 */

import { createEventBus } from './event-bus.js';
import { createGameLoop } from './game-loop.js';
import { createEntityManager } from './entity-manager.js';
import { createComponentRegistry } from './component-registry.js';
import { createSystemManager } from './system-manager.js';
import { createSceneManager } from './scene-manager.js';
import { createPrefabRegistry } from './prefab-registry.js';
import { createResourceManager } from './resource-manager.js';
import { createEngineContext } from './engine-context.js';

var EngineState = {
  CREATED: 'CREATED',
  INITIALIZING: 'INITIALIZING',
  READY: 'READY',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  LOADING_SCENE: 'LOADING_SCENE',
  STOPPING: 'STOPPING',
  DESTROYED: 'DESTROYED',
  ERROR: 'ERROR'
};

export function createGameEngine(options) {
  options = options || {};
  var state = EngineState.CREATED;
  var destroyed = false;

  var eventBus = createEventBus();
  var entityManager = createEntityManager(eventBus);
  var componentRegistry = createComponentRegistry();
  var systemManager = createSystemManager();
  var sceneManager = createSceneManager(eventBus, entityManager);
  var prefabRegistry = createPrefabRegistry();
  var resourceManager = createResourceManager();

  var loop = createGameLoop({
    fixedUpdate: function (fixedDelta) {
      if (state !== EngineState.RUNNING) return;
      systemManager.fixedUpdate(context, fixedDelta);
    },
    update: function (delta) {
      if (state !== EngineState.RUNNING) return;
      systemManager.update(context, delta);
    },
    lateUpdate: function (delta) {
      if (state !== EngineState.RUNNING) return;
      systemManager.lateUpdate(context, delta);
    },
    render: function () {}
  });

  var context = createEngineContext({
    eventBus: eventBus,
    entityManager: entityManager,
    componentRegistry: componentRegistry,
    systemManager: systemManager,
    sceneManager: sceneManager,
    prefabRegistry: prefabRegistry,
    resourceManager: resourceManager,
    gameTime: loop.getTime(),
    container: options.container || null,
    THREE: options.THREE || null,
    AudioManager: options.AudioManager || null,
    progress: options.progress || null,
    audio: options.audio || null,
    world: options.world || null,
    state: null,
    debug: options.debug || false
  });

  function initialize() {
    if (state !== EngineState.CREATED) return false;
    state = EngineState.INITIALIZING;
    systemManager.initialize(context);
    state = EngineState.READY;
    eventBus.emit('engine:ready', {});
    return true;
  }

  function loadScene(sceneId) {
    if (state === EngineState.DESTROYED || state === EngineState.ERROR) return false;
    state = EngineState.LOADING_SCENE;
    var result = sceneManager.loadScene(sceneId);
    if (result) {
      state = EngineState.READY;
    } else {
      state = EngineState.ERROR;
    }
    return result;
  }

  function start() {
    if (state !== EngineState.READY) return false;
    state = EngineState.RUNNING;
    loop.start();
    return true;
  }

  function pause() {
    if (state !== EngineState.RUNNING) return false;
    state = EngineState.PAUSED;
    loop.pause();
    return true;
  }

  function resume() {
    if (state !== EngineState.PAUSED) return false;
    state = EngineState.RUNNING;
    loop.resume();
    return true;
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    state = EngineState.STOPPING;
    loop.stop();
    systemManager.destroy(context);
    entityManager.clear();
    componentRegistry.clear();
    resourceManager.clear();
    eventBus.clear();
    state = EngineState.DESTROYED;
  }

  return {
    initialize: initialize,
    loadScene: loadScene,
    start: start,
    pause: pause,
    resume: resume,
    destroy: destroy,
    getState: function () { return state; },
    isDestroyed: function () { return destroyed; },
    getEventBus: function () { return eventBus; },
    getEntityManager: function () { return entityManager; },
    getComponentRegistry: function () { return componentRegistry; },
    getSystemManager: function () { return systemManager; },
    getSceneManager: function () { return sceneManager; },
    getPrefabRegistry: function () { return prefabRegistry; },
    getResourceManager: function () { return resourceManager; },
    getContext: function () { return context; },
    getLoop: function () { return loop; },
    EngineState: EngineState
  };
}

export { EngineState };
