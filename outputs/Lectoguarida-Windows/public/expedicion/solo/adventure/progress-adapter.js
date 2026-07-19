/**
 * progress-adapter.js
 * Guarda el progreso de la aventura reutilizando SoloProgressRepository.
 * No crea un sistema de progreso paralelo.
 */

import { ADVENTURE_REWARDS, BACKPACK_SLOTS } from './adventure-config.js';

export function createProgressAdapter(deps) {
  var SoloProgressRepository = deps.SoloProgressRepository;
  var readerProfile = deps.readerProfile || 'non_reader';
  var studentProfileId = deps.studentProfileId || 'default-student';
  var memoryCache = {
    chapter: null,
    missionId: null,
    completedMissions: [],
    collectiblesFound: [],
    stars: 0,
    rewardIds: [],
    characterId: null,
    difficulty: null,
    unlockedZones: ['plaza-guarida', 'laguna-rimas'],
    backpack: [],
    regions: {},
    neblin: 'NEBLIN_DENSE',
    labelsOn: false,
    metrics: {}
  };
  var memoryActive = false;

  function getProgress() {
    try {
      return SoloProgressRepository.getProfileProgress(studentProfileId, readerProfile) || {};
    } catch (e) { return {}; }
  }

  function loadAdventure() {
    if (memoryActive) return memoryCache;
    var p = getProgress();
    return p.adventure || {
      chapter: null,
      missionId: null,
      completedMissions: [],
      collectiblesFound: [],
      stars: 0,
      rewardIds: [],
      characterId: null,
      difficulty: null,
      unlockedZones: ['plaza-guarida', 'laguna-rimas'],
      backpack: [],
      regions: {},
      neblin: 'NEBLIN_DENSE',
      labelsOn: false,
      metrics: {}
    };
  }

  function saveAdventure(patch) {
    var current = loadAdventure();
    var next = Object.assign({}, current, patch);
    if (memoryActive) { memoryCache = next; return next; }
    try {
      SoloProgressRepository.updateProfileProgress(studentProfileId, readerProfile, { adventure: next });
    } catch (e) {
      memoryActive = true;
      memoryCache = next;
    }
    return next;
  }

  function addStars(amount) {
    var a = loadAdventure();
    var current = a.stars || 0;
    var next = Math.max(current, current + amount, 0);
    var updated = saveAdventure({ stars: next });
    return updated.stars;
  }

  function addReward(rewardId) {
    var a = loadAdventure();
    if (a.rewardIds && a.rewardIds.indexOf(rewardId) >= 0) return false;
    var list = (a.rewardIds || []).slice();
    list.push(rewardId);
    saveAdventure({ rewardIds: list });
    return true;
  }

  function completeMission(missionId) {
    var a = loadAdventure();
    var list = (a.completedMissions || []).slice();
    if (list.indexOf(missionId) < 0) list.push(missionId);
    var unlocked = (a.unlockedZones || []).slice();
    unlocked.push('bosque-sonido', 'puente-silabas', 'cueva-eco');
    saveAdventure({ completedMissions: list, unlockedZones: unlocked, missionId: missionId });
  }

  function markCollectible(id) {
    var a = loadAdventure();
    var list = (a.collectiblesFound || []).slice();
    if (list.indexOf(id) >= 0) return false;
    list.push(id);
    saveAdventure({ collectiblesFound: list });
    return true;
  }

  function setCharacter(characterId) {
    saveAdventure({ characterId: characterId });
  }

  function setDifficulty(difficulty) {
    saveAdventure({ difficulty: difficulty });
  }

  function resetAdventure() {
    saveAdventure({
      chapter: null, missionId: null, completedMissions: [], collectiblesFound: [],
      stars: 0, rewardIds: [], characterId: null, difficulty: null,
      unlockedZones: ['plaza-guarida', 'laguna-rimas'],
      backpack: [], regions: {}, neblin: 'NEBLIN_DENSE', labelsOn: false, metrics: {}
    });
  }

  function recordMetric(name) {
    var a = loadAdventure();
    var metrics = Object.assign({}, a.metrics || {});
    metrics[name] = (metrics[name] || 0) + 1;
    saveAdventure({ metrics: metrics });
  }

  function setBackpack(items) {
    var max = Array.isArray(BACKPACK_SLOTS) ? BACKPACK_SLOTS.length : 6;
    saveAdventure({ backpack: (items || []).slice(0, max) });
  }

  function getBackpack() {
    return (loadAdventure().backpack || []).slice();
  }

  function saveRegionState(id, state) {
    var a = loadAdventure();
    var regions = Object.assign({}, a.regions || {});
    regions[id] = state;
    saveAdventure({ regions: regions });
  }

  function getRegionState(id) {
    var a = loadAdventure();
    return (a.regions || {})[id] || null;
  }

  function setNeblin(state) { saveAdventure({ neblin: state }); }
  function getNeblin() { return loadAdventure().neblin || 'NEBLIN_DENSE'; }

  function setLabels(on) { saveAdventure({ labelsOn: !!on }); }
  function getLabels() { return !!loadAdventure().labelsOn; }

  function getRewardById(rewardId) {
    return ADVENTURE_REWARDS[rewardId] || null;
  }

  return {
    loadAdventure: loadAdventure,
    saveAdventure: saveAdventure,
    addStars: addStars,
    addReward: addReward,
    completeMission: completeMission,
    markCollectible: markCollectible,
    setCharacter: setCharacter,
    setDifficulty: setDifficulty,
    resetAdventure: resetAdventure,
    getStars: function () { return loadAdventure().stars || 0; },
    recordMetric: recordMetric,
    setBackpack: setBackpack,
    getBackpack: getBackpack,
    saveRegionState: saveRegionState,
    getRegionState: getRegionState,
    setNeblin: setNeblin,
    getNeblin: getNeblin,
    setLabels: setLabels,
    getLabels: getLabels,
    getRewardById: getRewardById
  };
}
