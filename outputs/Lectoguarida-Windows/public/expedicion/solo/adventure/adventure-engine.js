/**
 * adventure-engine.js
 * Motor principal de la aventura isométrica Lectoguarida.
 * Orquesta estado, mundo 3D, personaje, guardianes, coleccionables, misiones,
 * audio, progreso y fallback 2D.
 */

import * as THREE from './vendor/three.module.js';
import { createStateMachine, AdventureState } from './adventure-state-machine.js';
import { createQualityManager } from './quality-manager.js';
import { createWorldScene } from './world-scene.js';
import { createPlayerFactory } from './player-factory.js';
import { createGuardianFactory } from './guardian-factory.js';
import { createCompanionFactory } from './companion-factory.js';
import { createNeblinController } from './neblin-controller.js';
import { createCollectibleFactory } from './collectible-factory.js';
import { createPortalFactory } from './portal-factory.js';
import { createPlayerController } from './player-controller.js';
import { createInputController } from './input-controller.js';
import { createInteractionController } from './interaction-controller.js';
import { createMobileControls } from './mobile-controls.js';
import { createAccessibilityController } from './accessibility-controller.js';
import { createDialogueManager } from './dialogue-manager.js';
import { createQuestManager } from './quest-manager.js';
import { createMissionManager } from './mission-manager.js';
import { createChallengeAdapter } from './challenge-adapter.js';
import { createProgressAdapter } from './progress-adapter.js';
import { createAudioAdapter } from './audio-adapter.js';
import { createFallback2D } from './fallback-2d.js';
import { ADVENTURE_CSS } from './adventure.css.js';
import { createUIRoot } from './ui/ui-root.js';
import { CHAPTER_01, ZONES, GUARDIANS, COMPANION, WORLD_REGIONS, REFINED_CHARACTERS, BACKPACK_SLOTS, ADVENTURE_REWARDS } from './adventure-config.js';
import { MISSION_COLLECTIBLES } from './data/collectibles.js';
import { DIALOGUE } from './data/dialogue-es-cl.js';

