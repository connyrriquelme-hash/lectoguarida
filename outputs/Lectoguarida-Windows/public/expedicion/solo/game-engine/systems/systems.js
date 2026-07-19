/**
 * systems.js
 * Base systems for the Entity Component System.
 */

import { COMPONENTS } from '../components/components.js';

export var SYSTEM_PRIORITIES = {
  INPUT: 0,
  MOVEMENT: 10,
  COLLISION: 20,
  INTERACTION: 30,
  QUEST: 40,
  NARRATIVE: 50,
  ANIMATION: 60,
  CAMERA: 70,
  AUDIO: 80,
  SAVE: 90,
  RENDERING: 100
};

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

export function createCollisionSystem() {
  var COLLISION_LAYERS = { PLAYER: 1, WORLD: 2, INTERACTABLE: 4, WATER: 8, TRIGGER: 16 };
  return {
    componentId: 'CollisionSystem',
    update: function (context, delta) {
      var registry = context.componentRegistry;
      var colliders = registry.query(COMPONENTS.COLLIDER);
      for (var i = 0; i < colliders.length; i++) {
        var c = colliders[i];
        if (c.isTrigger) continue;
        if (c.layer === COLLISION_LAYERS.WATER) {
          var transform = registry.getComponent(c.entityId, COMPONENTS.TRANSFORM);
          if (!transform) continue;
          var pos = transform.position;
          var halfW = (c.size[0] || 1) / 2;
          var halfD = (c.size[2] || 1) / 2;
          transform._blocked = false;
        }
      }
    }
  };
}

export function createInteractionSystem() {
  return {
    componentId: 'InteractionSystem',
    _pendingInteraction: null,
    handleInteract: function (entityId, context) {
      var registry = context.componentRegistry;
      var interaction = registry.getComponent(entityId, COMPONENTS.INTERACTION);
      if (!interaction || !interaction.enabled) return;
      if (context.eventBus) {
        context.eventBus.emit('player:interacted', {
          entityId: entityId,
          actionId: interaction.actionId,
          prompt: interaction.prompt
        });
      }
    },
    update: function (context, delta) {
      var registry = context.componentRegistry;
      var interactions = registry.query(COMPONENTS.INTERACTION);
      var nearest = null;
      var bestDist = Infinity;
      for (var i = 0; i < interactions.length; i++) {
        var inter = interactions[i];
        if (!inter.enabled) continue;
        var transform = registry.getComponent(inter.entityId, COMPONENTS.TRANSFORM);
        if (!transform) continue;
        var dist = Math.sqrt(
          (transform.position[0] || 0) * (transform.position[0] || 0) +
          (transform.position[2] || 0) * (transform.position[2] || 0)
        );
        if (dist < inter.radius && dist < bestDist) {
          bestDist = dist;
          nearest = inter;
        }
      }
    }
  };
}

export function createAnimationSystem() {
  return {
    componentId: 'AnimationSystem',
    update: function (context, delta) {
      var registry = context.componentRegistry;
      var anims = registry.query(COMPONENTS.ANIMATION);
      for (var i = 0; i < anims.length; i++) {
        var anim = anims[i];
        var mv = registry.getComponent(anim.entityId, COMPONENTS.MOVEMENT);
        if (mv) {
          var speed = Math.sqrt(
            (mv.velocity[0] || 0) * (mv.velocity[0] || 0) +
            (mv.velocity[2] || 0) * (mv.velocity[2] || 0)
          );
          if (anim.currentState === 'IDLE' && speed > 0.5) {
            anim.currentState = 'WALK';
          } else if (anim.currentState === 'WALK' && speed <= 0.5) {
            anim.currentState = 'IDLE';
          }
        }
      }
    }
  };
}

export function createCameraSystem() {
  return {
    componentId: 'CameraSystem',
    initialize: function (context) {},
    update: function (context, delta) {}
  };
}

export function createNarrativeSystem() {
  return {
    componentId: 'NarrativeSystem',
    update: function (context, delta) {}
  };
}

export function createQuestSystem() {
  return {
    componentId: 'QuestSystem',
    update: function (context, delta) {}
  };
}

export function createAudioSystem() {
  return {
    componentId: 'AudioSystem',
    update: function (context, delta) {}
  };
}

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
    }
  };
}

export function createRenderingSystem() {
  return {
    componentId: 'RenderingSystem',
    update: function (context, delta) {}
  };
}

export function createInputSystem() {
  return {
    componentId: 'InputSystem',
    _keys: {},
    handleKeyDown: function (key) { this._keys[key] = true; },
    handleKeyUp: function (key) { this._keys[key] = false; },
    isPressed: function (key) { return !!this._keys[key]; },
    update: function () {}
  };
}
