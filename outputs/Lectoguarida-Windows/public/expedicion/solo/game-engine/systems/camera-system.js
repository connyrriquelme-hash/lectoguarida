/**
 * camera-system.js
 * Updates camera to follow CameraTarget entities.
 */

import { COMPONENTS } from '../components/components.js';

export function createCameraSystem() {
  return {
    componentId: 'CameraSystem',
    update: function (context, delta) {
      var registry = context.componentRegistry;
      var targets = registry.query(COMPONENTS.CAMERA_TARGET);
      for (var i = 0; i < targets.length; i++) {
        var ct = targets[i];
        var transform = registry.getComponent(ct.entityId, COMPONENTS.TRANSFORM);
        if (!transform) continue;
        context.eventBus.emit('camera:update', {
          position: transform.position,
          offset: ct.offset,
          mode: ct.mode || 'FOLLOW'
        });
      }
    }
  };
}