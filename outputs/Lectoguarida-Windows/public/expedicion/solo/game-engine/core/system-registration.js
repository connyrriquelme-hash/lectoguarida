/**
 * system-registration.js
 * Registers all systems with correct priorities.
 */

import { createInputSystem } from '../systems/systems.js';
import { createMovementSystem } from '../systems/systems.js';
import { createCollisionSystem } from '../systems/systems.js';
import { createInteractionSystem } from '../systems/systems.js';
import { createAnimationSystem } from '../systems/systems.js';
import { createCameraSystem } from '../systems/systems.js';
import { createNarrativeSystem } from '../systems/systems.js';
import { createQuestSystem } from '../systems/systems.js';
import { createAudioSystem } from '../systems/audio-system.js';
import { createSaveSystem } from '../systems/save-system.js';
import { createRenderingSystem } from '../systems/rendering-system.js';

export function registerSystems(systemManager) {
  systemManager.addSystem(createInputSystem(), 0);
  systemManager.addSystem(createMovementSystem(), 10);
  systemManager.addSystem(createCollisionSystem(), 20);
  systemManager.addSystem(createInteractionSystem(), 30);
  systemManager.addSystem(createQuestSystem(), 40);
  systemManager.addSystem(createNarrativeSystem(), 50);
  systemManager.addSystem(createAudioSystem(), 60);
  systemManager.addSystem(createAnimationSystem(), 70);
  systemManager.addSystem(createCameraSystem(), 80);
  systemManager.addSystem(createRenderingSystem(), 90);
  systemManager.addSystem(createSaveSystem(), 100);
}