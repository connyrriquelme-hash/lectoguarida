/**
 * adventure-entry.js
 * Punto de entrada de la aventura. Se carga como módulo ES desde la ruta
 * /expedicion/solo/aventura. Reutiliza las APIs globales del menú solo.
 * FASE F.1: Integración de Game Engine V2 con feature flag.
 * Cuando ?engineV2=1 se usa el motor V2, sino el motor legacy.
 */

import { createAdventureEngine } from './adventure-engine.js';
import { isGameEngineV2Enabled } from '../game-engine/core/feature-flag.js';
import { createGameEngineV2 } from '../game-engine/engine-v2-entry.js';

var ADVENTURE_INSTANCE = null;
var V2_ENGINE_INSTANCE = null;

function getSession() {
  try {
    if (typeof loadSession === 'function') return loadSession();
  } catch (e) {}
  return null;
}

function getDifficulty() {
  try {
    if (typeof NonReaderDifficultyStore !== 'undefined') {
      var session = getSession();
      var id = session && session.studentProfileId ? session.studentProfileId : 'default-student';
      return NonReaderDifficultyStore.getDifficulty(id, 'non_reader');
    }
  } catch (e) {}
  return 'estandar';
}

export async function mountAdventure(container) {
  if (ADVENTURE_INSTANCE) {
    try { ADVENTURE_INSTANCE.destroy(); } catch (e) {}
    ADVENTURE_INSTANCE = null;
  }
  if (V2_ENGINE_INSTANCE) {
    try { V2_ENGINE_INSTANCE.destroy(); } catch (e) {}
    V2_ENGINE_INSTANCE = null;
  }

  var session = getSession();
  var studentProfileId = session && session.studentProfileId ? session.studentProfileId : 'default-student';

  var deps = {
    SoloGameAdapter: typeof SoloGameAdapter !== 'undefined' ? SoloGameAdapter : null,
    SoloProgressRepository: typeof SoloProgressRepository !== 'undefined' ? SoloProgressRepository : null,
    AudioManager: typeof AudioManager !== 'undefined' ? AudioManager : null,
    onExit: function () {
      window.history.pushState({}, '', '/expedicion/solo/no-lectores');
      if (typeof window.SoloRouter !== 'undefined' && window.SoloRouter.handleSoloRoute) {
        window.SoloRouter.handleSoloRoute();
      }
    }
  };

  var useEngineV2 = isGameEngineV2Enabled(window.location.search);
  var debugEngine = window.location.search.includes('debugEngine=1');

  if (useEngineV2) {
    await startEngineV2(container, studentProfileId, getDifficulty(), deps, debugEngine);
  } else {
    startLegacyAdventure(container, studentProfileId, getDifficulty(), deps);
  }
}

