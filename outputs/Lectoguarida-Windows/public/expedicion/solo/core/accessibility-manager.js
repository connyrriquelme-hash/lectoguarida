/**
 * accessibility-manager.js
 * Gestor de accesibilidad del modo individual.
 * Soporta: reducir movimiento, texto grande, alto contraste, tiempo extendido,
 * instrucciones repetibles, audio desactivado, navegación por teclado, foco visible.
 * Persiste ajustes en lectoguarida:solo-settings:v1:<studentProfileId>.
 * No mezcla ajustes con el colaborativo.
 */

var AccessibilityManager = (function () {
  'use strict';

  var SETTINGS_KEY_PREFIX = 'lectoguarida:solo-settings:v1';

  function getSettingsKey(studentProfileId) {
    return SETTINGS_KEY_PREFIX + ':' + studentProfileId;
  }

  function createDefaultSettings() {
    return {
      version: 1,
      reducedMotion: false,
      largeText: false,
      highContrast: false,
      extendedTime: false,
      audioDisabled: false,
      keyboardNavigation: true,
      focusVisible: true
    };
  }

  function load(studentProfileId) {
    try {
      var raw = localStorage.getItem(getSettingsKey(studentProfileId));
      if (!raw) return createDefaultSettings();
      var parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1) return parsed;
      return createDefaultSettings();
    } catch {
      return createDefaultSettings();
    }
  }

  function save(studentProfileId, settings) {
    try {
      localStorage.setItem(getSettingsKey(studentProfileId), JSON.stringify(settings));
    } catch { /* ignore */ }
  }

  function create(studentProfileId) {
    var settings = load(studentProfileId);

    function get(key) { return settings[key]; }

    function set(key, value) {
      settings[key] = value;
      save(studentProfileId, settings);
    }

    function getAll() { return Object.assign({}, settings); }

    function reset() {
      settings = createDefaultSettings();
      save(studentProfileId, settings);
    }

    function apply() {
      var body = document.body;
      if (!body) return;
      body.classList.toggle('solo-reduced-motion', settings.reducedMotion);
      body.classList.toggle('solo-large-text', settings.largeText);
      body.classList.toggle('solo-high-contrast', settings.highContrast);
      body.classList.toggle('solo-focus-visible', settings.focusVisible);
    }

    return { get: get, set: set, getAll: getAll, reset: reset, apply: apply };
  }

  return {
    create: create,
    load: load,
    save: save,
    createDefaultSettings: createDefaultSettings
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AccessibilityManager };
}
if (typeof window !== 'undefined') {
  window.AccessibilityManager = AccessibilityManager;
}
