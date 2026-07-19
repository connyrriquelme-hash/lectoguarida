/**
 * scene-loader.js
 * Loads scene JSON data from game-data/scenes/
 */

export function loadSceneData(sceneId) {
  var baseUrl = '/expedicion/solo/game-data/scenes/';
  var url = baseUrl + sceneId + '.scene.json';

  return fetch(url)
    .then(function (response) {
      if (!response.ok) throw new Error('Scene not found: ' + sceneId);
      return response.json();
    })
    .then(function (data) {
      return data;
    })
    .catch(function (err) {
      console.error('[SceneLoader] Failed to load', sceneId, err);
      return null;
    });
}