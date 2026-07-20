/**
 * learning-progress-adapter.js
 * Bridge entre LearningRuntime y SoloProgressRepository.
 * Namespace separado: lectoguarida.learning.v1
 * No duplica repositorio. No persiste audio, voz, IP ni datos sensibles.
 */

export function createLearningProgressAdapter(options) {
  var SoloProgressRepository = options.SoloProgressRepository;
  var studentId = options.studentId || 'default-student';
  var storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  var STORAGE_KEY = 'lectoguarida.learning.v1:' + studentId;
  var destroyed = false;

  function load() {
    if (destroyed) return createDefault();
    if (!storage) return createDefault();
    try {
      var raw = storage.getItem(STORAGE_KEY);
      if (!raw) return createDefault();
      var parsed = JSON.parse(raw);
      if (parsed && parsed.schemaVersion === 1 && parsed.studentId === studentId) {
        return parsed;
      }
      return createDefault();
    } catch (e) {
      return createDefault();
    }
  }

  function save(data) {
    if (destroyed) return;
    if (!storage) return;
    try {
      data.updatedAt = Date.now();
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // storage full or unavailable
    }
  }

  function createDefault() {
    return {
      schemaVersion: 1,
      studentId: studentId,
      missionStates: {},
      studentSkillStates: {},
      evidenceSummary: { total: 0, correct: 0, bySkill: {} },
      unlockedRewards: [],
      persistentWorldChanges: [],
      updatedAt: Date.now()
    };
  }

  function getMissionState(missionId) {
    var data = load();
    return data.missionStates[missionId] || null;
  }

  function saveMissionState(missionId, state) {
    var data = load();
    data.missionStates[missionId] = state;
    save(data);
    return state;
  }

  function getSkillState(skillId) {
    var data = load();
    return data.studentSkillStates[skillId] || null;
  }

  function saveSkillState(skillId, state) {
    var data = load();
    data.studentSkillStates[skillId] = state;
    save(data);
    return state;
  }

  function addEvidenceSummary(evidence) {
    var data = load();
    data.evidenceSummary.total += 1;
    if (evidence.correct) data.evidenceSummary.correct += 1;
    var skillId = evidence.skillId || 'unknown';
    if (!data.evidenceSummary.bySkill[skillId]) {
      data.evidenceSummary.bySkill[skillId] = { total: 0, correct: 0 };
    }
    data.evidenceSummary.bySkill[skillId].total += 1;
    if (evidence.correct) data.evidenceSummary.bySkill[skillId].correct += 1;
    save(data);
  }

  function addReward(rewardId) {
    var data = load();
    if (data.unlockedRewards.indexOf(rewardId) === -1) {
      data.unlockedRewards.push(rewardId);
      save(data);
    }
  }

  function hasReward(rewardId) {
    var data = load();
    return data.unlockedRewards.indexOf(rewardId) !== -1;
  }

  function addWorldChange(changeId) {
    var data = load();
    if (data.persistentWorldChanges.indexOf(changeId) === -1) {
      data.persistentWorldChanges.push(changeId);
      save(data);
    }
  }

  function hasWorldChange(changeId) {
    var data = load();
    return data.persistentWorldChanges.indexOf(changeId) !== -1;
  }

  function destroy() {
    destroyed = true;
  }

  function reset() {
    save(createDefault());
  }

  return {
    load: load,
    save: save,
    getMissionState: getMissionState,
    saveMissionState: saveMissionState,
    getSkillState: getSkillState,
    saveSkillState: saveSkillState,
    addEvidenceSummary: addEvidenceSummary,
    addReward: addReward,
    hasReward: hasReward,
    addWorldChange: addWorldChange,
    hasWorldChange: hasWorldChange,
    destroy: destroy,
    reset: reset
  };
}
