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
      options: [
        { label: 'Pato', id: 'pato' },
        { label: 'Casa', id: 'casa' },
        { label: 'Luna', id: 'luna' }
      ],
      answers: [0],
      audio: 'rima-gato.mp3',
      hint: 'Gato... Pato... suenan igual al final'
    },
    {
      question: '¿Cuál palabra rima con SOL?',
      options: [
        { label: 'Pan', id: 'pan' },
        { label: 'Flor', id: 'flor' },
        { label: 'Color', id: 'color' }
      ],
      answers: [2],
      audio: 'rima-sol.mp3',
      hint: 'Sol termina en -ol, como Color'
    },
    {
      question: '¿Cuál palabra rima con LUNA?',
      options: [
        { label: 'Cuna', id: 'cuna' },
        { label: 'Gato', id: 'gato' },
        { label: 'Perro', id: 'perro' }
      ],
      answers: [0],
      audio: 'rima-luna.mp3',
      hint: 'Luna termina en -una, como Cuna'
    },
    {
      question: '¿Cuál palabra rima con MESA?',
      options: [
        { label: 'Pasa', id: 'pasa' },
        { label: 'Cielo', id: 'cielo' },
        { label: 'Río', id: 'rio' }
      ],
      answers: [0],
      audio: 'rima-mesa.mp3',
      hint: 'Mesa termina en -esa, como Pasa'
    },
    {
      question: '¿Cuál palabra rima con PERRO?',
      options: [
        { label: 'Cerro', id: 'cerro' },
        { label: 'Gato', id: 'gato' },
        { label: 'Pato', id: 'pato' }
      ],
      answers: [0],
      audio: 'rima-perro.mp3',
      hint: 'Perro termina en -erro, como Cerro'
    }
  ];

  function createTemplate(container, content, engine) {
    return ClickSelectionTemplate.create({
      container: container,
      config: { content: content, accessibility: { largeTargets: true } },
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
      voiceGuidance: false
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
