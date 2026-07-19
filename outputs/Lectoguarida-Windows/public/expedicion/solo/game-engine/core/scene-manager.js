/**
 * scene-manager.js
 * Manages scene loading, unloading, and transitions.
 */

export function createSceneManager(eventBus, entityManager) {
  var activeScene = null;
  var scenes = {};

  function registerScene(sceneData) {
    if (!sceneData || !sceneData.id) return;
    scenes[sceneData.id] = sceneData;
  }

  function getActiveScene() { return activeScene; }

  function loadScene(sceneId) {
    var sceneData = scenes[sceneId];
    if (!sceneData) return false;
    if (activeScene) unloadScene();
    if (eventBus) eventBus.emit('scene:loading', { sceneId: sceneId });
    activeScene = { id: sceneId, data: sceneData, entities: [] };
    if (eventBus) eventBus.emit('scene:loaded', { sceneId: sceneId });
    return true;
  }

  function unloadScene() {
    if (!activeScene) return;
    var sceneId = activeScene.id;
    if (eventBus) eventBus.emit('scene:unloading', { sceneId: sceneId });
    activeScene = null;
  }

  function reloadScene() {
    if (!activeScene) return;
    var sceneId = activeScene.id;
    unloadScene();
    loadScene(sceneId);
  }

  function getSpawnPoint(spawnPointId) {
    if (!activeScene || !activeScene.data) return null;
    var spawnPoints = activeScene.data.spawnPoints || [];
    for (var i = 0; i < spawnPoints.length; i++) {
      if (spawnPoints[i].id === (spawnPointId || 'default')) return spawnPoints[i];
    }
    return spawnPoints[0] || null;
  }

  function getRegisteredScenes() {
    var result = [];
    for (var id in scenes) result.push(scenes[id]);
    return result;
  }

  return {
    registerScene: registerScene,
    loadScene: loadScene,
    unloadScene: unloadScene,
    reloadScene: reloadScene,
    getActiveScene: getActiveScene,
    getSpawnPoint: getSpawnPoint,
    getRegisteredScenes: getRegisteredScenes
  };
}
