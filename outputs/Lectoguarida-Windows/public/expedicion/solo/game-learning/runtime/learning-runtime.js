/**
 * learning-runtime.js
 * Punto de entrada del runtime de aprendizaje V1.
 * Orquesta evidence, mastery, progreso, recompensa y cambio del mundo.
 * No importa Three.js directamente.
 */

import { isLearningV1Enabled, isDebugLearningEnabled } from './learning-feature-flag.js';
import { createEvidenceCollector } from './evidence-collector.js';
import { createStudentModel } from './student-model.js';
import { createMasteryEngine } from './mastery-engine.js';
import { createLearningProgressAdapter } from './learning-progress-adapter.js';
import { createLearningRewardAdapter } from './learning-reward-adapter.js';
import { createLearningWorldAdapter } from './learning-world-adapter.js';
import { createMissionOrchestrator } from './mission-orchestrator.js';

export function createLearningRuntime(options) {
  var searchParams = options.searchParams;
  var studentId = options.studentId || 'default-student';
  var eventBus = options.eventBus || null;
  var SoloProgressRepository = options.SoloProgressRepository;
  var RewardManager = options.RewardManager;
  var missionData = options.missionData || null;
  var debug = isDebugLearningEnabled(searchParams);

  if (!isLearningV1Enabled(searchParams)) {
    return null;
  }

  var sessionId = 'session_' + Date.now().toString(36);

  var progressAdapter = createLearningProgressAdapter({
    SoloProgressRepository: SoloProgressRepository,
    studentId: studentId
  });

  var evidenceCollector = createEvidenceCollector({
    studentId: studentId,
    missionId: missionData ? missionData.id : null,
    sessionId: sessionId,
    eventBus: eventBus
  });

  var studentModel = createStudentModel({
    studentId: studentId
  });

  var masteryEngine = createMasteryEngine({});

  var rewardAdapter = createLearningRewardAdapter({
    progressAdapter: progressAdapter,
    RewardManager: RewardManager,
    SoloProgressRepository: SoloProgressRepository,
    studentId: studentId
  });

  var worldAdapter = createLearningWorldAdapter({
    progressAdapter: progressAdapter,
    eventBus: eventBus
  });

  var missionOrchestrator = createMissionOrchestrator({
    evidenceCollector: evidenceCollector,
    studentModel: studentModel,
    masteryEngine: masteryEngine,
    progressAdapter: progressAdapter,
    rewardAdapter: rewardAdapter,
    worldAdapter: worldAdapter,
    eventBus: eventBus,
    missionData: missionData
  });

  function destroy() {
    progressAdapter.destroy();
  }

  function getDebugInfo() {
    if (!debug) return null;
    return {
      sessionId: sessionId,
      studentId: studentId,
      mission: missionOrchestrator.getCurrentMission(),
      evidenceLog: evidenceCollector.getEvidenceLog(),
      skills: studentModel.getAllSkills(),
      evidenceSummary: evidenceCollector.getSummary()
    };
  }

  return {
    isLearningV1: true,
    debug: debug,
    evidenceCollector: evidenceCollector,
    studentModel: studentModel,
    masteryEngine: masteryEngine,
    progressAdapter: progressAdapter,
    rewardAdapter: rewardAdapter,
    worldAdapter: worldAdapter,
    missionOrchestrator: missionOrchestrator,
    getDebugInfo: getDebugInfo,
    destroy: destroy
  };
}