async function startEngineV2(container, studentProfileId, difficulty, deps, debug) {
  try {
    var worldModule = await import('./world-scene.js');
    var playerFactoryModule = await import('./player-factory.js');
    var guardianFactoryModule = await import('./guardian-factory.js');
    var companionFactoryModule = await import('./companion-factory.js');
    var collectibleFactoryModule = await import('./collectible-factory.js');
    var portalFactoryModule = await import('./portal-factory.js');
    var inputControllerModule = await import('./input-controller.js');
    var mobileControlsModule = await import('./mobile-controls.js');
    var narrativePanelModule = await import('./ui/narrative-panel.js');
    var captionControllerModule = await import('./ui/caption-controller.js');
    var dialogueManagerModule = await import('./dialogue-manager.js');
    var questManagerModule = await import('./quest-manager.js');
    var missionManagerModule = await import('./mission-manager.js');

    V2_ENGINE_INSTANCE = createGameEngineV2({
      container: container,
      studentProfileId: studentProfileId,
      difficulty: difficulty,
      searchParams: new URLSearchParams(window.location.search),
      debug: debug,
      deps: {
        THREE: (await import('./vendor/three.module.js')).default,
        AudioManager: deps.AudioManager,
        SoloProgressRepository: deps.SoloProgressRepository,
        SoloGameAdapter: deps.SoloGameAdapter,
        joystick: null,
        wasd: null,
        clickToMove: null,
        world: null,
        narrativePanel: null,
        captionController: null,
        dialogueManager: null
      }
    });

    var worldScene = worldModule.createWorldScene(container, { force: 'high' });
    if (worldScene.error) {
      throw new Error('WebGL error: ' + worldScene.error);
    }

    var playerFactory = playerFactoryModule.createPlayerFactory();
    var guardianFactory = guardianFactoryModule.createGuardianFactory();
    var companionFactory = companionFactoryModule.createCompanionFactory();
    var collectibleFactory = collectibleFactoryModule.createCollectibleFactory();
    var portalFactory = portalFactoryModule.createPortalFactory();
    var inputController = inputControllerModule.createInputController(window, { onKey: function () {}, onClick: function () {} });
    var mobileControls = mobileControlsModule.createMobileControls(container, {
      onInteract: function () {},
      onListen: function () {},
      onRepeat: function () {},
      onHint: function () {},
      onPause: function () {}
    });
    var narrativePanel = narrativePanelModule.createNarrativePanel(container);
    var captionController = captionControllerModule.createCaptionController(container);
    var dialogueManager = dialogueManagerModule.createDialogueManager({
      audio: { speak: function () {}, cancel: function () {}, repeat: function () {} },
      onChange: function () {},
      onAudioStart: function () {},
      onAudioEnd: function () {}
    });
    var questManager = questManagerModule.createQuestManager({});
    var missionManager = missionManagerModule.createMissionManager({ questManager: questManager });

    deps.world = worldScene;
    deps.joystick = mobileControls.getJoystickVector ? mobileControls : null;
    deps.wasd = inputController;
    deps.clickToMove = inputController;
    deps.narrativePanel = narrativePanel;
    deps.captionController = captionController;
    deps.dialogueManager = dialogueManager;

    V2_ENGINE_INSTANCE.deps = deps;
    V2_ENGINE_INSTANCE.worldScene = worldScene;

    var initialized = await V2_ENGINE_INSTANCE.initialize();
    if (!initialized) throw new Error('V2 Engine failed to initialize');

    var started = V2_ENGINE_INSTANCE.start();
    if (!started) throw new Error('V2 Engine failed to start');

    if (debug) {
      var debugOverlayModule = await import('../game-engine/debug/debug-overlay.js');
      var debugOverlay = debugOverlayModule.createDebugOverlay(document.body);
      debugOverlay.show();
      V2_ENGINE_INSTANCE.debugOverlay = debugOverlay;
      var context = V2_ENGINE_INSTANCE.getContext();
      var engine = V2_ENGINE_INSTANCE.getEngine();
      var updateDebug = function () {
        debugOverlay.update(context);
        if (engine.getState() !== 'DESTROYED') requestAnimationFrame(updateDebug);
      };
      requestAnimationFrame(updateDebug);
    }

    console.log('[Adventure] Game Engine V2 started');
  } catch (err) {
    console.error('[Adventure] V2 Engine failed to start, falling back to legacy:', err);
    if (V2_ENGINE_INSTANCE) {
      try { V2_ENGINE_INSTANCE.destroy(); } catch (e) {}
      V2_ENGINE_INSTANCE = null;
    }
    showFallbackOption(container, function () {
      startLegacyAdventure(container, studentProfileId, difficulty, deps);
    });
  }
}

function startLegacyAdventure(container, studentProfileId, difficulty, deps) {
  ADVENTURE_INSTANCE = createAdventureEngine({
    container: container,
    studentProfileId: studentProfileId,
    difficulty: difficulty,
    deps: deps
  });

  ADVENTURE_INSTANCE.start();
  console.log('[Adventure] Legacy engine started');
}

function showFallbackOption(container, onUseLegacy) {
  var fallbackDiv = document.createElement('div');
  fallbackDiv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;';
  fallbackDiv.innerHTML = '<h2>Error al iniciar Engine V2</h2><p>El motor experimental tuvo un problema.</p><button id="use-legacy" style="padding:12px 24px;font-size:16px;cursor:pointer;">Usar modo estable</button>';
  container.appendChild(fallbackDiv);
  document.getElementById('use-legacy').addEventListener('click', function () {
    fallbackDiv.remove();
    onUseLegacy();
  });
}

export function destroyAdventure() {
  if (ADVENTURE_INSTANCE) {
    try { ADVENTURE_INSTANCE.destroy(); } catch (e) {}
    ADVENTURE_INSTANCE = null;
  }
  if (V2_ENGINE_INSTANCE) {
    try { V2_ENGINE_INSTANCE.destroy(); } catch (e) {}
    V2_ENGINE_INSTANCE = null;
  }
}

export function getAdventureInstance() {
  return ADVENTURE_INSTANCE || V2_ENGINE_INSTANCE;
}

window.LectoguaridaAdventure = {
  mount: mountAdventure,
  destroy: destroyAdventure,
  getInstance: getAdventureInstance
};