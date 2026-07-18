/**
 * rim-catcher.js
 * Juego 1/4: Atrapa Rimas.
 * Identifica palabras que riman con una palabra objetivo.
 * Template: click_selection (3 opciones por ronda).
 */

(function () {
  'use strict';

  var GAME_CONTENT = [
    {
      question: '¿Cuál palabra rima con GATO?',
      word: 'Gato',
      options: [
        { label: 'Pato', id: 'pato', assetId: 'pato', fallbackEmoji: '🦆' },
        { label: 'Casa', id: 'casa', assetId: 'ventana', fallbackEmoji: '🏠' },
        { label: 'Luna', id: 'luna', assetId: 'campana', fallbackEmoji: '🌙' },
        { label: 'Mesa', id: 'mesa', assetId: 'botella', fallbackEmoji: '🪑' },
        { label: 'Sol', id: 'sol', assetId: 'girasol', fallbackEmoji: '☀️' }
      ],
      answers: [0],
      audio: 'rima-gato.mp3',
      hint: 'Gato... Pato... suenan igual al final'
    },
    {
      question: '¿Cuál palabra rima con SOL?',
      word: 'Sol',
      options: [
        { label: 'Pan', id: 'pan', assetId: 'boton', fallbackEmoji: '🍞' },
        { label: 'Flor', id: 'flor', assetId: 'girasol', fallbackEmoji: '🌸' },
        { label: 'Color', id: 'color', assetId: 'estrella', fallbackEmoji: '🎨' },
        { label: 'Río', id: 'rio', assetId: 'zapato', fallbackEmoji: '🌊' },
        { label: 'Casa', id: 'casa', assetId: 'ventana', fallbackEmoji: '🏠' }
      ],
      answers: [2],
      audio: 'rima-sol.mp3',
      hint: 'Sol termina en -ol, como Color'
    },
    {
      question: '¿Cuál palabra rima con LUNA?',
      word: 'Luna',
      options: [
        { label: 'Cuna', id: 'cuna', assetId: 'caracol', fallbackEmoji: '🍼' },
        { label: 'Gato', id: 'gato', assetId: 'gato', fallbackEmoji: '🐱' },
        { label: 'Perro', id: 'perro', assetId: 'raton', fallbackEmoji: '🐶' },
        { label: 'Mesa', id: 'mesa', assetId: 'botella', fallbackEmoji: '🪑' },
        { label: 'Sol', id: 'sol', assetId: 'girasol', fallbackEmoji: '☀️' }
      ],
      answers: [0],
      audio: 'rima-luna.mp3',
      hint: 'Luna termina en -una, como Cuna'
    },
    {
      question: '¿Cuál palabra rima con MESA?',
      word: 'Mesa',
      options: [
        { label: 'Pasa', id: 'pasa', assetId: 'botella', fallbackEmoji: '🍞' },
        { label: 'Cielo', id: 'cielo', assetId: 'estrella', fallbackEmoji: '🌌' },
        { label: 'Río', id: 'rio', assetId: 'zapato', fallbackEmoji: '🌊' },
        { label: 'Perro', id: 'perro', assetId: 'raton', fallbackEmoji: '🐶' },
        { label: 'Flor', id: 'flor', assetId: 'girasol', fallbackEmoji: '🌸' }
      ],
      answers: [0],
      audio: 'rima-mesa.mp3',
      hint: 'Mesa termina en -esa, como Pasa'
    },
    {
      question: '¿Cuál palabra rima con PERRO?',
      word: 'Perro',
      options: [
        { label: 'Cerro', id: 'cerro', assetId: 'girasol', fallbackEmoji: '⛰️' },
        { label: 'Gato', id: 'gato', assetId: 'gato', fallbackEmoji: '🐱' },
        { label: 'Pato', id: 'pato', assetId: 'pato', fallbackEmoji: '🦆' },
        { label: 'Mesa', id: 'mesa', assetId: 'botella', fallbackEmoji: '🪑' },
        { label: 'Color', id: 'color', assetId: 'estrella', fallbackEmoji: '🎨' }
      ],
      answers: [0],
      audio: 'rima-perro.mp3',
      hint: 'Perro termina en -erro, como Cerro'
    }
  ];

  function createTemplate(container, content, engine) {
    return ClickSelectionTemplate.create({
      container: container,
      config: { content: content, accessibility: { largeTargets: true, voiceGuidance: true } },
      engine: engine
    });
  }

  SoloGameAdapter.registerGame({
    id: 'rim-catcher',
    title: 'Atrapa Rimas',
    template: 'click_selection',
    profile: 'non_reader',
    instructions: {
      text: 'Escucha la palabra y toca la que rima',
      audio: 'instrucciones-rimas.mp3'
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
