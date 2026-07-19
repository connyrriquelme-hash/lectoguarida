/**
 * audio-system.js
 * Handles audio emitter updates and spatial audio.
 */

import { COMPONENTS } from '../components/components.js';

export function createAudioSystem() {
  return {
    componentId: 'AudioSystem',
    update: function (context, delta) {
      var registry = context.componentRegistry;
      var emitters = registry.query(COMPONENTS.AUDIO_EMITTER);
      for (var i = 0; i < emitters.length; i++) {
        var ae = emitters[i];
        var transform = registry.getComponent(ae.entityId, COMPONENTS.TRANSFORM);
        if (!transform) continue;
        if (ae.spatial && ae.cueId) {
          context.eventBus.emit('audio:play-spatial', {
            cueId: ae.cueId,
            position: transform.position,
            volume: ae.volume || 1
          });
        }
      }
    }
  };
}