/**
 * vocal-a-game.js
 * Primer minijuego real: "Selecciona la vocal A".
 * Usa ClickSelectionTemplate.
 * Contenido JSON separado del template.
 */

(function () {
  'use strict';

  var GAME_CONTENT = [
    {
      question: '¿Cuál es la vocal A?',
      options: [
        { label: 'A', id: 'a' },
        { label: 'B', id: 'b' },
        { label: 'C', id: 'c' }
      ],
      answers: [0],
      audio: 'vocal-a.mp3',
      hint: 'Es la primera vocal del abecedario'
    },
    {
      question: '¿Cuál es la vocal E?',
      options: [
        { label: 'D', id: 'd' },
        { label: 'E', id: 'e' },
        { label: 'F', id: 'f' }
      ],
      answers: [1],
      audio: 'vocal-e.mp3',
      hint: 'Es la segunda vocal del abecedario'
    },
    {
      question: '¿Cuál es la vocal I?',
      options: [
        { label: 'G', id: 'g' },
        { label: 'H', id: 'h' },
        { label: 'I', id: 'i' }
      ],
      answers: [2],
      audio: 'vocal-i.mp3',
      hint: 'Es la tercera vocal del abecedario'
    },
    {
      question: '¿Cuál es la vocal O?',
      options: [
        { label: 'O', id: 'o' },
        { label: 'P', id: 'p' },
        { label: 'Q', id: 'q' }
      ],
      answers: [0],
      audio: 'vocal-o.mp3',
      hint: 'Es la cuarta vocal del abecedario'
    },
    {
      question: '¿Cuál es la vocal U?',
      options: [
        { label: 'R', id: 'r' },
        { label: 'S', id: 's' },
        { label: 'U', id: 'u' }
      ],
      answers: [2],
      audio: 'vocal-u.mp3',
      hint: 'Es la quinta vocal del abecedario'
    }
  ];

  function createTemplate(container, content, engine) {
    return ClickSelectionTemplate.create({
      container: container,
      config: { content: content },
      engine: engine
    });
  }

  SoloGameAdapter.registerGame({
    id: 'vocal-a',
    title: 'Selecciona la vocal',
    template: 'click_selection',
    profile: 'non_reader',
    instructions: {
      text: 'Toca la vocal que aparece en pantalla',
      audio: 'instrucciones-vocales.mp3'
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
