/**
 * feature-flag.js
 * Feature flag for Game Engine V2.
 */

export var FEATURE_FLAGS = {
  ENABLE_GAME_ENGINE_V2: false
};

export function normalizeSearchParams(input) {
  if (input instanceof URLSearchParams) return input;
  if (input && typeof input === 'object' && input.searchParams instanceof URLSearchParams) return input.searchParams;
  if (typeof input === 'string') return new URLSearchParams(input);
  if (input && typeof input === 'object' && typeof input.search === 'string') return new URLSearchParams(input.search);
  return new URLSearchParams();
}

export function isGameEngineV2Enabled(searchParams) {
  var params = normalizeSearchParams(searchParams);
  if (params.get('debugEngine') === '1') return true;
  if (params.get('engineV2') === '1') return true;
  return FEATURE_FLAGS.ENABLE_GAME_ENGINE_V2;
}

export function setEngineV2Enabled(enabled) {
  FEATURE_FLAGS.ENABLE_GAME_ENGINE_V2 = enabled;
}
