/**
 * feature-flag.js
 * Feature flag for Game Engine V2.
 */

export var FEATURE_FLAGS = {
  ENABLE_GAME_ENGINE_V2: false
};

export function isGameEngineV2Enabled(searchParams) {
  var params = searchParams;
  if (!params && typeof window !== 'undefined' && window.location) {
    params = new URLSearchParams(window.location.search);
  }
  if (params) {
    if (params.get('debugEngine') === '1') return true;
    if (params.get('engineV2') === '1') return true;
  }
  return FEATURE_FLAGS.ENABLE_GAME_ENGINE_V2;
}

export function setEngineV2Enabled(enabled) {
  FEATURE_FLAGS.ENABLE_GAME_ENGINE_V2 = enabled;
}
