/**
 * final-sound-catcher.js
 * Juego 4/4: Atrapa el Sonido Final.
 * Atrapa los items que terminan con el mismo sonido que una palabra.
 * Template: falling_items.
 */

(function () {
  'use strict';

  var GAME_CONTENT = [
    {
      question: 'Atrapa los que terminan en -O',
      targetSound: '-o',
      options: [
        { label: 'Gato', id: 'gato', isCorrect: true, assetId: 'gato', fallbackEmoji: '🐱' },
        { label: 'Mesa', id: 'mesa', isCorrect: false, assetId: 'mesa', fallbackEmoji: '🪑' },
        { label: 'Sol', id: 'sol', isCorrect: false, assetId: 'sol', fallbackEmoji: '☀️' },
        { label: 'Perro', id: 'perro', isCorrect: true, assetId: 'raton', fallbackEmoji: '🐶' }
      ],
      answers: [0, 3],
      audio: 'final-o.mp3',
      hint: 'Gato termina en -o, Perro también'
    },
    {
      question: 'Atrapa los que terminan en -A',
      targetSound: '-a',
      options: [
        { label: 'Casa', id: 'casa', isCorrect: true, assetId: 'casa', fallbackEmoji: '🏠' },
        { label: 'Pato', id: 'pato', isCorrect: false, assetId: 'raton', fallbackEmoji: '🦆' },
        { label: 'Luna', id: 'luna', isCorrect: true, assetId: 'luna', fallbackEmoji: '🌙' },
        { label: 'Sol', id: 'sol', isCorrect: false, assetId: 'sol', fallbackEmoji: '☀️' }
      ],
      answers: [0, 2],
      audio: 'final-a.mp3',
      hint: 'Casa y Luna terminan en -a'
    },
    {
      question: 'Atrapa los que terminan en -L',
      targetSound: '-l',
      options: [
        { label: 'Animal', id: 'animal', isCorrect: true, assetId: 'elefante', fallbackEmoji: '🐘' },
        { label: 'Casa', id: 'casa', isCorrect: false, assetId: 'casa', fallbackEmoji: '🏠' },
        { label: 'Flor', id: 'flor', isCorrect: false, assetId: 'flor', fallbackEmoji: '🌸' },
        { label: 'Papel', id: 'papel', isCorrect: true, assetId: 'papel', fallbackEmoji: '📄' }
      ],
      answers: [0, 3],
      audio: 'final-l.mp3',
      hint: 'Animal y Papel terminan en -l'
    },
    {
      question: 'Atrapa los que terminan en -N',
      targetSound: '-n',
      options: [
        { label: 'Pan', id: 'pan', isCorrect: true, assetId: 'vaso', fallbackEmoji: '🍞' },
        { label: 'Luna', id: 'luna', isCorrect: false, assetId: 'luna', fallbackEmoji: '🌙' },
        { label: 'Corazón', id: 'corazon', isCorrect: true, assetId: 'libro', fallbackEmoji: '💙' },
        { label: 'Pato', id: 'pato', isCorrect: false, assetId: 'raton', fallbackEmoji: '🦆' }
      ],
      answers: [0, 2],
      audio: 'final-n.mp3',
      hint: 'Pan y Corazón terminan en -n'
    },
    {
      question: 'Atrapa los que terminan en -S',
      targetSound: '-s',
      options: [
        { label: 'Mesas', id: 'mesas', isCorrect: true, assetId: 'papel', fallbackEmoji: '📄' },
        { label: 'Gato', id: 'gato', isCorrect: false, assetId: 'gato', fallbackEmoji: '🐱' },
        { label: 'Lunes', id: 'lunes', isCorrect: true, assetId: 'luna', fallbackEmoji: '🌙' },
        { label: 'Pato', id: 'pato', isCorrect: false, assetId: 'raton', fallbackEmoji: '🦆' }
      ],
      answers: [0, 2],
      audio: 'final-s.mp3',
      hint: 'Mesas y Lunes terminan en -s'
    }
  ];

  function createTemplate(container, content, engine) {
    return FallingItemsTemplate.create({
      container: container,
      config: { content: content, accessibility: { largeTargets: true, voiceGuidance: true } },
      engine: engine
    });
  }

  SoloGameAdapter.registerGame({
    id: 'final-sound-catcher',
    title: 'Atrapa el Sonido Final',
    template: 'falling_items',
    profile: 'non_reader',
    instructions: {
      text: 'Atrapa los items que terminan con el sonido indicado',
      audio: 'instrucciones-final.mp3'
    },
    accessibility: {
      noTimer: true,
      extendedTime: true,
      reducedMotion: false,
      largeTargets: true,
      voiceGuidance: true
    },
    content: GAME_CONTENT,
    scoring: {
      basePoints: 100,
      accuracyBonus: 50,
      persistenceBonus: 20,
      hintsPenalty: 10
    },
    rewards: {
      lostPages: 1
    },
    completion: {
      type: 'rounds'
    },
    createTemplate: createTemplate
  });
})();
