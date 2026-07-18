/**
 * profile-config.js — Advanced profile
 * Comprensión, desafíos y el Guardián del Códice.
 */

var AdvancedProfileConfig = (function () {
  'use strict';

  var config = {
    id: 'advanced',
    name: 'Avanzados',
    icon: '🛡️',
    description: 'Comprensión, desafíos y el Guardián del Códice.',
    accessibility: {
      noTimer: false,
      extendedTime: false,
      reducedMotion: false,
      largeTargets: false,
      voiceGuidance: false
    },
    inputModes: ['touch', 'mouse', 'keyboard'],
    templates: ['click_selection', 'drag_drop', 'avatar_movement'],
    maxRounds: 10,
    hintsAvailable: false
  };

  return config;
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdvancedProfileConfig };
}
if (typeof window !== 'undefined') {
  window.AdvancedProfileConfig = AdvancedProfileConfig;
}
