/**
 * narrative-system.js
 * Triggers narrative scenes based on NarrativeTrigger component.
 */

import { COMPONENTS } from '../components/components.js';

export function createNarrativeSystem() {
  return {
    componentId: 'NarrativeSystem',
    update: function (context, delta) {
      var registry = context.componentRegistry;
      var triggers = registry.query(COMPONENTS.NARRATIVE_TRIGGER);
      for (var i = 0; i < triggers.length; i++) {
        var tr = triggers[i];
        if (tr.triggered) continue;
        if (tr.triggerType === 'proximity') {
          var playerId = getPlayerEntity(context);
          if (!playerId) continue;
          var playerTransform = registry.getComponent(playerId, COMPONENTS.TRANSFORM);
          var triggerTransform = registry.getComponent(tr.entityId, COMPONENTS.TRANSFORM);
          if (!playerTransform || !triggerTransform) continue;
          var dx = playerTransform.position[0] - triggerTransform.position[0];
          var dz = playerTransform.position[2] - triggerTransform.position[2];
          var dist2 = dx * dx + dz * dz;
          if (dist2 < 16) {
            tr.triggered = true;
            context.eventBus.emit('narrative:scene-started', {
              sceneId: tr.sceneId,
              speaker: tr.speaker || 'Rina',
              lines: tr.lines || ['...']
            });
          }
        }
      }
    }
  };
}

function getPlayerEntity(context) {
  var entities = context.entityManager.queryComponents('cameraTarget');
  return entities.length > 0 ? entities[0].entityId : null;
}