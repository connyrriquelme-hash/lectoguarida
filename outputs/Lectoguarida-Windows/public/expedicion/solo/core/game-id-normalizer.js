/**
 * game-id-normalizer.js
 *
 * Normaliza el ID del juego de rimas entre el alias heredado
 * (rim-catcher) y el ID canónico (rhyme-catcher).
 *
 * Regla única: todo el almacenamiento, recompensas, progreso y
 * resolución de assets se hace con el ID canónico. El alias solo
 * existe para compatibilidad de URL y mapas antiguos.
 */

var GameIdNormalizer = (function () {
  'use strict';

  var CANONICAL_RHYME_ID = 'rhyme-catcher';

  var GAME_ID_ALIASES = Object.freeze({
    'rim-catcher': 'rhyme-catcher'
  });

  var GAME_ID_LEGACY = Object.freeze({
    'rhyme-catcher': ['rim-catcher']
  });

  function normalizeGameId(gameId) {
    var value = String(gameId == null ? '' : gameId).trim().toLowerCase();
    return GAME_ID_ALIASES[value] || value;
  }

  function isLegacyGameId(gameId) {
    var value = String(gameId == null ? '' : gameId).trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(GAME_ID_ALIASES, value);
  }

  function getCanonicalId(gameId) {
    return normalizeGameId(gameId);
  }

  function getGameIdAliases(canonicalId) {
    var value = String(canonicalId == null ? '' : canonicalId).trim().toLowerCase();
    return GAME_ID_LEGACY[value] ? GAME_ID_LEGACY[value].slice() : [];
  }

  function isRhymeCatcher(gameId) {
    return normalizeGameId(gameId) === CANONICAL_RHYME_ID;
  }

  return {
    CANONICAL_RHYME_ID: CANONICAL_RHYME_ID,
    GAME_ID_ALIASES: GAME_ID_ALIASES,
    GAME_ID_LEGACY: GAME_ID_LEGACY,
    normalizeGameId: normalizeGameId,
    getCanonicalId: getCanonicalId,
    isLegacyGameId: isLegacyGameId,
    getGameIdAliases: getGameIdAliases,
    isRhymeCatcher: isRhymeCatcher
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameIdNormalizer: GameIdNormalizer };
}
if (typeof window !== 'undefined') {
  window.GameIdNormalizer = GameIdNormalizer;
}
