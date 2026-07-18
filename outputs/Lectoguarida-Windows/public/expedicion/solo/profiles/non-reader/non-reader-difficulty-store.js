/**
 * non-reader-difficulty-store.js
 * Persistencia de dificultad por estudiante y por perfil.
 * Usa el namespace ya validado: lectoguarida:solo-settings:v1:<studentProfileId>
 * No sobrescribe audio ni accesibilidad; conserva configuración previa.
 */

var NonReaderDifficultyStore = (function () {
  'use strict';

  var SETTINGS_KEY_PREFIX = 'lectoguarida:solo-settings:v1';
  var DEFAULT_DIFFICULTY = 'standard';

  function getSettingsKey(studentProfileId) {
    return SETTINGS_KEY_PREFIX + ':' + (studentProfileId || '');
  }

  function loadSettings(studentProfileId) {
    try {
      var raw = localStorage.getItem(getSettingsKey(studentProfileId));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveSettings(studentProfileId, settings) {
    try {
      localStorage.setItem(getSettingsKey(studentProfileId), JSON.stringify(settings));
    } catch (e) { /* ignore */ }
  }

  function ensureSettings(studentProfileId) {
    var settings = loadSettings(studentProfileId);
    if (!settings || typeof settings !== 'object') {
      settings = { version: 1, profiles: {} };
    }
    if (settings.version !== 1) settings.version = 1;
    if (!settings.profiles || typeof settings.profiles !== 'object') settings.profiles = {};
    if (!settings.profiles.non_reader || typeof settings.profiles.non_reader !== 'object') {
      settings.profiles.non_reader = {};
    }
    if (!settings.profiles.non_reader.difficulty) {
      settings.profiles.non_reader.difficulty = DEFAULT_DIFFICULTY;
    }
    return settings;
  }

  function isValid(value) {
    return value === 'support' || value === 'standard' || value === 'challenge';
  }

  function getDifficulty(studentProfileId, readerProfile) {
    if (!studentProfileId) return DEFAULT_DIFFICULTY;
    var profileKey = readerProfile || 'non_reader';
    var settings = loadSettings(studentProfileId);
    if (settings && settings.profiles && settings.profiles[profileKey] && isValid(settings.profiles[profileKey].difficulty)) {
      return settings.profiles[profileKey].difficulty;
    }
    return DEFAULT_DIFFICULTY;
  }

  function setDifficulty(studentProfileId, readerProfile, difficulty) {
    if (!studentProfileId) return false;
    if (!isValid(difficulty)) return false;
    var profileKey = readerProfile || 'non_reader';
    var settings = ensureSettings(studentProfileId);
    if (!settings.profiles[profileKey] || typeof settings.profiles[profileKey] !== 'object') {
      settings.profiles[profileKey] = {};
    }
    settings.profiles[profileKey].difficulty = difficulty;
    saveSettings(studentProfileId, settings);
    return true;
  }

  function resetDifficulty(studentProfileId, readerProfile) {
    if (!studentProfileId) return false;
    var profileKey = readerProfile || 'non_reader';
    var settings = ensureSettings(studentProfileId);
    if (!settings.profiles[profileKey] || typeof settings.profiles[profileKey] !== 'object') {
      settings.profiles[profileKey] = {};
    }
    settings.profiles[profileKey].difficulty = DEFAULT_DIFFICULTY;
    saveSettings(studentProfileId, settings);
    return true;
  }

  return {
    getDifficulty: getDifficulty,
    setDifficulty: setDifficulty,
    resetDifficulty: resetDifficulty,
    DEFAULT_DIFFICULTY: DEFAULT_DIFFICULTY
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NonReaderDifficultyStore };
}
if (typeof window !== 'undefined') {
  window.NonReaderDifficultyStore = NonReaderDifficultyStore;
}
