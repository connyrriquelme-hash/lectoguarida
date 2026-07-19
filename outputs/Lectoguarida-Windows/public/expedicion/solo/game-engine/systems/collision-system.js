/**
 * collision-system.js
 * Simple AABB/sphere collision detection.
 */

import { COMPONENTS } from '../components/components.js';

export function createCollisionSystem() {
  return {
    componentId: 'CollisionSystem',
    update: function (context, delta) {
      var registry = context.componentRegistry;
      var entities = registry.query(COMPONENTS.COLLIDER);
      // Simple broadphase: check all pairs
      for (var i = 0; i < entities.length; i++) {
        var a = entities[i];
        var ta = registry.getComponent(a.entityId, COMPONENTS.TRANSFORM);
        if (!ta) continue;
        for (var j = i + 1; j < entities.length; j++) {
          var b = entities[j];
          var tb = registry.getComponent(b.entityId, COMPONENTS.TRANSFORM);
          if (!tb) continue;
          if (checkCollision(a, ta, b, tb)) {
            context.eventBus.emit('collision:enter', { a: a.entityId, b: b.entityId });
          }
        }
      }
    }
  };
}

function checkCollision(a, ta, b, tb) {
  var ar = a.radius || 1;
  var br = b.radius || 1;
  var dx = ta.position[0] - tb.position[0];
  var dz = ta.position[2] - tb.position[2];
  var dist2 = dx * dx + dz * dz;
  var radSum = ar + br;
  return dist2 <= radSum * radSum;
}