export function createAdventureEngine(options) {
  options = options || {};
  var container = options.container;
  var deps = options.deps || {};
  var studentProfileId = options.studentProfileId || 'default-student';
  var readerProfile = 'non_reader';

  var stateMachine = createStateMachine(AdventureState.BOOTING);
  var quality = createQualityManager({ force: options.quality });
  var audio = createAudioAdapter({ AudioManager: deps.AudioManager });
  var progress = createProgressAdapter({
    SoloProgressRepository: deps.SoloProgressRepository,
    readerProfile: readerProfile,
    studentProfileId: studentProfileId
  });

  var cssInjected = false;
  function injectCss() {
    if (cssInjected) return;
    var style = document.createElement('style');
    style.id = 'adv-css';
    style.textContent = ADVENTURE_CSS;
    document.head.appendChild(style);
    cssInjected = true;
  }

  var root = null;
  var world = null;
  var player = null;
  var playerController = null;
  var guardian = null;
  var companion = null;
  var neblinController = null;
  var collectibles = [];
  var portals = [];
  var inputController = null;
  var interaction = null;
  var mobileControls = null;
  var accessibility = createAccessibilityController({});
  var questManager = createQuestManager(CHAPTER_01.mission);
  var dialogue = createDialogueManager({ audio: audio, onChange: onDialogueChange });
  var missionManager = null;
  var challenge = createChallengeAdapter({
    SoloGameAdapter: deps.SoloGameAdapter,
    AudioManager: deps.AudioManager,
    onResult: onChallengeResult
  });
  var fallback = null;

  var hud = {};
  var uiRoot = null;
  var lastT = 0;
  var destroyed = false;

  function injectRoot() {
    injectCss();
    root = document.createElement('div');
    root.className = 'adv-root';
    root.setAttribute('role', 'application');
    root.setAttribute('aria-label', 'Aventura Lectoguarida');
    container.appendChild(root);
    accessibility.applyReducedMotion(root);
  }

  function buildHud() {
    root.classList.add('hud-active');
    var header = document.createElement('div');
    header.className = 'adv-hud-header';
    header.innerHTML = '<div class="adv-logo">Lectoguarida Aventuras</div>' +
      '<div class="adv-stars" id="adv-stars">⭐ ' + progress.getStars() + '</div>';
    root.appendChild(header);

    var missionPanel = document.createElement('div');
    missionPanel.className = 'adv-mission-panel';
    missionPanel.id = 'adv-mission-panel';
    missionPanel.innerHTML = '<h3 id="adv-mission-title">El eco de la laguna</h3>' +
      '<p id="adv-mission-desc">Explora la laguna y encuentra las campanas.</p>' +
      '<div class="adv-progress"><div id="adv-progress-bar" style="width:0%"></div></div>';
    root.appendChild(missionPanel);

    var dialogueEl = document.createElement('div');
    dialogueEl.className = 'adv-dialogue';
    dialogueEl.id = 'adv-dialogue';
    dialogueEl.style.display = 'none';
    dialogueEl.innerHTML = '<div class="speaker" id="adv-dlg-speaker"></div>' +
      '<div class="line" id="adv-dlg-line"></div>' +
      '<div class="actions">' +
      '<button class="adv-btn" id="adv-dlg-listen">♪ Escuchar</button>' +
      '<button class="adv-btn secondary" id="adv-dlg-next">Continuar</button></div>';
    root.appendChild(dialogueEl);

    var live = document.createElement('div');
    live.className = 'adv-live';
    live.setAttribute('aria-live', 'polite');
    live.id = 'adv-live';
    root.appendChild(live);

    var minimap = document.createElement('div');
    minimap.className = 'adv-minimap';
    minimap.id = 'adv-minimap';
    minimap.setAttribute('aria-hidden', 'true');
    root.appendChild(minimap);

    var backBtn = document.createElement('button');
    backBtn.className = 'adv-btn secondary';
    backBtn.style.cssText = 'position:absolute;bottom:18px;left:14px;';
    backBtn.textContent = '← Salir';
    backBtn.addEventListener('click', function () { destroy(); if (deps.onExit) deps.onExit(); });
    root.appendChild(backBtn);

    hud = {
      header: header, stars: header.querySelector('#adv-stars'),
      missionPanel: missionPanel, title: missionPanel.querySelector('#adv-mission-title'),
      desc: missionPanel.querySelector('#adv-mission-desc'), progressBar: missionPanel.querySelector('#adv-progress-bar'),
      dialogue: dialogueEl, speaker: dialogueEl.querySelector('#adv-dlg-speaker'),
      line: dialogueEl.querySelector('#adv-dlg-line'),
      listen: dialogueEl.querySelector('#adv-dlg-listen'),
      next: dialogueEl.querySelector('#adv-dlg-next'),
      live: live, minimap: minimap, back: backBtn
    };

    hud.listen.addEventListener('click', function () {
      var cur = dialogue.current();
      if (cur) audio.repeat(cur.text);
    });
    hud.next.addEventListener('click', function () {
      dialogue.next();
    });

    // Archipiélago UI: action bar, minimap, world map, backpack, reward, character, pause
    var saved = progress.loadAdventure();
    var regionStates = WORLD_REGIONS.map(function (r) {
      var st = progress.getRegionState(r.id) || r.state;
      return { id: r.id, name: r.name, state: st, discovered: st === 'DISCOVERED' || st === 'ACTIVE' };
    });
    uiRoot = createUIRoot({
      container: root,
      regions: regionStates,
      characters: REFINED_CHARACTERS.map(function (c) {
        return { id: c.id, name: c.name, motif: c.motif, tagline: c.tagline };
      }),
      backpackItems: (saved.backpack || []).map(mapBackpackItem).slice(0, BACKPACK_SLOTS),
      maxSlots: BACKPACK_SLOTS,
      callbacks: {
        onAction: function (id) {
          if (id === 'escuchar') { var cur = dialogue.current(); if (cur) audio.repeat(cur.text); }
          else if (id === 'repetir') { var cur2 = dialogue.current(); if (cur2) audio.repeat(cur2.text); }
          else if (id === 'pista') { onActionHint(); }
          else if (id === 'interactuar') { if (interaction) interaction.triggerNearest(); }
        },
        onRegionSelect: function (id) { selectRegion(id); },
        onCharacterSelect: function (id) { progress.saveAdventure({ characterId: id }); },
        onToggleLabels: function (on) { accessibility.setLabels(on); },
        onRestartZone: function () { restartZone(); },
        onPanelOpen: function (name) { if (name === 'world') progress.recordMetric('world_map_opened'); else if (name === 'backpack') progress.recordMetric('backpack_opened'); }
      }
    });
  }

  function onActionHint() {
    var hint = questManager.currentHint ? questManager.currentHint() : null;
    if (hint) accessibility.announce(hud.live, hint);
  }

  function selectRegion(id) {
    var reg = null;
    for (var i = 0; i < WORLD_REGIONS.length; i++) if (WORLD_REGIONS[i].id === id) reg = WORLD_REGIONS[i];
    if (!reg || (reg.state !== 'ACTIVE' && reg.state !== 'DISCOVERED')) return;
    progress.recordMetric('region_selected');
  }

  function restartZone() {
    if (missionManager) missionManager.restart();
    stateMachine.transition(AdventureState.EXPLORING);
  }

  function onDialogueChange(current, done) {
    if (done) {
      hud.dialogue.style.display = 'none';
      stateMachine.transition(AdventureState.EXPLORING);
      return;
    }
    if (!current) return;
    hud.dialogue.style.display = 'block';
    hud.speaker.textContent = current.speaker || '';
    hud.line.textContent = current.text;
    accessibility.announce(hud.live, (current.speaker ? current.speaker + ': ' : '') + current.text);
  }

  function showCharacterSelect() {
    stateMachine.transition(AdventureState.CHARACTER_SELECT);
    var saved = progress.loadAdventure().characterId;
    var sel = document.createElement('div');
    sel.className = 'adv-character-select';
    sel.id = 'adv-char-select';
    sel.innerHTML = '<h2>Elige tu explorador</h2>';
    var grid = document.createElement('div');
    grid.className = 'adv-character-grid';
    [['lumi', 'Lumi', '#6fcf97'], ['tilo', 'Tilo', '#4c8bf5'], ['nara', 'Nara', '#9b6dff'], ['bimo', 'Bimo', '#3fb8af']].forEach(function (c) {
      var card = document.createElement('button');
      card.className = 'adv-character-card' + (c[0] === saved ? ' selected' : '');
      card.setAttribute('aria-label', 'Elegir ' + c[1]);
      card.innerHTML = '<div style="width:48px;height:48px;border-radius:50%;background:' + c[2] + ';margin:0 auto;"></div>' +
        '<div class="name">' + c[1] + '</div>';
      card.addEventListener('click', function () {
        grid.querySelectorAll('.adv-character-card').forEach(function (el) { el.classList.remove('selected'); });
        card.classList.add('selected');
        selectedCharacter = c[0];
      });
      grid.appendChild(card);
    });
    sel.appendChild(grid);
    var go = document.createElement('button');
    go.className = 'adv-btn';
    go.textContent = 'Comenzar aventura';
    go.addEventListener('click', function () {
      if (!selectedCharacter) selectedCharacter = 'lumi';
      progress.setCharacter(selectedCharacter);
      if (sel.parentNode) sel.parentNode.removeChild(sel);
      startWorld();
    });
    sel.appendChild(go);
    root.appendChild(sel);
  }

  var selectedCharacter = null;

  function startWorld() {
    stateMachine.transition(AdventureState.LOADING);
    var saved = progress.loadAdventure();
    if (!selectedCharacter) selectedCharacter = saved.characterId || 'lumi';

    audio.setSupportRate(options.difficulty || saved.difficulty || 'estandar');

    world = createWorldScene(root, quality);
    if (world.error) {
      startFallback();
      return;
    }
    var THREE_ = world.getThree();

    var playerFactory = createPlayerFactory();
    player = playerFactory.create(selectedCharacter);
    player.position.set(0, 0, 0);
    world.add(player);
    world.setPlayerTarget(player);
    playerController = createPlayerController(player, world.cameraController);

    var guardianFactory = createGuardianFactory();
    guardian = guardianFactory.create('rina');
    if (guardian) { guardian.position.set(0, 0, -22); world.add(guardian); }

    var companionFactory = createCompanionFactory();
    companion = companionFactory.create();
    companion.position.set(2, 1.8, 2);
    world.add(companion);

    neblinController = createNeblinController(THREE_);
    var neblinState = progress.getNeblin() || 'NEBLIN_DENSE';
    neblinController.setState(neblinState);
    world.add(neblinController.root);

    var portalFactory = createPortalFactory();
    ZONES.forEach(function (z) {
      if (z.portal) {
        var p = portalFactory.createForZone(z);
        if (p) { p.position.set(z.position.x, 0, z.position.z); world.add(p); portals.push(p); }
      }
    });

    var collectibleFactory = createCollectibleFactory();
    var spawns = missionManager ? missionManager.spawnCollectibles() : MISSION_COLLECTIBLES.map(function (c) {
      return { id: c.id, kind: c.kind, position: c.position };
    });
    var alreadyFound = saved.collectiblesFound || [];
    spawns.forEach(function (c) {
      var col = collectibleFactory.create(c.kind, c.id);
      col.position.set(c.position.x, 0.4, c.position.z);
      if (alreadyFound.indexOf(c.id) >= 0) { col.userData.collected = true; col.visible = false; }
      world.add(col);
      collectibles.push(col);
    });

    inputController = createInputController(window, {
      onKey: onKey,
      onClick: function () {}
    });
    inputController.attach();

    interaction = createInteractionController(world.camera, world.renderer.domElement, world.scene);
    interaction.setInteractables(buildInteractables());
    interaction.setOnSelect(onInteractableSelected);

    world.renderer.domElement.addEventListener('click', function (e) {
      interaction.handlePointer(e.clientX, e.clientY);
    });
    world.renderer.domElement.setAttribute('role', 'img');
    world.renderer.domElement.setAttribute('aria-label', 'Mundo 3D del Humedal de las Palabras. Usa el panel de botones para avanzar.');

    if (isTouchDevice()) {
      mobileControls = createMobileControls(root, {
        onInteract: function () { tryInteractNearby(); },
        onListen: function () { var cur = dialogue.current(); if (cur) audio.speak(cur.text); },
        onRepeat: function () { var cur = dialogue.current(); if (cur) audio.repeat(cur.text); },
        onHint: function () { audio.speak(DIALOGUE.rina.hint); },
        onPause: function () { togglePause(); }
      });
    }

    world.onFrame(function (dt, t) {
      var dir = inputController.getMoveVector();
      var joy = mobileControls ? mobileControls.getJoystickVector() : { x: 0, z: 0 };
      if (dir.x === 0 && dir.z === 0 && (joy.x !== 0 || joy.z !== 0)) {
        dir = { x: joy.x, z: joy.z };
      }
      if (stateMachine.is(AdventureState.EXPLORING)) {
        playerController.move(dir, dt);
        var moving = playerController.update(dt);
        playerFactory.animate(player, moving ? 'walk' : 'idle', t);
      }
      if (playerFactory) playerFactory.animate(player, stateMachine.is(AdventureState.EXPLORING) ? (playerController.getVelocity().x || playerController.getVelocity().z ? 'walk' : 'idle') : 'idle', t);
      if (guardianFactory && guardian) guardian.rotation.y = Math.sin(t) * 0.1;
      if (companionFactory && companion) companionFactory.animate(companion, t, player ? player.position : null);
      if (neblinController) neblinController.animate(t);
      collectibles.forEach(function (c) { if (!c.userData.collected) collectibleFactory.animate(c, t); });
      portals.forEach(function (p) { portalFactory.animate(p, t); });
      if (stateMachine.is(AdventureState.MISSION_COMPLETE)) playerFactory.celebrate(player, t);
    });

    world.start();
    stateMachine.transition(AdventureState.INTRO);
    startIntro();
  }

  function buildInteractables() {
    var list = [];
    if (guardian) list.push(guardian);
    collectibles.forEach(function (c) { if (!c.userData.collected) list.push(c); });
    portals.forEach(function (p) { list.push(p); });
    return list;
  }

  function startIntro() {
    var lines = DIALOGUE.intro.lumiercoles;
    dialogue.start(lines, 'Lumiércoles');
  }

  function onKey(key, e) {
    if (key === 'Enter' || key === ' ') {
      if (stateMachine.is(AdventureState.DIALOGUE)) { dialogue.next(); return; }
      if (stateMachine.is(AdventureState.EXPLORING)) { tryInteractNearby(); return; }
    }
    if (key === 'Escape') { togglePause(); }
    if (key === 'r' || key === 'R') { var cur = dialogue.current(); if (cur) audio.repeat(cur.text); }
  }

  function tryInteractNearby() {
    if (!player) return;
    var nearest = null;
    var best = 4;
    if (guardian) { var d = dist(player.position, guardian.position); if (d < best) { best = d; nearest = guardian; } }
    collectibles.forEach(function (c) {
      if (c.userData.collected) return;
      var dc = dist(player.position, c.position);
      if (dc < best) { best = dc; nearest = c; }
    });
    if (nearest) onInteractableSelected(nearest);
  }

  function onInteractableSelected(obj) {
    if (!obj) return;
    if (obj.userData.collectibleId) {
      collectCollectible(obj);
    } else if (obj.userData.guardianId) {
      talkToGuardian(obj.userData.guardianId);
    } else if (obj.userData.zoneId) {
      openZonePortal(obj);
    }
  }

  function collectCollectible(obj) {
    if (obj.userData.collected) return;
    var isNew = questManager.collect(obj.userData.collectibleId);
    if (!isNew) return;
    obj.userData.collected = true;
    obj.visible = false;
    progress.markCollectible(obj.userData.collectibleId);
    audio.speak('¡Encontraste una campana!');
    updateProgressHud();
    interaction.setInteractables(buildInteractables());
    if (questManager.isComplete() && !stateMachine.is(AdventureState.MISSION_COMPLETE)) {
      openChallenge();
    }
  }

  function talkToGuardian(guardianId) {
    if (stateMachine.is(AdventureState.MISSION_COMPLETE)) {
      audio.speak(DIALOGUE.rina.missionComplete[0]);
      return;
    }
    missionManager.startMission();
  }

  function openZonePortal(portal) {
    if (portal.userData.locked && !portal.userData.upcoming) return;
    var gameId = portal.userData.gameId;
    if (portal.userData.upcoming) {
      audio.speak('Próxima misión. ¡Pronto disponible!');
      return;
    }
    openChallenge(gameId);
  }

  function openChallenge(gameId) {
    gameId = gameId || CHAPTER_01.mission.gameId;
    stateMachine.transition(AdventureState.CHALLENGE_LOADING);
    audio.cancel();
    var challengeContainer = document.createElement('div');
    challengeContainer.id = 'adv-challenge';
    challengeContainer.style.cssText = 'position:absolute;inset:0;background:rgba(255,255,255,0.97);z-index:60;overflow:auto;';
    root.appendChild(challengeContainer);
    stateMachine.transition(AdventureState.CHALLENGE);
    if (playerController) playerController.setEnabled(false);
    if (inputController) inputController.setEnabled(false);

    var result = challenge.open({
      gameId: gameId,
      difficulty: options.difficulty || progress.loadAdventure().difficulty || 'estandar',
      studentProfileId: studentProfileId,
      missionId: CHAPTER_01.mission.id,
      rewardId: CHAPTER_01.mission.rewardId,
      container: challengeContainer,
      returnPath: '/expedicion/solo/no-lectores'
    });
    if (!result) {
      if (challengeContainer.parentNode) challengeContainer.parentNode.removeChild(challengeContainer);
      resumeAfterChallenge();
    }
  }

  function onChallengeResult(res) {
    var el = document.getElementById('adv-challenge');
    if (el && el.parentNode) el.parentNode.removeChild(el);
    if (res && res.completed) {
      var firstTime = progress.addReward(res.rewardId);
      var gained = 3;
      progress.addStars(gained);
      progress.completeMission(res.missionId);
      audio.speak('¡Muy bien! Recuperaste una página del Gran Libro.');
      updateStarsHud();
      missionManager.onCollectibleFound('__challenge__');
      onMissionComplete();
    } else {
      audio.speak('Probemos nuevamente. Escucha otra vez.');
    }
    resumeAfterChallenge();
  }

  function onMissionComplete() {
    // Descubrir Península de Llolleo y despejar la Neblín de la zona inicial
    var llolleo = findRegion('peninsula-llolleo');
    if (llolleo && llolleo.state !== 'DISCOVERED') {
      llolleo.state = 'DISCOVERED';
      progress.saveRegionState('peninsula-llolleo', 'DISCOVERED');
      progress.recordMetric('region_discovered');
      if (uiRoot) uiRoot.setRegions(WORLD_REGIONS.map(function (r) { return { id: r.id, name: r.name, state: r.state }; }));
    }
    if (progress.getNeblin() !== 'NEBLIN_FRIENDLY') {
      progress.setNeblin('NEBLIN_FRIENDLY');
      progress.recordMetric('fog_cleared');
      if (neblinController) neblinController.setState('NEBLIN_FRIENDLY');
    }
    // Broche de Rina (cosmético, no repetible)
    var broche = progress.getRewardById('broche-rina');
    if (broche && progress.addReward('broche-rina') && uiRoot) {
      uiRoot.showReward(broche);
      progress.recordMetric('reward_viewed');
    }
    // Mochila: añadir página del capítulo 1
    var backpack = progress.getBackpack();
    if (backpack.length < BACKPACK_SLOTS && backpack.indexOf('pagina-capitulo-01') < 0) {
      backpack.push('pagina-capitulo-01');
      progress.setBackpack(backpack);
      if (uiRoot) uiRoot.setBackpack(backpack.map(mapBackpackItem));
    }
  }

  function mapBackpackItem(id) {
    var reward = progress.getRewardById(id);
    return reward ? { id: id, name: reward.name, icon: reward.icon } : { id: id, name: id, icon: '★' };
  }

  function findRegion(id) {
    for (var i = 0; i < WORLD_REGIONS.length; i++) if (WORLD_REGIONS[i].id === id) return WORLD_REGIONS[i];
    return null;
  }

  function resumeAfterChallenge() {
    stateMachine.transition(AdventureState.RETURNING);
    if (playerController) playerController.setEnabled(true);
    if (inputController) inputController.setEnabled(true);
    stateMachine.transition(AdventureState.EXPLORING);
  }

  function togglePause() {
    if (stateMachine.is(AdventureState.PAUSED)) {
      if (world) world.resume();
      stateMachine.transition(AdventureState.EXPLORING);
    } else if (stateMachine.is(AdventureState.EXPLORING) || stateMachine.is(AdventureState.DIALOGUE)) {
      if (world) world.pause();
      stateMachine.transition(AdventureState.PAUSED);
      audio.cancel();
    }
  }

  function startFallback() {
    stateMachine.transition(AdventureState.ERROR);
    fallback = createFallback2D(root, {
      audio: audio, progress: progress,
      onComplete: function (res) { updateStarsHud(); },
      onBack: function () { destroy(); if (deps.onExit) deps.onExit(); }
    });
    fallback.mount();
    audio.speak(DIALOGUE.errors.noWebGL);
  }

  function updateProgressHud() {
    var p = questManager.progress();
    if (hud.progressBar) hud.progressBar.style.width = (p.ratio * 100) + '%';
  }
  function updateStarsHud() {
    if (hud.stars) hud.stars.textContent = '⭐ ' + progress.getStars();
  }

  function dist(a, b) {
    var dx = a.x - b.x, dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
  function isTouchDevice() {
    try { return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0); } catch (e) { return false; }
  }

  function start() {
    if (destroyed) return;
    injectRoot();
    buildHud();
    missionManager = createMissionManager({
      questManager: questManager, audio: audio, dialogue: dialogue,
      onMissionComplete: function () { /* recompensa diferida al desafío */ },
      onState: function (s) { /* estado manejado por diálogo */ }
    });
    showCharacterSelect();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    audio.cancel();
    if (dialogue) dialogue.stop();
    if (inputController) inputController.detach();
    if (mobileControls) mobileControls.destroy();
    if (world) world.dispose();
    if (fallback) fallback.destroy();
    if (root && root.parentNode) root.parentNode.removeChild(root);
    stateMachine.transition(AdventureState.DESTROYED);
  }

  return {
    start: start,
    destroy: destroy,
    getState: function () { return stateMachine.getState(); },
    isDestroyed: function () { return destroyed; },
    engine: { stateMachine: stateMachine }
  };
}
