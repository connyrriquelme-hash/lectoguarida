/**
 * component-registration.js
 * Registers all 11 base component types with the ComponentRegistry.
 */

import { COMPONENTS } from '../components/components.js';

export function registerComponents(componentRegistry) {
  if (!componentRegistry || !componentRegistry.registerType) return;

  componentRegistry.registerType(COMPONENTS.TRANSFORM, createTransformComponent);
  componentRegistry.registerType(COMPONENTS.RENDER, createRenderComponent);
  componentRegistry.registerType(COMPONENTS.MOVEMENT, createMovementComponent);
  componentRegistry.registerType(COMPONENTS.COLLIDER, createColliderComponent);
  componentRegistry.registerType(COMPONENTS.INTERACTION, createInteractionComponent);
  componentRegistry.registerType(COMPONENTS.ANIMATION, createAnimationComponent);
  componentRegistry.registerType(COMPONENTS.CAMERA_TARGET, createCameraTargetComponent);
  componentRegistry.registerType(COMPONENTS.AUDIO_EMITTER, createAudioEmitterComponent);
  componentRegistry.registerType(COMPONENTS.NARRATIVE_TRIGGER, createNarrativeTriggerComponent);
  componentRegistry.registerType(COMPONENTS.QUEST_TARGET, createQuestTargetComponent);
  componentRegistry.registerType(COMPONENTS.SAVEABLE, createSaveableComponent);
}

function createTransformComponent(data) {
  return Object.assign({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    parentId: null,
    worldMatrix: null
  }, data || {});
}

function createRenderComponent(data) {
  return Object.assign({
    object3D: null,
    visible: true,
    layer: 0,
    castShadow: false,
    receiveShadow: false
  }, data || {});
}

function createMovementComponent(data) {
  return Object.assign({
    speed: 5,
    direction: [0, 0, 0],
    velocity: [0, 0, 0],
    cameraRelative: true,
    enabled: true
  }, data || {});
}

function createColliderComponent(data) {
  return Object.assign({
    shape: 'sphere',
    radius: 0.5,
    size: [1, 1, 1],
    layer: 0,
    mask: 0xFFFF,
    isTrigger: false
  }, data || {});
}

function createInteractionComponent(data) {
  return Object.assign({
    radius: 3,
    prompt: 'Interactuar',
    enabled: true,
    actionId: 'interact'
  }, data || {});
}

function createAnimationComponent(data) {
  return Object.assign({
    currentState: 'IDLE',
    parameters: {},
    transitions: []
  }, data || {});
}

function createCameraTargetComponent(data) {
  return Object.assign({
    offset: [0, 2, 5],
    priority: 0
  }, data || {});
}

function createAudioEmitterComponent(data) {
  return Object.assign({
    cueId: null,
    spatial: false,
    volume: 1
  }, data || {});
}

function createNarrativeTriggerComponent(data) {
  return Object.assign({
    sceneId: null,
    once: false,
    triggerType: 'interact'
  }, data || {});
}

function createQuestTargetComponent(data) {
  return Object.assign({
    questId: null,
    objectiveId: null,
    state: 'inactive'
  }, data || {});
}

function createSaveableComponent(data) {
  return Object.assign({
    fields: [],
    persistenceKey: null
  }, data || {});
}