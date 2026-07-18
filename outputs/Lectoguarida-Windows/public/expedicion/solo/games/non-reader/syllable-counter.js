/**
 * syllable-counter.js
 * Juego 3/4: Cuenta Sílabas.
 * Toca cada sílaba de la palabra en el orden correcto.
 * Template: syllable_tap.
 */

(function () {
  'use strict';

  var GAME_CONTENT = [
    {
      question: 'Toca las sílabas de "MAN-ZA-NA"',
      word: 'Manzana',
      syllables: ['man', 'za', 'na'],
      audio: 'siliba-manzana.mp3',
      hint: 'Man-za-na: 3 sílabas'
    },
    {
      question: 'Toca las sílabas de "SO-LAR"',
      word: 'Solar',
      syllables: ['so', 'lar'],
      audio: 'siliba-solar.mp3',
      hint: 'So-lar: 2 sílabas'
    },
    {
      question: 'Toca las sílabas de "MA-RI-PO-SA"',
      word: 'Mariposa',
      syllables: ['ma', 'ri', 'po', 'sa'],
      audio: 'siliba-mariposa.mp3',
      hint: 'Ma-ri-po-sa: 4 sílabas'
    },
    {
      question: 'Toca las sílabas de "PA-TO"',
      word: 'Pato',
      syllables: ['pa', 'to'],
      audio: 'siliba-pato.mp3',
      hint: 'Pa-to: 2 sílabas'
    },
    {
      question: 'Toca las sílabas de "CA-RA-COL"',
      word: 'Caracol',
      syllables: ['ca', 'ra', 'col'],
      audio: 'siliba-caracol.mp3',
      hint: 'Ca-ra-col: 3 sílabas'
    }
  ];

  function createTemplate(container, content, engine) {
    return SyllableTapTemplate.create({
      container: container,
      config: { content: content, accessibility: { largeTargets: true } },
      engine: engine
    });
  }

  SoloGameAdapter.registerGame({
    id: 'syllable-counter',
    title: 'Cuenta Sílabas',
    template: 'syllable_tap',
    profile: 'non_reader',
    instructions: {
      text: 'Escucha la palabra y toca cada sílaba en orden',
      audio: 'instrucciones-silabas.mp3'
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
