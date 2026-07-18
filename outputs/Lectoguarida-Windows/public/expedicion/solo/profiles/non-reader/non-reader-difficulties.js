/**
 * non-reader-difficulties.js
 * Configuración compartida de dificultades para el perfil No Lectores.
 * Tres modos: Apoyo, Estándar, Desafío.
 * Estándar es el predeterminado. No usa temporizador obligatorio.
 */

var NonReaderDifficulty = (function () {
  'use strict';

  var DEFAULT_DIFFICULTY = 'standard';

  var NON_READER_DIFFICULTIES = {
    support: {
      id: 'support',
      label: 'Apoyo',
      optionCount: 3,
      unlimitedAudio: true,
      largeTargets: true,
      visualDemo: true,
      modelWord: true,
      hintsAvailable: true,
      closeDistractors: false,
      timer: false,
      speechRate: 0.78,
      fallSpeed: 1.0,
      description: 'Más ayuda, objetos grandes y demostraciones.'
    },
    standard: {
      id: 'standard',
      label: 'Estándar',
      optionCount: 4,
      unlimitedAudio: true,
      largeTargets: false,
      visualDemo: false,
      modelWord: false,
      hintsAvailable: true,
      closeDistractors: false,
      timer: false,
      speechRate: 0.88,
      fallSpeed: 1.2,
      description: 'Una cantidad equilibrada de opciones y pistas.'
    },
    challenge: {
      id: 'challenge',
      label: 'Desafío',
      optionCount: 5,
      unlimitedAudio: true,
      largeTargets: false,
      visualDemo: false,
      modelWord: false,
      hintsAvailable: false,
      closeDistractors: true,
      timer: false,
      speechRate: 0.95,
      fallSpeed: 1.8,
      description: 'Más opciones y sonidos parecidos para practicar.'
    }
  };

  function isValidNonReaderDifficulty(value) {
    return !!value && typeof NON_READER_DIFFICULTIES[value] === 'object';
  }

  function getNonReaderDifficultyConfig(value) {
    if (isValidNonReaderDifficulty(value)) return NON_READER_DIFFICULTIES[value];
    return NON_READER_DIFFICULTIES[DEFAULT_DIFFICULTY];
  }

  function getNonReaderDifficultyList() {
    return ['support', 'standard', 'challenge'].map(function (k) {
      return NON_READER_DIFFICULTIES[k];
    });
  }

  function getNonReaderDifficultyDescription(value) {
    return getNonReaderDifficultyConfig(value).description;
  }

  return {
    NON_READER_DIFFICULTIES: NON_READER_DIFFICULTIES,
    DEFAULT_NON_READER_DIFFICULTY: DEFAULT_DIFFICULTY,
    isValidNonReaderDifficulty: isValidNonReaderDifficulty,
    getNonReaderDifficultyConfig: getNonReaderDifficultyConfig,
    getNonReaderDifficultyList: getNonReaderDifficultyList,
    getNonReaderDifficultyDescription: getNonReaderDifficultyDescription
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NonReaderDifficulty };
}
if (typeof window !== 'undefined') {
  window.NonReaderDifficulty = NonReaderDifficulty;
}
