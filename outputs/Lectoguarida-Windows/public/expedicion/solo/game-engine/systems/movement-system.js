/**
 * movement-system.js
 * Updates Transform based on Movement component.
 */

import { COMPONENTS } from '../components/components.js';

export function createMovementSystem() {
  return {
    componentId: 'MovementSystem',
    update: function (context, delta) {
      var registry = context.componentRegistry;
      var entities = registry.query(COMPONENTS.MOVEMENT);
      for (var i = 0; i < entities.length; i++) {
        var mv = entities[i];
        if (!mv.enabled) continue;
        var transform = registry.getComponent(mv.entityId, COMPONENTS.TRANSFORM);
        if (!transform) continue;
        var dx = (mv.direction[0] || 0) * mv.speed * delta;
        var dz = (mv.direction[2] || 0) * mv.speed * delta;
        transform.position[0] += dx;
        transform.position[2] += dz;
        mv.velocity = [dx / delta, 0, dz / delta];
      }
    }
  };
}