/**
 * engine-context.js
 * Shared context object passed to all systems and components.
 */

export function createEngineContext(deps) {
  deps = deps || {};
  return {
    eventBus: deps.eventBus || null,
    entityManager: deps.entityManager || null,
    componentRegistry: deps.componentRegistry || null,
    systemManager: deps.systemManager || null,
    sceneManager: deps.sceneManager || null,
    prefabRegistry: deps.prefabRegistry || null,
    resourceManager: deps.resourceManager || null,
    gameTime: deps.gameTime || null,
    container: deps.container || null,
    THREE: deps.THREE || null,
    AudioManager: deps.AudioManager || null,
    progress: deps.progress || null,
    audio: deps.audio || null,
    world: deps.world || null,
    state: deps.state || null,
    debug: deps.debug || false
  };
}
