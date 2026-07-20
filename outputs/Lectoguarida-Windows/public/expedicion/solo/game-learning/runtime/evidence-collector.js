/**
 * evidence-collector.js
 * Captura eventos de aprendizaje y produce evidencia válida contra learning-evidence.schema.json.
 * No importa Three.js. No persiste audio, voz, IP ni geolocalización.
 */

export function createEvidenceCollector(options) {
  var studentId = options.studentId || 'default-student';
  var missionId = options.missionId;
  var eventBus = options.eventBus || null;
  var evidenceLog = [];

  function generateEventId() {
    return 'ev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function createEvidence(data) {
    var evidence = {
      version: 1,
      eventId: generateEventId(),
      studentId: studentId,
      sessionId: options.sessionId || 'session_' + Date.now().toString(36),
      skillId: data.skillId || 'phonological_initial_sound_identification',
      missionId: missionId || data.missionId,
      challengeId: data.challengeId || 'initial-sound-detector',
      evidenceType: data.evidenceType,
      stimulusId: data.stimulusId || null,
      responseId: data.responseId || null,
      correct: !!data.correct,
      independent: data.hintsUsed === 0 || data.hintsUsed === undefined,
      difficulty: data.difficulty || 'estandar',
      responseMs: typeof data.responseMs === 'number' ? data.responseMs : null,
      hintsUsed: typeof data.hintsUsed === 'number' ? data.hintsUsed : 0,
      audioRepetitions: typeof data.audioRepetitions === 'number' ? data.audioRepetitions : 0,
      context: data.context || null
    };

    evidenceLog.push(evidence);

    if (eventBus) {
      eventBus.emit('learning:evidence-created', { evidence: evidence });
    }

    return evidence;
  }

  function getEvidenceLog() {
    return evidenceLog.slice();
  }

  function clearLog() {
    evidenceLog = [];
  }

  function getSummary() {
    var total = evidenceLog.length;
    var correct = evidenceLog.filter(function (e) { return e.correct; }).length;
    var independent = evidenceLog.filter(function (e) { return e.independent; }).length;
    return {
      total: total,
      correct: correct,
      accuracy: total > 0 ? correct / total : 0,
      independent: independent,
      independentAccuracy: total > 0 ? independent / total : 0
    };
  }

  return {
    createEvidence: createEvidence,
    getEvidenceLog: getEvidenceLog,
    clearLog: clearLog,
    getSummary: getSummary
  };
}
