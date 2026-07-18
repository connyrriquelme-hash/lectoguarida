/**
 * profile-config.js — Beginner profile
 * Sílabas, palabras y primeras lecturas.
 */

var BeginnerProfileConfig = (function () {
  'use strict';

  var config = {
    id: 'beginner',
    name: 'Principiantes',
    icon: '📖',
    description: 'Sílabas, palabras y primeras lecturas.',
    accessibility: {
      noTimer: false,
      extendedTime: true,
      reducedMotion: false,
      largeTargets: false,
      voiceGuidance: false
    },
    inputModes: ['touch', 'mouse', 'keyboard'],
    templates: ['click_selection', 'drag_drop'],
    maxRounds: 8,
    hintsAvailable: true
  };

  return config;
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BeginnerProfileConfig };
}
if (typeof window !== 'undefined') {
  window.BeginnerProfileConfig = BeginnerProfileConfig;
}
