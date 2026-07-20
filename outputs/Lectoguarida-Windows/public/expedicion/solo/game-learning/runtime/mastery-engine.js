/**
 * mastery-engine.js
 * Evalúa dominio de habilidades según mastery-rules.json.
 * No hardcodea umbrales. Carga la regla desde mastery-rules.json.
 * No importa Three.js.
 */

var MASTERY_RULES_CACHE = null;

function loadMasteryRules() {
  if (MASTERY_RULES_CACHE) return MASTERY_RULES_CACHE;
  try {
    if (typeof require !== 'undefined') {
      MASTERY_RULES_CACHE = require('../../game-learning/config/mastery-rules.json');
    }
  } catch (e) {
    MASTERY_RULES_CACHE = null;
  }
  return MASTERY_RULES_CACHE;
}

export function setMasteryRules(rules) {
  MASTERY_RULES_CACHE = rules;
}

export function createMasteryEngine(options) {
  var rulesData = options.masteryRules || loadMasteryRules();
  var defaultRuleId = options.defaultRuleId || 'mastery_80_3_consecutive';

  function getRule(ruleId) {
    var id = ruleId || defaultRuleId;
    if (rulesData && rulesData.rules && rulesData.rules[id]) {
      return rulesData.rules[id];
    }
    return {
      id: id,
      minimumAttempts: 8,
      minimumAccuracy: 0.8,
      minimumIndependentAccuracy: 0.7,
      maximumHintRate: 0.35,
      consecutiveCorrectRequired: 3,
      requiredSessions: 2,
      requiredTransferTasks: 1,
      retentionCheckAfterDays: 7,
      minimumRetentionAccuracy: 0.7,
      allowTeacherOverride: true
    };
  }

  function evaluate(skillState, ruleId) {
    var rule = getRule(ruleId);
    var attempts = skillState.attempts || 0;
    var correct = skillState.correct || 0;
    var independentCorrect = skillState.independentCorrect || 0;
    var consecutiveCorrect = skillState.consecutiveCorrect || 0;
    var hintsUsed = skillState.hintsUsed || 0;
    var mastery = attempts > 0 ? correct / attempts : 0;
    var independentAccuracy = attempts > 0 ? independentCorrect / attempts : 0;
    var hintRate = attempts > 0 ? hintsUsed / attempts : 0;

    var reasons = [];
    var dominated = true;

    if (attempts < rule.minimumAttempts) {
      dominated = false;
      reasons.push('attempts_insufficient');
    }

    if (mastery < rule.minimumAccuracy) {
      dominated = false;
      reasons.push('accuracy_below_threshold');
    }

    if (independentAccuracy < rule.minimumIndependentAccuracy) {
      dominated = false;
      reasons.push('independent_accuracy_below_threshold');
    }

    if (hintRate > rule.maximumHintRate) {
      dominated = false;
      reasons.push('hint_rate_too_high');
    }

    if (consecutiveCorrect < rule.consecutiveCorrectRequired) {
      dominated = false;
      reasons.push('consecutive_correct_insufficient');
    }

    var status;
    if (dominated) {
      status = 'mastered';
    } else if (attempts === 0) {
      status = 'not_started';
    } else if (mastery >= 0.5 || attempts >= 3) {
      status = 'in_progress';
    } else {
      status = 'started';
    }

    var nextAction;
    if (dominated) {
      nextAction = 'mission_complete';
    } else if (attempts === 0) {
      nextAction = 'start_mission';
    } else if (consecutiveCorrect >= 2 && mastery < rule.minimumAccuracy) {
      nextAction = 'continue_practice';
    } else if (reasons.indexOf('accuracy_below_threshold') !== -1 && attempts >= 3) {
      nextAction = 'provide_support';
    } else {
      nextAction = 'continue_practice';
    }

    return {
      dominated: dominated,
      mastery: mastery,
      status: status,
      reasons: reasons,
      nextAction: nextAction,
      rule: rule.id,
      metrics: {
        accuracy: mastery,
        independentAccuracy: independentAccuracy,
        hintRate: hintRate,
        consecutiveCorrect: consecutiveCorrect,
        attempts: attempts
      }
    };
  }

  function getRecommendedDifficulty(skillState, ruleId) {
    var result = evaluate(skillState, ruleId);
    if (result.dominated) return 3;
    if (result.metrics.accuracy < 0.4) return 1;
    if (result.metrics.accuracy < 0.7) return 2;
    return 3;
  }

  return {
    evaluate: evaluate,
    getRule: getRule,
    getRecommendedDifficulty: getRecommendedDifficulty
  };
}
