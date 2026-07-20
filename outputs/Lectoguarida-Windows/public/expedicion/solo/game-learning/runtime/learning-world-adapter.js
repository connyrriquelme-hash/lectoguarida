/**
 * learning-world-adapter.js
 * Aplica cambios persistentes al mundo visual (grúa, contenedores).
 * Emite evento learning:world-change.
 * Idempotente: no duplica cambios.
 * No modifica colisiones ni geometría crítica.
 */

export function createLearningWorldAdapter(options) {
  var progressAdapter = options.progressAdapter;
  var eventBus = options.eventBus || null;

  function applyWorldChange(changeId) {
    if (!changeId) return false;
    if (progressAdapter.hasWorldChange(changeId)) return false;

    progressAdapter.addWorldChange(changeId);

    if (eventBus) {
      eventBus.emit('learning:world-change', { changeId: changeId, timestamp: Date.now() });
    }

    return true;
  }

  function isApplied(changeId) {
    return progressAdapter.hasWorldChange(changeId);
  }

  function applyAll() {
    var data = progressAdapter.load();
    var changes = data.persistentWorldChanges || [];
    for (var i = 0; i < changes.length; i++) {
      if (eventBus) {
        eventBus.emit('learning:world-change', { changeId: changes[i], replay: true });
      }
    }
    return changes.length;
  }

  return {
    applyWorldChange: applyWorldChange,
    isApplied: isApplied,
    applyAll: applyAll
  };
}
