/**
 * save-system.js
 * Persists Saveable component fields via ProgressAdapter.
 */

import { COMPONENTS } from '../components/components.js';

export function createSaveSystem() {
  return {
    componentId: 'SaveSystem',
    save: function (key, data, context) {
      if (context && context.progress) {
        try { context.progress.saveAdventure(data); } catch (e) { /* swallow */ }
      }
    },
    load: function (key, context) {
      if (context && context.progress) {
        try { return context.progress.loadAdventure(); } catch (e) { return null; }
      }
      return null;
    },
    update: function (context, delta) {
      var registry = context.componentRegistry;
      var saveables = registry.query(COMPONENTS.SAVEABLE);
      for (var i = 0; i < saveables.length; i++) {
        var s = saveables[i];
        if (s.persistenceKey) {
          var data = {};
          s.fields.forEach(function (field) {
            var comp = registry.getComponent(s.entityId, field);
            if (comp) data[field] = comp;
          });
          context.progress.saveAdventure(data);
        }
      }
    }
  };
}