/**
 * components.js
 * Base components for the Entity Component System.
 */

export var COMPONENTS = {
  TRANSFORM: 'transform',
  RENDER: 'render',
  MOVEMENT: 'movement',
  COLLIDER: 'collider',
  INTERACTION: 'interaction',
  ANIMATION: 'animation',
  CAMERA_TARGET: 'cameraTarget',
  AUDIO_EMITTER: 'audioEmitter',
  NARRATIVE_TRIGGER: 'narrativeTrigger',
  QUEST_TARGET: 'questTarget',
  SAVEABLE: 'saveable'
};

export function createTransformComponent(data) {
  return Object.assign({
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    parentId: null,
    worldMatrix: null
  }, data || {});
}

export function createRenderComponent(data) {
  return Object.assign({
    object3D: null,
    visible: true,
    layer: 0,
    castShadow: false,
    receiveShadow: false
  }, data || {});
}

export function createMovementComponent(data) {
  return Object.assign({
    speed: 5,
    direction: [0, 0, 0],
    velocity: [0, 0, 0],
    cameraRelative: true,
    enabled: true
  }, data || {});
}

export function createColliderComponent(data) {
  return Object.assign({
    shape: 'sphere',
    radius: 0.5,
    size: [1, 1, 1],
    layer: 0,
    mask: 0xFFFF,
    isTrigger: false
  }, data || {});
}

export function createInteractionComponent(data) {
  return Object.assign({
    radius: 3,
    prompt: 'Interactuar',
    enabled: true,
    actionId: 'interact'
  }, data || {});
}

export function createAnimationComponent(data) {
  return Object.assign({
    currentState: 'IDLE',
    parameters: {},
    transitions: []
  }, data || {});
}

export function createCameraTargetComponent(data) {
  return Object.assign({
    offset: [0, 2, 5],
    priority: 0
  }, data || {});
}

export function createAudioEmitterComponent(data) {
  return Object.assign({
    cueId: null,
    spatial: false,
    volume: 1
  }, data || {});
}

export function createNarrativeTriggerComponent(data) {
  return Object.assign({
    sceneId: null,
    once: false,
    triggerType: 'interact'
  }, data || {});
}

export function createQuestTargetComponent(data) {
  return Object.assign({
    questId: null,
    objectiveId: null,
    state: 'inactive'
  }, data || {});
}

export function createSaveableComponent(data) {
  return Object.assign({
    fields: [],
    persistenceKey: null
  }, data || {});
}
