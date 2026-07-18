/**
 * profile-config.js — Non-reader profile
 * Sonidos, letras, imágenes y aventuras guiadas.
 */

var NonReaderProfileConfig = (function () {
  'use strict';

  var config = {
    id: 'non_reader',
    name: 'No Lectores',
    icon: '🌱',
    description: 'Sonidos, letras, imágenes y aventuras guiadas.',
    accessibility: {
      noTimer: true,
      extendedTime: true,
      reducedMotion: false,
      largeTargets: true,
      voiceGuidance: true
    },
    inputModes: ['touch', 'mouse', 'keyboard'],
    templates: ['click_selection'],
    maxRounds: 5,
    hintsAvailable: true
  };

  return config;
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NonReaderProfileConfig };
}
if (typeof window !== 'undefined') {
  window.NonReaderProfileConfig = NonReaderProfileConfig;
}
