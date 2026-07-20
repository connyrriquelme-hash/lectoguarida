/**
 * mission-orchestrator.js
 * Orquesta el ciclo de misión de aprendizaje: inicio → desafíos → evidencia → dominio → recompensa.
 * No importa Three.js.
 */

export function createMissionOrchestrator(options) {
  var evidenceCollector = options.evidenceCollector;
  var studentModel = options.studentModel;
  var masteryEngine = options.masteryEngine;
  var progressAdapter = options.progressAdapter;
  var rewardAdapter = options.rewardAdapter;
  var worldAdapter = options.worldAdapter;
  var eventBus = options.eventBus || null;
  var missionData = options.missionData;

  var currentMission = null;

  function startMission(missionId) {
    var mission = missionId ? findMission(missionId) : missionData;
    if (!mission) return { started: false, error: 'mission_not_found' };

    currentMission = {
      missionId: mission.id,
      skillId: mission.targetSkillIds[0],
      masteryRuleId: mission.masteryRequirements.ruleId,
      startedAt: Date.now(),
      status: 'active',
      roundsCompleted: 0,
      totalRounds: mission.masteryRequirements.minimumAttempts || 8,
      evidence: []
    };

    var existing = progressAdapter.getMissionState(mission.id);
    if (existing && existing.status === 'completed') {
      return { started: false, error: 'mission_already_completed', missionId: mission.id };
    }

    progressAdapter.saveMissionState(mission.id, currentMission);

    if (eventBus) {
      eventBus.emit('learning:mission-started', { missionId: mission.id, skillId: currentMission.skillId });
    }

    return { started: true, missionId: mission.id, skillId: currentMission.skillId };
  }

  function findMission(missionId) {
    if (missionData && missionData.id === missionId) return missionData;
    return null;
  }

  function processRoundResult(result) {
    if (!currentMission) return { processed: false, error: 'no_active_mission' };

    var evidence = evidenceCollector.createEvidence({
      skillId: currentMission.skillId,
      challengeId: result.challengeId || 'initial-sound-detector',
      evidenceType: result.correct ? 'initial_sound_selection' : 'initial_sound_selection',
      stimulusId: result.stimulusId || null,
      responseId: result.responseId || null,
      correct: result.correct,
      hintsUsed: result.hintsUsed || 0,
      audioRepetitions: result.audioRepetitions || 0,
      responseMs: result.responseMs || null,
      difficulty: result.difficulty || 'estandar'
    });

    currentMission.evidence.push(evidence.eventId);
    currentMission.roundsCompleted += 1;

    var skillState = studentModel.recordAttempt({
      skillId: currentMission.skillId,
      correct: result.correct,
      independent: result.hintsUsed === 0,
      hintsUsed: result.hintsUsed || 0,
      audioRepetitions: result.audioRepetitions || 0,
      responseMs: result.responseMs || null
    });

    progressAdapter.addEvidenceSummary(evidence);
    progressAdapter.saveSkillState(currentMission.skillId, skillState);

    var masteryResult = masteryEngine.evaluate(skillState, currentMission.masteryRuleId);

    if (eventBus) {
      eventBus.emit('learning:round-completed', {
        missionId: currentMission.missionId,
        round: currentMission.roundsCompleted,
        correct: result.correct,
        mastery: masteryResult.mastery
      });
    }

    if (masteryResult.dominated) {
      return completeMission(masteryResult);
    }

    return {
      processed: true,
      correct: result.correct,
      mastery: masteryResult.mastery,
      nextAction: masteryResult.nextAction,
      dominated: false,
      roundsCompleted: currentMission.roundsCompleted
    };
  }

  function completeMission(masteryResult) {
    currentMission.status = 'completed';
    currentMission.completedAt = Date.now();
    currentMission.finalMastery = masteryResult.mastery;
    progressAdapter.saveMissionState(currentMission.missionId, currentMission);

    var rewardId = missionData && missionData.rewardId ? missionData.rewardId : null;
    var rewardAwarded = false;
    if (rewardId) {
      rewardAwarded = rewardAdapter.awardReward(rewardId);
    }

    var worldChangeId = missionData && missionData.worldChangeId ? missionData.worldChangeId : null;
    var worldChangeApplied = false;
    if (worldChangeId) {
      worldChangeApplied = worldAdapter.applyWorldChange(worldChangeId);
    }

    if (eventBus) {
      eventBus.emit('learning:mission-completed', {
        missionId: currentMission.missionId,
        mastery: masteryResult.mastery,
        rewardAwarded: rewardAwarded,
        worldChangeApplied: worldChangeApplied
      });
      eventBus.emit('learning:mastery-reached', {
        missionId: currentMission.missionId,
        skillId: currentMission.skillId,
        mastery: masteryResult.mastery
      });
    }

    return {
      processed: true,
      correct: true,
      mastery: masteryResult.mastery,
      nextAction: 'mission_complete',
      dominated: true,
      roundsCompleted: currentMission.roundsCompleted,
      rewardAwarded: rewardAwarded,
      worldChangeApplied: worldChangeApplied
    };
  }

  function getCurrentMission() {
    return currentMission ? Object.assign({}, currentMission) : null;
  }

  function isMissionCompleted(missionId) {
    var state = progressAdapter.getMissionState(missionId);
    return state && state.status === 'completed';
  }

  return {
    startMission: startMission,
    processRoundResult: processRoundResult,
    getCurrentMission: getCurrentMission,
    isMissionCompleted: isMissionCompleted
  };
}
