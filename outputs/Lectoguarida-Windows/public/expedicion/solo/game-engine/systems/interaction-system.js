/**
 * interaction-system.js
 * Handles interaction raycasting and triggers.
 */

import { COMPONENTS } from '../components/components.js';

export function createInteractionSystem() {
  return {
    componentId: 'InteractionSystem',
    update: function (context, delta) {
      var registry = context.componentRegistry;
      var entities = registry.query(COMPONENTS.INTERACTION);
      // InteractionSystem mainly responds to events
      // update is mostly for polling proximity
    }
  };
}