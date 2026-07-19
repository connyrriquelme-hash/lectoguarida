/**
 * accessible-reading-settings.js
 * Preferencias de accesibilidad por estudiante:
 * subtítulos, descripción de sonidos, tamaño de texto,
 * contraste, modo Lectura Visual, vibración.
 */

var STORAGE_KEY = 'lectoguarida_a11y_settings';
var SCHEMA_VERSION = 2;

var DEFAULTS = {
  joystickVisible: true,
  joystickSensitivity: 'normal',
  captionsMode: 'always',
  soundDescriptions: true,
  textSize: 'normal',
  contrastMode: 'standard',
  narrativeAdvanceMode: 'manual',
  visualReadingMode: false,
  vibrationEnabled: false,
  audioEnabled: true,
  _schemaVersion: SCHEMA_VERSION
};

var TEXT_SIZES = { normal: '0.95rem', large: '1.15rem', xlarge: '1.35rem' };
var CONTRAST_STYLES = {
  standard: {},
  high: { filter: 'contrast(1.3) saturate(0.9)' }
};

export function createAccessibleReadingSettings(studentId) {
  var settings = Object.assign({}, DEFAULTS);
  var listeners = [];

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY + '_' + (studentId || 'default'));
      if (raw) {
        var parsed = JSON.parse(raw);
        var storedVersion = parsed._schemaVersion || 1;
        Object.keys(DEFAULTS).forEach(function (k) {
          if (k === '_schemaVersion') return;
          if (parsed[k] !== undefined) settings[k] = parsed[k];
        });
        if (storedVersion < SCHEMA_VERSION) {
          if (settings.visualReadingMode) {
            settings.audioEnabled = false;
          } else if (parsed.audioEnabled === undefined) {
            settings.audioEnabled = true;
          }
          settings._schemaVersion = SCHEMA_VERSION;
          save();
        }
      }
    } catch (e) { /* noop */ }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY + '_' + (studentId || 'default'), JSON.stringify(settings));
    } catch (e) { /* noop */ }
  }

  function get(key) { return settings[key]; }

  function set(key, value) {
    if (settings[key] === value) return;
    settings[key] = value;
    save();
    notifyListeners(key, value);
  }

  function getAll() { return Object.assign({}, settings); }

  function setTextSize(size) { set('textSize', size); }
  function setContrastMode(mode) { set('contrastMode', mode); }
  function setCaptionsMode(mode) { set('captionsMode', mode); }
  function setSoundDescriptions(v) { set('soundDescriptions', v); }
  function setVisualReadingMode(v) {
    set('visualReadingMode', v);
    if (v) applyVisualReadingMode();
  }
  function setAudioEnabled(v) { set('audioEnabled', v); }
  function setVibrationEnabled(v) { set('vibrationEnabled', v); }
  function setJoystickSensitivity(level) { set('joystickSensitivity', level); }
  function setNarrativeAdvanceMode(mode) { set('narrativeAdvanceMode', mode); }
  function setJoystickVisible(v) { set('joystickVisible', v); }

  function getTextSizePx() { return TEXT_SIZES[settings.textSize] || TEXT_SIZES.normal; }
  function getContrastStyle() { return CONTRAST_STYLES[settings.contrastMode] || {}; }

  function applyVisualReadingMode() {
    if (settings.visualReadingMode) {
      set('captionsMode', 'always');
      set('soundDescriptions', true);
      set('textSize', 'large');
      set('contrastMode', 'high');
      set('audioEnabled', false);
      set('narrativeAdvanceMode', 'manual');
    }
  }

  function vibrate(pattern) {
    if (!settings.vibrationEnabled) return;
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch (e) { /* noop */ }
  }

  function onChange(fn) { listeners.push(fn); }
  function notifyListeners(key, value) {
    listeners.forEach(function (fn) { fn(key, value); });
  }

  function destroy() { listeners = []; }

  load();

  return {
    get: get,
    set: set,
    getAll: getAll,
    getTextSizePx: getTextSizePx,
    getContrastStyle: getContrastStyle,
    setTextSize: setTextSize,
    setContrastMode: setContrastMode,
    setCaptionsMode: setCaptionsMode,
    setSoundDescriptions: setSoundDescriptions,
    setVisualReadingMode: setVisualReadingMode,
    setAudioEnabled: setAudioEnabled,
    setVibrationEnabled: setVibrationEnabled,
    setJoystickSensitivity: setJoystickSensitivity,
    setNarrativeAdvanceMode: setNarrativeAdvanceMode,
    setJoystickVisible: setJoystickVisible,
    applyVisualReadingMode: applyVisualReadingMode,
    vibrate: vibrate,
    onChange: onChange,
    destroy: destroy
  };
}

export { DEFAULTS, TEXT_SIZES, CONTRAST_STYLES };
