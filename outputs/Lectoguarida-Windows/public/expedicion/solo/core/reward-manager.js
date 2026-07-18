/**
 * reward-manager.js
 * Gestor de recompensas del modo individual.
 * Soporta: Páginas Perdidas, estrellas, insignia de demostración.
 * No crea la Guarida Personal todavía.
 * No guarda recompensas del colaborativo.
 * Persiste en lectoguarida:solo-progress:v1:<studentProfileId>.
 */

var RewardManager = (function () {
  'use strict';

  function create(progressRepository, studentProfileId) {
    var repo = progressRepository;
    var profileId = studentProfileId;

    function awardLostPages(amount) {
      if (!repo || !profileId) return 0;
      return repo.addLostPages(profileId, amount);
    }

    function getLostPages() {
      if (!repo || !profileId) return 0;
      return repo.getLostPages(profileId);
    }

    function awardStars(readerProfile, gameId, stars) {
      if (!repo || !profileId) return;
      var canonicalId = (typeof GameIdNormalizer !== 'undefined')
        ? GameIdNormalizer.normalizeGameId(gameId)
        : gameId;
      var progress = repo.load(profileId);
      if (progress && progress.profiles && progress.profiles[readerProfile]) {
        var p = progress.profiles[readerProfile];
        p.stars[canonicalId] = Math.max(p.stars[canonicalId] || 0, stars);
        repo.save(profileId, progress);
      }
    }

    function getStars(readerProfile, gameId) {
      if (!repo || !profileId) return 0;
      var progress = repo.load(profileId);
      if (progress && progress.profiles && progress.profiles[readerProfile]) {
        return progress.profiles[readerProfile].stars[gameId] || 0;
      }
      return 0;
    }

    function awardBadge(readerProfile, badgeId) {
      if (!repo || !profileId) return;
      var progress = repo.load(profileId);
      if (progress && progress.profiles && progress.profiles[readerProfile]) {
        var rewards = progress.profiles[readerProfile].rewards || [];
        if (rewards.indexOf(badgeId) === -1) {
          rewards.push(badgeId);
          progress.profiles[readerProfile].rewards = rewards;
          repo.save(profileId, progress);
        }
      }
    }

    function hasBadge(readerProfile, badgeId) {
      if (!repo || !profileId) return false;
      var progress = repo.load(profileId);
      if (progress && progress.profiles && progress.profiles[readerProfile]) {
        return (progress.profiles[readerProfile].rewards || []).indexOf(badgeId) !== -1;
      }
      return false;
    }

    function getAllBadges(readerProfile) {
      if (!repo || !profileId) return [];
      var progress = repo.load(profileId);
      if (progress && progress.profiles && progress.profiles[readerProfile]) {
        return progress.profiles[readerProfile].rewards || [];
      }
      return [];
    }

    return {
      awardLostPages: awardLostPages,
      getLostPages: getLostPages,
      awardStars: awardStars,
      getStars: getStars,
      awardBadge: awardBadge,
      hasBadge: hasBadge,
      getAllBadges: getAllBadges
    };
  }

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RewardManager };
}
if (typeof window !== 'undefined') {
  window.RewardManager = RewardManager;
}
