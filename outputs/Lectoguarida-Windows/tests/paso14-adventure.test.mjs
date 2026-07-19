/**
 * PASO 14 ADVENTURE — Pruebas del juego de aventura isométrica Lectoguarida.
 * Ejecuta comportamiento real de los módulos (sin buscar solo strings).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const EXPED = resolve(__dirname, '../public/expedicion');
const ADV = resolve(EXPED, 'solo/adventure');

function imp(p) { return import(pathToFileURL(p).href); }

// ---- Pure modules ----
const { createStateMachine, AdventureState } = await imp(resolve(ADV, 'adventure-state-machine.js'));
const { createQualityManager, detectQuality, getQualityConfig, QUALITY_TIERS } = await imp(resolve(ADV, 'quality-manager.js'));
const { createQuestManager } = await imp(resolve(ADV, 'quest-manager.js'));
const { CHAPTER_01, ZONES, CHARACTERS, GUARDIANS } = await imp(resolve(ADV, 'adventure-config.js'));
const { createDialogueManager } = await imp(resolve(ADV, 'dialogue-manager.js'));
const { createDisposer } = await imp(resolve(ADV, 'resource-disposer.js'));
const { createAccessibilityController } = await imp(resolve(ADV, 'accessibility-controller.js'));
const { createPlayerController } = await imp(resolve(ADV, 'player-controller.js'));
const { createProgressAdapter } = await imp(resolve(ADV, 'progress-adapter.js'));
const { createAudioAdapter } = await imp(resolve(ADV, 'audio-adapter.js'));
const { createChallengeAdapter } = await imp(resolve(ADV, 'challenge-adapter.js'));
const { createCompanionFactory } = await imp(resolve(ADV, 'companion-factory.js'));
const { createCollectibleFactory } = await imp(resolve(ADV, 'collectible-factory.js'));
const { createPortalFactory } = await imp(resolve(ADV, 'portal-factory.js'));
const { createPlayerFactory } = await imp(resolve(ADV, 'player-factory.js'));
const { createGuardianFactory } = await imp(resolve(ADV, 'guardian-factory.js'));
const { createVegetationFactory } = await imp(resolve(ADV, 'vegetation-factory.js'));

// ---- 1. AdventureEngine state machine starts in BOOTING ----
test('state machine inicia en BOOTING', () => {
  const sm = createStateMachine(AdventureState.BOOTING);
  assert.equal(sm.getState(), AdventureState.BOOTING);
});

// ---- 2. transitions to CHARACTER_SELECT ----
test('state machine transiciona a CHARACTER_SELECT', () => {
  const sm = createStateMachine(AdventureState.BOOTING);
  assert.equal(sm.transition(AdventureState.CHARACTER_SELECT), true);
  assert.equal(sm.getState(), AdventureState.CHARACTER_SELECT);
});

// ---- 3. cannot transition to CHALLENGE from BOOTING (hierarchy) ----
test('no permite CHALLENGE directo desde BOOTING', () => {
  const sm = createStateMachine(AdventureState.BOOTING);
  assert.equal(sm.transition(AdventureState.CHALLENGE), false);
});

// ---- 4. DESTROYED blocks further transitions ----
test('DESTROYED bloquea transiciones', () => {
  const sm = createStateMachine(AdventureState.EXPLORING);
  sm.transition(AdventureState.DESTROYED);
  assert.equal(sm.transition(AdventureState.EXPLORING), false);
});

// ---- 5. Quality LOW disables shadows ----
test('LOW desactiva sombras', () => {
  const q = createQualityManager({ force: QUALITY_TIERS.LOW });
  assert.equal(q.isShadowsEnabled(), false);
  assert.equal(q.getConfig().shadowsEnabled, false);
});

// ---- 6. HIGH limits pixelRatio to 2 ----
test('HIGH limita pixelRatio a 2', () => {
  const q = createQualityManager({ force: QUALITY_TIERS.HIGH });
  assert.equal(q.getConfig().maxPixelRatio, 2);
});

// ---- 7. detectQuality returns valid tier ----
test('detectQuality retorna un tier valido', () => {
  const t = detectQuality({ force: QUALITY_TIERS.MEDIUM });
  assert.ok([QUALITY_TIERS.LOW, QUALITY_TIERS.MEDIUM, QUALITY_TIERS.HIGH].includes(t));
});

// ---- 8. Quest: collectible counted once ----
test('una campana solo se registra una vez', () => {
  const qm = createQuestManager(CHAPTER_01.mission);
  assert.equal(qm.collect('bell-luna'), true);
  assert.equal(qm.collect('bell-luna'), false);
  assert.equal(qm.progress().found, 1);
});

// ---- 9. Quest completes after all ----
test('mision completa al encontrar todas las campanas', () => {
  const qm = createQuestManager(CHAPTER_01.mission);
  qm.collect('bell-luna'); qm.collect('bell-cuna'); qm.collect('bell-funa');
  assert.equal(qm.isComplete(), true);
});

// ---- 10. Config: chapter 1 mission uses rhyme-catcher ----
test('mision del capítulo 1 usa rhyme-catcher', () => {
  assert.equal(CHAPTER_01.mission.gameId, 'rhyme-catcher');
  assert.equal(CHAPTER_01.mission.collectibleCount, 3);
});

// ---- 11. Zones: 4 portals + plaza ----
test('hay 4 portales pedagógicos y la plaza', () => {
  const portals = ZONES.filter(z => z.portal);
  assert.equal(portals.length, 4);
  assert.ok(ZONES.some(z => z.id === 'plaza-guarida'));
});

// ---- 12. Characters: 4 original ----
test('cuatro personajes originales', () => {
  assert.equal(CHARACTERS.length, 4);
  const ids = CHARACTERS.map(c => c.id).sort();
  assert.deepEqual(ids, ['bimo', 'lumi', 'nara', 'tilo']);
});

// ---- 13. Guardians: 4 chilean fauna ----
test('cuatro guardianes de fauna chilena', () => {
  assert.equal(Object.keys(GUARDIANS).length, 4);
  assert.equal(GUARDIANS.rina.species, 'Ranita de las Rimas');
});

// ---- 14. Dialogue manager plays lines and finishes ----
test('dialogo reproduce lineas y termina', () => {
  let spoken = [];
  const audio = { speak: t => spoken.push(t), cancel: () => {} };
  const dm = createDialogueManager({ audio, onChange: () => {} });
  dm.start(['Hola', 'Adios'], 'Rina');
  assert.equal(dm.isActive(), true);
  assert.equal(spoken[0], 'Hola');
  dm.next();
  dm.next();
  assert.equal(dm.isActive(), false);
});

// ---- 15. Disposer cancels raf and removes listeners ----
test('disposer cancela raf y listeners', () => {
  const d = createDisposer();
  let rafCancelled = false;
  const fakeRaf = 123;
  const origCancel = global.cancelAnimationFrame;
  global.cancelAnimationFrame = () => { rafCancelled = true; };
  d.trackRaf(fakeRaf);
  let removed = false;
  const target = { removeEventListener: () => { removed = true; }, addEventListener: () => {} };
  d.trackListener(target, 'resize', () => {});
  d.disposeAll();
  assert.equal(rafCancelled, true);
  assert.equal(removed, true);
  if (origCancel) global.cancelAnimationFrame = origCancel;
});

// ---- 16. Accessibility reduced motion detection ----
test('accessibility detecta reduced motion', () => {
  const orig = global.window;
  global.window = { matchMedia: () => ({ matches: true }) };
  const a = createAccessibilityController({});
  assert.equal(a.isReducedMotion(), true);
  global.window = orig;
});

// ---- 17. Player controller blocks water ----
test('jugador no entra al agua', () => {
  const player = { position: { x: 0, y: 0, z: -10 }, rotation: { y: 0 } };
  const pc = createPlayerController(player, null);
  // push toward water center (0,-26) radius 11 many times
  for (let i = 0; i < 60; i++) pc.move({ x: 0, z: -1 }, 0.1);
  const dz = player.position.z - (-26);
  assert.ok(Math.sqrt(player.position.x * player.position.x + dz * dz) >= 11 - 0.001, 'no debe estar dentro del agua (z=' + player.position.z + ')');
});

// ---- 18. Player controller respects map bounds ----
test('jugador no sale del mapa', () => {
  const player = { position: { x: 50, y: 0, z: 50 }, rotation: { y: 0 } };
  const pc = createPlayerController(player, null);
  for (let i = 0; i < 100; i++) pc.move({ x: 1, z: 1 }, 0.1);
  assert.ok(player.position.x <= 55 && player.position.z <= 55);
});

// ---- 19. Player controller disabled stops movement ----
test('control desactivado detiene al jugador', () => {
  const player = { position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 } };
  const pc = createPlayerController(player, null);
  pc.setEnabled(false);
  pc.move({ x: 1, z: 0 }, 0.1);
  assert.equal(player.position.x, 0);
});

// ---- 20. Progress adapter: stars do not decrease ----
test('las estrellas no disminuyen', () => {
  const store = makeMockRepo();
  const p = createProgressAdapter({ SoloProgressRepository: store, studentProfileId: 's1' });
  p.addStars(3);
  p.addStars(2);
  assert.equal(p.getStars(), 5);
  p.addStars(-10);
  assert.equal(p.getStars(), 5);
});

// ---- 21. Progress adapter: reward not duplicated ----
test('recompensa no se duplica', () => {
  const store = makeMockRepo();
  const p = createProgressAdapter({ SoloProgressRepository: store, studentProfileId: 's1' });
  assert.equal(p.addReward('pagina-capitulo-01'), true);
  assert.equal(p.addReward('pagina-capitulo-01'), false);
});

// ---- 22. Progress adapter: per-student namespace ----
test('progreso separado por estudiante', () => {
  const store = makeMockRepo();
  const a = createProgressAdapter({ SoloProgressRepository: store, studentProfileId: 'student-A' });
  const b = createProgressAdapter({ SoloProgressRepository: store, studentProfileId: 'student-B' });
  a.addStars(10);
  assert.equal(b.getStars(), 0);
});

// ---- 23. Progress adapter: no PII stored ----
test('no guarda PII', () => {
  const store = makeMockRepo();
  const p = createProgressAdapter({ SoloProgressRepository: store, studentProfileId: 's1' });
  p.setCharacter('lumi');
  p.addStars(1);
  p.markCollectible('bell-luna');
  const saved = store._lastSaved;
  const json = JSON.stringify(saved);
  ['rut', 'email', 'correo', 'nombre', 'voice', 'audio', 'foto', 'image'].forEach(k => {
    assert.ok(!json.toLowerCase().includes(k), 'no debe contener ' + k);
  });
});

// ---- 24. Progress adapter: localStorage failure falls back to memory ----
test('fallo de localStorage usa memoria', () => {
  const store = makeMockRepo({ throwOnSave: true });
  const p = createProgressAdapter({ SoloProgressRepository: store, studentProfileId: 's1' });
  p.addStars(5);
  assert.equal(p.getStars(), 5);
});

// ---- 25. Audio adapter reduces rate for apoyo ----
test('apoyo usa velocidad menor', () => {
  let rate = 0.9;
  const AM = {
    speak: () => {},
    cancel: () => {},
    setDefaultSpeechRate: r => { rate = r; }
  };
  const a = createAudioAdapter({ AudioManager: AM });
  a.setSupportRate('apoyo');
  assert.ok(rate < 0.8, 'apoyo debe reducir la velocidad');
  a.setSupportRate('desafio');
  assert.ok(rate > 0.9, 'desafio debe ser mas rapido');
});

// ---- 26. Audio adapter repeat cancels previous ----
test('repetir cancela audio anterior', () => {
  let cancelled = false;
  let spoken = 0;
  const AM = { speak: () => { spoken++; }, cancel: () => { cancelled = true; }, setDefaultSpeechRate: () => {} };
  const a = createAudioAdapter({ AudioManager: AM });
  a.repeat('hola');
  assert.equal(cancelled, true);
  assert.equal(spoken, 1);
});

// ---- 27. Challenge adapter passes canonical gameId ----
test('challenge adapter pasa gameId canonico', () => {
  let received = null;
  const mockAdapter = {
    createEngine: (opts) => {
      received = opts;
      return {
        engine: {
          getStateMachine: () => ({ subscribe: (cb) => { cb('PLAYING', 'GAME_COMPLETE'); } }),
          getScoring: () => ({ score: 250, attempts: 1 })
        },
        loadAndStart: () => {}
      };
    }
  };
  const AM = { cancel: () => {}, speak: () => {}, setDefaultSpeechRate: () => {} };
  let result = null;
  const ch = createChallengeAdapter({ SoloGameAdapter: mockAdapter, AudioManager: AM, onResult: r => { result = r; } });
  ch.open({ gameId: 'rhyme-catcher', difficulty: 'estandar', studentProfileId: 's1', missionId: 'm1', container: {}, rewardId: 'r1' });
  assert.equal(received.gameId, 'rhyme-catcher');
  assert.equal(result.completed, true);
  assert.equal(result.stars, 3);
});

// ---- 28. Challenge adapter normalizes rim-catcher -> rhyme-catcher ----
test('rim-catcher se normaliza a rhyme-catcher', () => {
  let received = null;
  const mockAdapter = {
    createEngine: (opts) => { received = opts; return { engine: { getStateMachine: () => ({ subscribe: () => {} }), getScoring: () => null }, loadAndStart: () => {} }; }
  };
  const AM = { cancel: () => {}, speak: () => {}, setDefaultSpeechRate: () => {} };
  const ch = createChallengeAdapter({ SoloGameAdapter: mockAdapter, AudioManager: AM, onResult: () => {} });
  ch.open({ gameId: 'rim-catcher', difficulty: 'estandar', studentProfileId: 's1', container: {} });
  assert.equal(received.gameId, 'rhyme-catcher');
});

// ---- 29. Factories build objects ----
test('factories construyen objetos sin error', () => {
  const cf = createCollectibleFactory();
  const c = cf.create('bell', 'bell-luna');
  assert.equal(c.userData.collectibleId, 'bell-luna');
  const pf = createPortalFactory();
  const p = pf.createForZone(ZONES.find(z => z.id === 'laguna-rimas'));
  assert.ok(p);
  assert.equal(p.userData.gameId, 'rhyme-catcher');
  const plf = createPlayerFactory();
  const pl = plf.create('lumi');
  assert.equal(pl.userData.characterId, 'lumi');
  const gf = createGuardianFactory();
  const g = gf.create('rina');
  assert.ok(g);
  const vf = createVegetationFactory();
  assert.ok(vf.create('copihue'));
});

// ---- 30. Companion factory builds and animates ----
test('companion se construye y anima', () => {
  const cf = createCompanionFactory();
  const c = cf.create();
  assert.ok(c);
  c.position.x = 0; c.position.y = 0; c.position.z = 0;
  cf.animate(c, 1.2, { x: 5, z: 5 });
  assert.ok(c.position.x > 0);
});

// ---- Helpers ----
function makeMockRepo(opts) {
  opts = opts || {};
  const data = {};
  return {
    _lastSaved: null,
    getProfileProgress: (id) => data[id] || null,
    updateProfileProgress: (id, profile, patch) => {
      if (opts.throwOnSave) throw new Error('storage failure');
      data[id] = Object.assign({}, data[id], { adventure: patch.adventure });
      this._lastSaved = data[id];
    }
  };
}
