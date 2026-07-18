/**
 * progress-repository.js
 * Interfaz y implementación local de progreso para modo individual.
 * Namespace separado del modo colaborativo.
 */

const SoloProgressRepository = (function () {
  const STORAGE_KEY_PREFIX = 'lectoguarida:solo-progress:v1';
  const SETTINGS_KEY_PREFIX = 'lectoguarida:solo-settings:v1';

  function getProgressKey(studentProfileId) {
    return STORAGE_KEY_PREFIX + ':' + studentProfileId;
  }

  function getSettingsKey(studentProfileId) {
    return SETTINGS_KEY_PREFIX + ':' + studentProfileId;
  }

  function createDefaultProgress(studentProfileId) {
    return {
      version: 1,
      studentProfileId: studentProfileId,
      wallet: {
        lostPages: 0
      },
      hub: {
        unlockedItems: [],
        equippedItems: []
      },
      profiles: {
        non_reader: {
          currentWorld: 1,
          completedGames: [],
          stars: {},
          skillProgress: {},
          rewards: []
        },
        beginner: {
          currentWorld: 1,
          completedGames: [],
          stars: {},
          skillProgress: {},
          rewards: []
        },
        advanced: {
          currentWorld: 1,
          completedGames: [],
          stars: {},
          skillProgress: {},
          rewards: [],
          codexBosses: {}
        }
      }
    };
  }

  function load(studentProfileId) {
    try {
      var raw = localStorage.getItem(getProgressKey(studentProfileId));
      if (!raw) return createDefaultProgress(studentProfileId);
      var parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1 && parsed.studentProfileId === studentProfileId) {
        return parsed;
      }
      return createDefaultProgress(studentProfileId);
    } catch {
      return createDefaultProgress(studentProfileId);
    }
  }

  function save(studentProfileId, data) {
    try {
      localStorage.setItem(getProgressKey(studentProfileId), JSON.stringify(data));
    } catch {
      // storage full or unavailable
    }
  }

  function getProfileProgress(studentProfileId, readerProfile) {
    var progress = load(studentProfileId);
    return progress.profiles[readerProfile] || createDefaultProgress(studentProfileId).profiles[readerProfile];
  }

  function updateProfileProgress(studentProfileId, readerProfile, update) {
    var progress = load(studentProfileId);
    var profileData = progress.profiles[readerProfile];
    if (!profileData) return;
    Object.keys(update).forEach(function (key) {
      profileData[key] = update[key];
    });
    save(studentProfileId, progress);
  }

  function addLostPages(studentProfileId, amount) {
    var progress = load(studentProfileId);
    progress.wallet.lostPages = (progress.wallet.lostPages || 0) + amount;
    save(studentProfileId, progress);
    return progress.wallet.lostPages;
  }

  function getLostPages(studentProfileId) {
    var progress = load(studentProfileId);
    return progress.wallet.lostPages || 0;
  }

  function completeGame(studentProfileId, readerProfile, gameId, stars) {
    var progress = load(studentProfileId);
    var profileData = progress.profiles[readerProfile];
    if (!profileData) return;
    if (!profileData.completedGames.includes(gameId)) {
      profileData.completedGames.push(gameId);
    }
    profileData.stars[gameId] = Math.max(profileData.stars[gameId] || 0, stars);
    save(studentProfileId, progress);
  }

  function updateProfile(studentProfileId, readerProfile, patch) {
    var progress = load(studentProfileId);
    var profileData = progress.profiles[readerProfile];
    if (!profileData) return;
    Object.keys(patch).forEach(function (key) {
      profileData[key] = patch[key];
    });
    save(studentProfileId, progress);
  }

  function addReward(studentProfileId, readerProfile, reward) {
    var progress = load(studentProfileId);
    var profileData = progress.profiles[readerProfile];
    if (!profileData) return;
    var rewards = profileData.rewards || [];
    if (rewards.indexOf(reward) === -1) {
      rewards.push(reward);
      profileData.rewards = rewards;
      save(studentProfileId, progress);
    }
  }

  function markGameCompleted(studentProfileId, readerProfile, gameId, result) {
    var progress = load(studentProfileId);
    var profileData = progress.profiles[readerProfile];
    if (!profileData) return;
    if (!profileData.completedGames.includes(gameId)) {
      profileData.completedGames.push(gameId);
    }
    if (result && result.stars) {
      profileData.stars[gameId] = Math.max(profileData.stars[gameId] || 0, result.stars);
    }
    if (result && result.score) {
      profileData.skillProgress[gameId] = result.score;
    }
    save(studentProfileId, progress);
  }

  function resetProfile(studentProfileId, readerProfile) {
    var progress = load(studentProfileId);
    progress.profiles[readerProfile] = createDefaultProgress(studentProfileId).profiles[readerProfile];
    save(studentProfileId, progress);
  }

  function clearAll(studentProfileId) {
    try {
      localStorage.removeItem(getProgressKey(studentProfileId));
      localStorage.removeItem(getSettingsKey(studentProfileId));
    } catch {
      // ignore
    }
  }

  return {
    load: load,
    save: save,
    getProfileProgress: getProfileProgress,
    updateProfileProgress: updateProfileProgress,
    updateProfile: updateProfile,
    addLostPages: addLostPages,
    getLostPages: getLostPages,
    completeGame: completeGame,
    addReward: addReward,
    markGameCompleted: markGameCompleted,
    resetProfile: resetProfile,
    clearAll: clearAll,
    createDefaultProgress: createDefaultProgress
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoloProgressRepository };
}
if (typeof window !== 'undefined') {
  window.SoloProgressRepository = SoloProgressRepository;
}
