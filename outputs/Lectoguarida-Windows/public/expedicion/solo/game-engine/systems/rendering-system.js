/**
 * rendering-system.js
 * Syncs RenderComponent to Three.js via ThreeRenderAdapter.
 */

import { COMPONENTS } from '../components/components.js';

export function createRenderingSystem() {
  return {
    componentId: 'RenderingSystem',
    update: function (context, delta) {
      if (context.renderAdapter && context.renderAdapter.update) {
        context.renderAdapter.update();
      }
    }
  };
}