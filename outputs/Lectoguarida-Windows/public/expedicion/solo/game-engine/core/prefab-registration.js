/**
 * prefab-registration.js
 * Registers all 10 real prefabs with full component data.
 */

export function registerPrefabs(prefabRegistry, deps) {
  if (!prefabRegistry || !prefabRegistry.registerPrefab) return;

  deps = deps || {};
  var THREE = deps.THREE;
  var createPlayerFactory = deps.createPlayerFactory;
  var createGuardianFactory = deps.createGuardianFactory;
  var createCompanionFactory = deps.createCompanionFactory;
  var createCollectibleFactory = deps.createCollectibleFactory;
  var createPortalFactory = deps.createPortalFactory;

  // --- player-lumi ---
  prefabRegistry.registerPrefab('player-lumi', {
    id: 'player-lumi',
    name: 'Lumi',
    components: {
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      render: { visible: true, layer: 0 },
      movement: { speed: 6, enabled: true },
      collider: { shape: 'capsule', radius: 0.5, height: 1.8, isTrigger: false },
      interaction: { radius: 3, prompt: 'Interactuar', enabled: true },
      animation: { currentState: 'IDLE' },
      cameraTarget: { offset: [0, 2, 5], priority: 10 },
      narrativeTrigger: { sceneId: null, once: false },
      questTarget: { questId: null, state: 'active' },
      saveable: { fields: ['transform', 'animation', 'questTarget'], persistenceKey: 'player' }
    }
  });

  // --- player-tilo ---
  prefabRegistry.registerPrefab('player-tilo', {
    id: 'player-tilo',
    name: 'Tilo',
    components: {
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      render: { visible: true, layer: 0 },
      movement: { speed: 6, enabled: true },
      collider: { shape: 'capsule', radius: 0.5, height: 1.8, isTrigger: false },
      interaction: { radius: 3, prompt: 'Interactuar', enabled: true },
      animation: { currentState: 'IDLE' },
      cameraTarget: { offset: [0, 2, 5], priority: 10 },
      narrativeTrigger: { sceneId: null, once: false },
      questTarget: { questId: null, state: 'active' },
      saveable: { fields: ['transform', 'animation', 'questTarget'], persistenceKey: 'player' }
    }
  });

  // --- player-nara ---
  prefabRegistry.registerPrefab('player-nara', {
    id: 'player-nara',
    name: 'Nara',
    components: {
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      render: { visible: true, layer: 0 },
      movement: { speed: 6, enabled: true },
      collider: { shape: 'capsule', radius: 0.5, height: 1.8, isTrigger: false },
      interaction: { radius: 3, prompt: 'Interactuar', enabled: true },
      animation: { currentState: 'IDLE' },
      cameraTarget: { offset: [0, 2, 5], priority: 10 },
      narrativeTrigger: { sceneId: null, once: false },
      questTarget: { questId: null, state: 'active' },
      saveable: { fields: ['transform', 'animation', 'questTarget'], persistenceKey: 'player' }
    }
  });

  // --- player-bimo ---
  prefabRegistry.registerPrefab('player-bimo', {
    id: 'player-bimo',
    name: 'Bimo',
    components: {
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      render: { visible: true, layer: 0 },
      movement: { speed: 6, enabled: true },
      collider: { shape: 'capsule', radius: 0.5, height: 1.8, isTrigger: false },
      interaction: { radius: 3, prompt: 'Interactuar', enabled: true },
      animation: { currentState: 'IDLE' },
      cameraTarget: { offset: [0, 2, 5], priority: 10 },
      narrativeTrigger: { sceneId: null, once: false },
      questTarget: { questId: null, state: 'active' },
      saveable: { fields: ['transform', 'animation', 'questTarget'], persistenceKey: 'player' }
    }
  });

  // --- lumiercoles-companion ---
  prefabRegistry.registerPrefab('lumiercoles-companion', {
    id: 'lumiercoles-companion',
    name: 'Lumiércoles',
    components: {
      transform: { position: [2, 1.8, 2], rotation: [0, 0, 0], scale: [1, 1, 1] },
      render: { visible: true, layer: 0 },
      movement: { speed: 4, enabled: true },
      collider: { shape: 'sphere', radius: 0.4, isTrigger: false },
      animation: { currentState: 'FOLLOW' },
      cameraTarget: { offset: [0, 1.5, 3], priority: 0 }
    }
  });

  // --- rina-guardian ---
  prefabRegistry.registerPrefab('rina-guardian', {
    id: 'rina-guardian',
    name: 'Rina',
    components: {
      transform: { position: [0, 0, -22], rotation: [0, 0, 0], scale: [1, 1, 1] },
      render: { visible: true, layer: 0 },
      collider: { shape: 'capsule', radius: 0.8, height: 2, isTrigger: true },
      interaction: { radius: 4, prompt: 'Hablar con Rina', enabled: true, actionId: 'talk-rina' },
      narrativeTrigger: { sceneId: 'encuentro-rina', once: false, triggerType: 'interact' },
      questTarget: { questId: 'chapter-01', objectiveId: 'meet-rina', state: 'active' },
      audioEmitter: { cueId: 'rina-voice', spatial: true, volume: 1 }
    }
  });

  // --- lagoon-bell ---
  prefabRegistry.registerPrefab('lagoon-bell', {
    id: 'lagoon-bell',
    name: 'Campana de la Laguna',
    components: {
      transform: { position: [0, 0.4, -40], rotation: [0, 0, 0], scale: [1, 1, 1] },
      render: { visible: true, layer: 0, castShadow: true },
      collider: { shape: 'sphere', radius: 1.2, isTrigger: true },
      interaction: { radius: 3, prompt: 'Tocar campana', enabled: true, actionId: 'ring-bell' },
      questTarget: { questId: 'chapter-01', objectiveId: 'collect-bell-01', state: 'inactive' },
      animation: { currentState: 'IDLE', parameters: { sway: 0.1 } },
      saveable: { fields: ['transform', 'questTarget'], persistenceKey: 'bell-01' }
    }
  });

  // --- plaza-kiosk ---
  prefabRegistry.registerPrefab('plaza-kiosk', {
    id: 'plaza-kiosk',
    name: 'Quiosco de la Plaza',
    components: {
      transform: { position: [10, 0, 5], rotation: [0, 0, 0], scale: [2, 2, 2] },
      render: { visible: true, layer: 0, castShadow: true, receiveShadow: true },
      collider: { shape: 'box', size: [4, 5, 4], isTrigger: false }
    }
  });

  // --- plaza-tree ---
  prefabRegistry.registerPrefab('plaza-tree', {
    id: 'plaza-tree',
    name: 'Árbol de la Plaza',
    components: {
      transform: { position: [-15, 0, 8], rotation: [0, 0, 0], scale: [1.5, 1.5, 1.5] },
      render: { visible: true, layer: 0, castShadow: true, receiveShadow: true },
      collider: { shape: 'cylinder', radius: 1.5, height: 8, isTrigger: false }
    }
  });

  // --- challenge-portal ---
  prefabRegistry.registerPrefab('challenge-portal', {
    id: 'challenge-portal',
    name: 'Portal de Desafío',
    components: {
      transform: { position: [0, 0, -30], rotation: [0, 0, 0], scale: [1, 1, 1] },
      render: { visible: true, layer: 0 },
      collider: { shape: 'sphere', radius: 2, isTrigger: true },
      interaction: { radius: 3, prompt: 'Iniciar desafío', enabled: true, actionId: 'start-challenge' },
      questTarget: { questId: 'chapter-01', objectiveId: 'complete-rhyme-catcher', state: 'inactive' }
    }
  });
}