/**
 * drag-drop-demo.js
 * Demo sintética: "Lleva la figura circular a su contenedor".
 * No usa sílabas ni palabras finales.
 */

var DragDropDemo = (function () {
  'use strict';

  var DEMO_CONFIG = {
    id: 'demo-drag-drop',
    title: 'Demo: Lleva la figura a su contenedor',
    profile: 'beginner',
    template: 'drag_drop',
    instructions: {
      text: 'Arrastra cada figura al contenedor del mismo color'
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
        id: 'circle',
        label: '🔴 Círculo',
        targetLabel: 'Contenedor rojo'
      },
      {
        id: 'square',
        label: '🟦 Cuadrado',
        targetLabel: 'Contenedor azul'
      },
      {
        id: 'triangle',
        label: '🟨 Triángulo',
        targetLabel: 'Contenedor amarillo'
      }
    ],
    scoring: { basePoints: 100, accuracyBonus: 50 },
    completion: { type: 'rounds' },
    rewards: { lostPages: 1 }
  };

  function create(container, engine) {
    return DragDropTemplate.create({
      container: container,
      config: DEMO_CONFIG,
      engine: engine
    });
  }

  return { create: create, DEMO_CONFIG: DEMO_CONFIG };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DragDropDemo };
}
if (typeof window !== 'undefined') {
  window.DragDropDemo = DragDropDemo;
}
