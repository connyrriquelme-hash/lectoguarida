/**
 * animation-system.js
 * Updates Animation component based on Movement velocity.
 */

import { COMPONENTS } from '../components/components.js';

export function createAnimationSystem() {
  return {
    componentId: 'AnimationSystem',
    update: function (context, delta) {
      var registry = context.componentRegistry;
      var anims = registry.query(COMPONENTS.ANIMATION);
      for (var i = 0; i < anims.length; i++) {
        var anim = anims[i];
        var mv = registry.getComponent(anim.entityId, COMPONENTS.MOVEMENT);
        var speed = mv ? Math.sqrt(mv.velocity[0] * mv.velocity[0] + mv.velocity[2] * mv.velocity[2]) : 0;
        if (speed > 0.5 && anim.currentState !== 'WALK') {
          anim.currentState = 'WALK';
          context.eventBus.emit('animation:changed', { entityId: anim.entityId, state: 'WALK' });
        } else if (speed <= 0.5 && anim.currentState !== 'IDLE') {
          anim.currentState = 'IDLE';
          context.eventBus.emit('animation:changed', { entityId: anim.entityId, state: 'IDLE' });
        }
      }
    }
  };
}