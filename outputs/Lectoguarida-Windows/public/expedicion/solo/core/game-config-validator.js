/**
 * game-config-validator.js
 * Valida la configuración de cada minijuego individual.
 * Una configuración inválida muestra error recuperable y permite volver al mapa.
 */

var GameConfigValidator = (function () {
  'use strict';

  var REQUIRED_FIELDS = ['id', 'title', 'profile', 'template'];
  var VALID_PROFILES = ['non_reader', 'beginner', 'advanced'];
  var VALID_TEMPLATES = ['click_selection', 'drag_drop', 'avatar_movement', 'syllable_tap', 'falling_items'];

  function validate(config) {
    var errors = [];

    if (!config || typeof config !== 'object') {
      return { valid: false, errors: ['Config must be a non-null object'] };
    }

    REQUIRED_FIELDS.forEach(function (field) {
      if (!config[field]) {
        errors.push('Missing required field: ' + field);
      }
    });

    if (config.profile && VALID_PROFILES.indexOf(config.profile) === -1) {
      errors.push('Invalid profile: ' + config.profile + '. Must be one of: ' + VALID_PROFILES.join(', '));
    }

    if (config.template && VALID_TEMPLATES.indexOf(config.template) === -1) {
      errors.push('Invalid template: ' + config.template + '. Must be one of: ' + VALID_TEMPLATES.join(', '));
    }

    if (config.content && !Array.isArray(config.content)) {
      errors.push('Content must be an array');
    }

    if (config.rounds && (typeof config.rounds !== 'number' || config.rounds < 1)) {
      errors.push('Rounds must be a positive number');
    }

    if (config.instructions) {
      if (config.instructions.text && typeof config.instructions.text !== 'string') {
        errors.push('Instructions.text must be a string');
      }
      if (config.instructions.audio && typeof config.instructions.audio !== 'string') {
        errors.push('Instructions.audio must be a string');
      }
    }

    if (config.rewards) {
      if (typeof config.rewards !== 'object') {
        errors.push('Rewards must be an object');
      }
    }

    if (config.completion) {
      if (config.completion.type && ['rounds', 'score', 'accuracy'].indexOf(config.completion.type) === -1) {
        errors.push('Completion.type must be rounds, score, or accuracy');
      }
    }

    if (config.scoring) {
      if (config.scoring.basePoints && typeof config.scoring.basePoints !== 'number') {
        errors.push('Scoring.basePoints must be a number');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  function getInvalidConfigError(config) {
    var result = validate(config);
    if (result.valid) return null;
    return {
      type: 'INVALID_CONFIG',
      message: 'Configuración de minijuego inválida',
      details: result.errors,
      recoverable: true
    };
  }

  return {
    validate: validate,
    getInvalidConfigError: getInvalidConfigError,
    VALID_PROFILES: VALID_PROFILES,
    VALID_TEMPLATES: VALID_TEMPLATES
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameConfigValidator };
}
if (typeof window !== 'undefined') {
  window.GameConfigValidator = GameConfigValidator;
}
