/**
 * initial-sound-detector.js
 * Juego 2/4: Detecta Sonido Inicial.
 * Identifica el sonido con que empieza una palabra.
 * Template: click_selection (3 opciones por ronda).
 */

(function () {
  'use strict';

  var GAME_CONTENT = [
    {
      question: '¿Con qué sonido empieza "MANZANA"?',
      word: 'Manzana',
      phoneme: 'm',
      phonemeExamples: ['manzana', 'mono', 'mar'],
      options: [
        { label: 'M', id: 'm' },
        { label: 'P', id: 'p' },
        { label: 'S', id: 's' }
      ],
      answers: [0],
      audio: 'inicial-manzana.mp3',
      hint: 'Mmmm... manzana'
    },
    {
      question: '¿Con qué sonido empieza "SOL"?',
      word: 'Sol',
      phoneme: 's',
      phonemeExamples: ['sol', 'sapo', 'silla'],
      options: [
        { label: 'L', id: 'l' },
        { label: 'S', id: 's' },
        { label: 'T', id: 't' }
      ],
      answers: [1],
      audio: 'inicial-sol.mp3',
      hint: 'Ssss... sol'
    },
    {
      question: '¿Con qué sonido empieza "FAMILIA"?',
      word: 'Familia',
      phoneme: 'f',
      phonemeExamples: ['familia', 'foca', 'fresa'],
      options: [
        { label: 'V', id: 'v' },
        { label: 'P', id: 'p' },
        { label: 'F', id: 'f' }
      ],
      answers: [2],
      audio: 'inicial-familia.mp3',
      hint: 'Fff... familia'
    },
    {
      question: '¿Con qué sonido empieza "CASA"?',
      word: 'Casa',
      phoneme: 'k',
      phonemeExamples: ['casa', 'conejo', 'cola'],
      options: [
        { label: 'K', id: 'k' },
        { label: 'G', id: 'g' },
        { label: 'Q', id: 'q' }
      ],
      answers: [0],
      audio: 'inicial-casa.mp3',
      hint: 'Kk... casa'
    },
    {
      question: '¿Con qué sonido empieza "OJO"?',
      word: 'Ojo',
      phoneme: 'o',
      phonemeExamples: ['ojo', 'oso', 'olla'],
      options: [
        { label: 'U', id: 'u' },
        { label: 'O', id: 'o' },
        { label: 'A', id: 'a' }
      ],
      answers: [1],
      audio: 'inicial-ojo.mp3',
      hint: 'Ooo... ojo'
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
    id: 'initial-sound-detector',
    title: 'Detecta Sonido Inicial',
    template: 'click_selection',
    profile: 'non_reader',
    instructions: {
      text: 'Escucha la palabra y toca el sonido con que empieza',
      audio: 'instrucciones-inicial.mp3'
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
