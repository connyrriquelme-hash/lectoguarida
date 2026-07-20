/**
 * student-model.js
 * Modelo de estudiante en memoria. Rastrea progreso por habilidad.
 * No importa Three.js. No persiste audio ni datos sensibles.
 */

export function createStudentModel(options) {
  var studentId = options.studentId || 'default-student';
  var skills = {};

  function getSkillState(skillId) {
    if (!skills[skillId]) {
      skills[skillId] = {
        skillId: skillId,
        status: 'not_started',
        mastery: 0,
        attempts: 0,
        correct: 0,
        independentCorrect: 0,
        consecutiveCorrect: 0,
        maxConsecutiveCorrect: 0,
        averageResponseMs: 0,
        hintsUsed: 0,
        audioRepetitions: 0,
        sessions: 1,
        lastAttemptAt: null,
        responseTimes: []
      };
    }
    return skills[skillId];
  }

  function recordAttempt(data) {
    var skillId = data.skillId || 'phonological_initial_sound_identification';
    var state = getSkillState(skillId);

    state.attempts += 1;
    state.lastAttemptAt = Date.now();

    if (data.correct) {
      state.correct += 1;
      state.consecutiveCorrect += 1;
      if (state.consecutiveCorrect > state.maxConsecutiveCorrect) {
        state.maxConsecutiveCorrect = state.consecutiveCorrect;
      }
    } else {
      state.consecutiveCorrect = 0;
    }

    if (data.independent) {
      state.independentCorrect += 1;
    }

    if (typeof data.hintsUsed === 'number') {
      state.hintsUsed += data.hintsUsed;
    }

    if (typeof data.audioRepetitions === 'number') {
      state.audioRepetitions += data.audioRepetitions;
    }

    if (typeof data.responseMs === 'number' && data.responseMs > 0) {
      state.responseTimes.push(data.responseMs);
      var sum = 0;
      for (var i = 0; i < state.responseTimes.length; i++) {
        sum += state.responseTimes[i];
      }
      state.averageResponseMs = Math.round(sum / state.responseTimes.length);
    }

    state.mastery = state.attempts > 0 ? state.correct / state.attempts : 0;

    if (state.attempts === 0) {
      state.status = 'not_started';
    } else if (state.mastery >= 0.8 && state.consecutiveCorrect >= 3) {
      state.status = 'mastered';
    } else if (state.mastery >= 0.5 || state.attempts >= 3) {
      state.status = 'in_progress';
    } else {
      state.status = 'started';
    }

    return state;
  }

  function updateStatus(skillId, status) {
    var state = getSkillState(skillId);
    state.status = status;
    return state;
  }

  function getAllSkills() {
    var result = {};
    for (var key in skills) {
      result[key] = Object.assign({}, skills[key], { responseTimes: skills[key].responseTimes.slice() });
    }
    return result;
  }

  function getStudentId() {
    return studentId;
  }

  return {
    getSkillState: getSkillState,
    recordAttempt: recordAttempt,
    updateStatus: updateStatus,
    getAllSkills: getAllSkills,
    getStudentId: getStudentId
  };
}
