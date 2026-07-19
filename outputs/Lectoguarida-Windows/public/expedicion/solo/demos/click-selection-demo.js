/**
 * click-selection-demo.js
 * Demo sintética: "Selecciona la vocal A".
 * Figuras simples y texto propio.
 * No es Caza de Burbujas ni otro juego final.
 */

var ClickSelectionDemo = (function () {
  'use strict';

  var DEMO_CONFIG = {
    id: 'demo-click-selection',
    title: 'Demo: Selecciona la vocal A',
    profile: 'non_reader',
    template: 'click_selection',
    instructions: {
      text: 'Toca la vocal que aparece en pantalla'
    },
    accessibility: {
      noTimer: true,
      extendedTime: true,
      reducedMotion: false,
      largeTargets: true,
      voiceGuidance: false
    },
    content: [
      {
        question: '¿Cuál es la vocal A?',
        options: [
          { label: 'A', id: 'a' },
          { label: 'B', id: 'b' },
          { label: 'C', id: 'c' }
        ],
        answers: [0]
      },
      {
        question: '¿Cuál es la vocal E?',
        options: [
          { label: 'D', id: 'd' },
          { label: 'E', id: 'e' },
          { label: 'F', id: 'f' }
        ],
        answers: [1]
      },
      {
        question: '¿Cuál es la vocal O?',
        options: [
          { label: 'G', id: 'g' },
          { label: 'H', id: 'h' },
          { label: 'O', id: 'o' }
        ],
        answers: [2]
      }
    ],
    scoring: { basePoints: 100, accuracyBonus: 50 },
    completion: { type: 'rounds' },
    rewards: { lostPages: 1 }
  };

  function create(container, engine) {
    return ClickSelectionTemplate.create({
      container: container,
      config: DEMO_CONFIG,
      engine: engine
    });
  }

  return { create: create, DEMO_CONFIG: DEMO_CONFIG };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ClickSelectionDemo };
}
if (typeof window !== 'undefined') {
  window.ClickSelectionDemo = ClickSelectionDemo;
}
