/**
 * avatar-movement-demo.js
 * Demo sintética: "Mueve el explorador hasta la estrella".
 * No incorpora Laberinto Fonético ni Carrera Auditiva.
 * No usa física compleja.
 */

var AvatarMovementDemo = (function () {
  'use strict';

  var DEMO_CONFIG = {
    id: 'demo-avatar-movement',
    title: 'Demo: Mueve el explorador hasta la estrella',
    profile: 'advanced',
    template: 'avatar_movement',
    instructions: {
      text: 'Usa las flechas del teclado o los botones para mover al explorador'
    },
    accessibility: {
      noTimer: true,
      extendedTime: true,
      reducedMotion: false,
      largeTargets: false,
      voiceGuidance: false
    },
    content: {
      width: 400,
      height: 300,
      startX: 50,
      startY: 50,
      targetX: 350,
      targetY: 250,
      speed: 3,
      obstacles: [
        { x: 150, y: 100, w: 40, h: 80 },
        { x: 250, y: 150, w: 60, h: 40 }
      ]
    },
    scoring: { basePoints: 200, timeBonus: 50 },
    completion: { type: 'rounds' },
    rewards: { lostPages: 1 }
  };

  function create(container, engine) {
    return AvatarMovementTemplate.create({
      container: container,
      config: DEMO_CONFIG,
      engine: engine
    });
  }

  return { create: create, DEMO_CONFIG: DEMO_CONFIG };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AvatarMovementDemo };
}
if (typeof window !== 'undefined') {
  window.AvatarMovementDemo = AvatarMovementDemo;
}
