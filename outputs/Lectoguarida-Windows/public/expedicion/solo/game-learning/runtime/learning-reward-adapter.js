/**
 * learning-reward-adapter.js
 * Otorga recompensas de aprendizaje de forma idempotente.
 * Delega a SoloProgressRepository/RewardManager existentes.
 * No duplica repositorio.
 */

export function createLearningRewardAdapter(options) {
  var progressAdapter = options.progressAdapter;
  var RewardManager = options.RewardManager;
  var SoloProgressRepository = options.SoloProgressRepository;
  var studentId = options.studentId || 'default-student';
  var readerProfile = options.readerProfile || 'non_reader';

  function awardReward(rewardId) {
    if (!rewardId) return false;
    if (progressAdapter.hasReward(rewardId)) return false;

    progressAdapter.addReward(rewardId);

    if (RewardManager && RewardManager.awardBadge) {
      try {
        RewardManager.awardBadge(studentId, readerProfile, rewardId);
      } catch (e) {
        // swallow
      }
    } else if (SoloProgressRepository) {
      try {
        SoloProgressRepository.addReward(studentId, readerProfile, rewardId);
      } catch (e) {
        // swallow
      }
    }

    return true;
  }

  function isAwarded(rewardId) {
    return progressAdapter.hasReward(rewardId);
  }

  return {
    awardReward: awardReward,
    isAwarded: isAwarded
  };
}
