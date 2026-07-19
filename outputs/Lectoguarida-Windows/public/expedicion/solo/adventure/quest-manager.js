/**
 * quest-manager.js
 * Sigue el estado de la misión activa (objetos, progreso, recompensa).
 */

export function createQuestManager(mission) {
  var total = mission.collectibleCount || 0;
  var found = [];

  function collect(id) {
    if (found.indexOf(id) >= 0) return false;
    found.push(id);
    return true;
  }

  function isComplete() { return found.length >= total; }
  function progress() { return { found: found.length, total: total, ratio: total ? found.length / total : 0 }; }
  function reset() { found = []; }

  return {
    collect: collect,
    isComplete: isComplete,
    progress: progress,
    getFound: function () { return found.slice(); },
    reset: reset,
    missionId: mission.id
  };
}
