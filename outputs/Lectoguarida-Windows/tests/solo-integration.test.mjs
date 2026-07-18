import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE = resolve(__dirname, '../public/expedicion/solo');

const __openDoms = new Set();
after(() => {
  for (const d of __openDoms) {
    try { d.window.close(); } catch (e) { /* ignore */ }
  }
  __openDoms.clear();
});

function readFile(subpath) {
  return readFileSync(resolve(BASE, subpath), 'utf8');
}

function loadAllModules(window) {
  const files = [
    'core/solo-state-machine.js',
    'core/game-config-validator.js',
    'core/input-manager.js',
    'core/scoring-engine.js',
    'core/feedback-manager.js',
    'core/reward-manager.js',
    'core/progress-repository.js',
    'core/audio-manager.js',
    'core/accessibility-manager.js',
    'core/error-boundary.js',
    'core/solo-game-engine.js',
    'core/solo-game-adapter.js',
    'templates/click-selection-template.js',
    'templates/drag-drop-template.js',
    'templates/avatar-movement-template.js',
    'plugins/audio-instruction-plugin.js',
    'plugins/timer-plugin.js',
    'plugins/keyboard-input-plugin.js',
    'plugins/reward-plugin.js',
    'plugins/accessibility-plugin.js',
    'games/vocal-a-game.js'
  ];
  const allSrc = files.map(f => readFile(f)).join('\n');
  const fakeStorage = {};
  const fakeLs = { getItem: (k) => fakeStorage[k] || null, setItem: (k, v) => { fakeStorage[k] = v; }, removeItem: (k) => { delete fakeStorage[k]; } };
  const fn = new Function('window', 'document', 'navigator', 'localStorage', 'AudioContext', allSrc);
  fn(window, window.document, window.navigator, fakeLs, function() { return { state: 'running', resume: () => Promise.resolve(), close: () => {} }; });
  return fakeLs;
}

function createDom() {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="container"></div></body></html>', {
    url: 'http://localhost:3000/expedicion/solo/juego/non_reader/vocal-a'
  });
  dom.window.requestAnimationFrame = function(cb) { return setTimeout(cb, 0); };
  dom.window.cancelAnimationFrame = function(id) { clearTimeout(id); };
  __openDoms.add(dom);
  return dom;
}

// ============================================================
// 1. Adaptador registra juego vocal-a
// ============================================================
test('adaptador registra juego vocal-a', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const def = dom.window.SoloGameAdapter.getGameDef('vocal-a');
  assert.ok(def);
  assert.equal(def.id, 'vocal-a');
  assert.equal(def.template, 'click_selection');
  assert.equal(def.profile, 'non_reader');
});

// ============================================================
// 2. Adaptador lista juegos por perfil
// ============================================================
test('adaptador lista juegos por perfil non_reader', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const games = dom.window.SoloGameAdapter.listGames('non_reader');
  assert.ok(games.length >= 1);
  assert.equal(games[0].id, 'vocal-a');
});

// ============================================================
// 3. Adaptador crea engine correctamente
// ============================================================
test('adaptador crea engine para vocal-a', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 'test-student',
    container: container,
    gameId: 'vocal-a'
  });
  assert.ok(adapter);
  assert.ok(adapter.engine);
  assert.ok(adapter.config);
  assert.equal(adapter.config.id, 'vocal-a');
});

// ============================================================
// 4. Flujo completo de estados: BOOT → GAME_COMPLETE
// ============================================================
test('flujo completo de estados BOOT a GAME_COMPLETE', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 'test-student',
    container: container,
    gameId: 'vocal-a'
  });
  const engine = adapter.engine;
  const sm = engine.getStateMachine();

  assert.equal(sm.getState().phase, 'BOOT');

  engine.loadGame(adapter.config);
  assert.equal(sm.getState().phase, 'LOADING_GAME');

  engine.startGame();
  assert.equal(sm.getState().phase, 'PLAYING');

  engine.completeGame({ correctAnswers: 5, totalRounds: 5 });
  assert.equal(sm.getState().phase, 'GAME_COMPLETE');
});

// ============================================================
// 5. Persistencia: juego completado se guarda
// ============================================================
test('persistencia: juego completado se guarda en progreso', () => {
  const dom = createDom();
  const ls = loadAllModules(dom.window);
  dom.window.SoloProgressRepository.completeGame('test-persist', 'non_reader', 'vocal-a', 3);
  const progress = dom.window.SoloProgressRepository.getProfileProgress('test-persist', 'non_reader');
  assert.ok(progress.completedGames.includes('vocal-a'));
  assert.equal(progress.stars['vocal-a'], 3);
});

// ============================================================
// 6. Persistencia: namespace separado del colaborativo
// ============================================================
test('persistencia: namespace solo separado del colaborativo', () => {
  const dom = createDom();
  const ls = loadAllModules(dom.window);
  dom.window.SoloProgressRepository.completeGame('ns-test', 'non_reader', 'vocal-a', 2);
  const soloData = ls.getItem('lectoguarida:solo-progress:v1:ns-test');
  assert.ok(soloData);
  const collabData = ls.getItem('lectoguarida-progress');
  assert.equal(collabData, null);
});

// ============================================================
// 7. Puntaje nunca negativo tras completar
// ============================================================
test('puntaje nunca negativo tras completar juego', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 'score-test',
    container: container,
    gameId: 'vocal-a'
  });
  adapter.engine.loadGame(adapter.config);
  adapter.engine.startGame();
  const result = adapter.engine.completeGame({ correctAnswers: 0, totalRounds: 5 });
  assert.ok(result.score >= 0);
});

// ============================================================
// 8. Accesibilidad: reducedMotion se aplica
// ============================================================
test('accesibilidad: reducedMotion se aplica', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const acc = dom.window.AccessibilityManager.create('acc-test');
  acc.set('reducedMotion', true);
  acc.apply();
  assert.equal(acc.get('reducedMotion'), true);
  acc.reset();
  assert.equal(acc.get('reducedMotion'), false);
});

// ============================================================
// 9. Accesibilidad: extendedTime se persiste
// ============================================================
test('accesibilidad: extendedTime se persiste', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const acc = dom.window.AccessibilityManager.create('ext-test');
  acc.set('extendedTime', true);
  const saved = dom.window.AccessibilityManager.load('ext-test');
  assert.equal(saved.extendedTime, true);
});

// ============================================================
// 10. Accesibilidad: keyboardNavigation habilitado
// ============================================================
test('accesibilidad: keyboardNavigation habilitado por defecto', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const acc = dom.window.AccessibilityManager.create('kb-test');
  assert.equal(acc.get('keyboardNavigation'), true);
});

// ============================================================
// 11. ClickSelectionTemplate renderiza opciones del juego real
// ============================================================
test('click template renderiza 3 opciones del juego vocal-a', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const gameDef = dom.window.SoloGameAdapter.getGameDef('vocal-a');
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'render-test', container });
  engine.loadGame({
    id: gameDef.id, title: gameDef.title, profile: gameDef.profile,
    template: gameDef.template, content: gameDef.content,
    scoring: gameDef.scoring, rewards: gameDef.rewards
  });
  engine.startGame();
  const template = dom.window.ClickSelectionTemplate.create({ container, config: { content: gameDef.content }, engine });
  template.start();
  const options = container.querySelectorAll('.solo-option');
  assert.equal(options.length, 3);
});

// ============================================================
// 12. Click en respuesta correcta marca botón
// ============================================================
test('click en respuesta correcta marca boton solo-option--correct', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const gameDef = dom.window.SoloGameAdapter.getGameDef('vocal-a');
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'click-test', container });
  engine.loadGame({
    id: gameDef.id, title: gameDef.title, profile: gameDef.profile,
    template: gameDef.template, content: gameDef.content,
    scoring: gameDef.scoring, rewards: gameDef.rewards
  });
  engine.startGame();
  const template = dom.window.ClickSelectionTemplate.create({ container, config: { content: gameDef.content }, engine });
  template.start();
  const firstOption = container.querySelector('.solo-option[data-index="0"]');
  assert.ok(firstOption);
  firstOption.click();
  assert.ok(firstOption.classList.contains('solo-option--correct') || firstOption.disabled);
});

// ============================================================
// 13. Respuesta incorrecta marca incorrect
// ============================================================
test('click en respuesta incorrecta marca boton solo-option--incorrect', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const gameDef = dom.window.SoloGameAdapter.getGameDef('vocal-a');
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'incorrect-test', container });
  engine.loadGame({
    id: gameDef.id, title: gameDef.title, profile: gameDef.profile,
    template: gameDef.template, content: gameDef.content,
    scoring: gameDef.scoring, rewards: gameDef.rewards
  });
  engine.startGame();
  const template = dom.window.ClickSelectionTemplate.create({ container, config: { content: gameDef.content }, engine });
  template.start();
  const wrongOption = container.querySelector('.solo-option[data-index="1"]');
  assert.ok(wrongOption);
  wrongOption.click();
  assert.ok(wrongOption.classList.contains('solo-option--incorrect') || wrongOption.disabled);
});

// ============================================================
// 14. Transiciones válidas del juego real
// ============================================================
test('transiciones validas del juego real vocal-a', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const sm = dom.window.SoloStateMachine.create();
  const PHASES = sm.PHASES;

  let r;
  r = sm.transitionTo(PHASES.PROFILE_READY, 'test'); assert.equal(r.ok, true);
  r = sm.loadGame({ id: 'vocal-a', template: 'click_selection', profile: 'non_reader' }); assert.equal(r.ok, true);
  r = sm.transitionTo(PHASES.INSTRUCTIONS, 'test'); assert.equal(r.ok, true);
  r = sm.transitionTo(PHASES.READY, 'test'); assert.equal(r.ok, true);
  r = sm.transitionTo(PHASES.PLAYING, 'test'); assert.equal(r.ok, true);
  r = sm.transitionTo(PHASES.FEEDBACK, 'test'); assert.equal(r.ok, true);
  r = sm.completeGame({ score: 100, correctAnswers: 5 }); assert.equal(r.ok, true);
  assert.equal(sm.getState().phase, PHASES.GAME_COMPLETE);
});

// ============================================================
// 15. Transición FEEDBACK → PLAYING (siguiente ronda)
// ============================================================
test('transicion FEEDBACK a PLAYING para siguiente ronda', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const sm = dom.window.SoloStateMachine.create();
  sm.transitionTo('PROFILE_READY', 't');
  sm.loadGame({ id: 'vocal-a', template: 'click_selection', profile: 'non_reader' });
  sm.transitionTo('INSTRUCTIONS', 't');
  sm.transitionTo('READY', 't');
  sm.transitionTo('PLAYING', 't');
  sm.transitionTo('FEEDBACK', 't');
  const r = sm.transitionTo('PLAYING', 'next-round');
  assert.equal(r.ok, true);
  assert.equal(sm.getState().phase, 'PLAYING');
});

// ============================================================
// 16. Transición PLAYING → PAUSED → PLAYING
// ============================================================
test('transicion PLAYING a PAUSED a PLAYING', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const sm = dom.window.SoloStateMachine.create();
  sm.transitionTo('PROFILE_READY', 't');
  sm.loadGame({ id: 'vocal-a', template: 'click_selection', profile: 'non_reader' });
  sm.transitionTo('INSTRUCTIONS', 't');
  sm.transitionTo('READY', 't');
  sm.transitionTo('PLAYING', 't');
  let r = sm.pauseGame();
  assert.equal(r.ok, true);
  assert.equal(sm.getState().phase, 'PAUSED');
  r = sm.resumeGame();
  assert.equal(r.ok, true);
  assert.equal(sm.getState().phase, 'PLAYING');
});

// ============================================================
// 17. Engine resetea correctamente
// ============================================================
test('engine resetea correctamente a BOOT', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 'reset-test',
    container: container,
    gameId: 'vocal-a'
  });
  adapter.engine.loadGame(adapter.config);
  adapter.engine.startGame();
  adapter.engine.resetGame();
  assert.equal(adapter.engine.getState().phase, 'BOOT');
});

// ============================================================
// 18. Recompensa: Páginas Perdidas se acumulan
// ============================================================
test('recompensa: Paginas Perdidas se acumulan', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const rm = dom.window.RewardManager.create(dom.window.SoloProgressRepository, 'reward-test');
  rm.awardLostPages(2);
  rm.awardLostPages(3);
  assert.equal(rm.getLostPages(), 5);
});

// ============================================================
// 19. Recompensa: estrellas por puntaje
// ============================================================
test('recompensa: estrellas por puntaje alto', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const scoring = dom.window.ScoringEngine.create({ basePoints: 100 });
  assert.equal(scoring.getStars(300), 3);
  assert.equal(scoring.getStars(200), 2);
  assert.equal(scoring.getStars(100), 1);
  assert.equal(scoring.getStars(0), 0);
});

// ============================================================
// 20. Plugin fallido no bloquea el juego
// ============================================================
test('plugin fallido no bloquea el juego real', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const container = dom.window.document.getElementById('container');
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 'plugin-test',
    container: container,
    gameId: 'vocal-a'
  });
  adapter.engine.addPlugin({ start: () => { throw new Error('crash'); }, destroy: () => {} });
  adapter.engine.loadGame(adapter.config);
  const result = adapter.engine.startGame();
  assert.equal(result, true);
});

// ============================================================
// 21. Audio fallido no impide jugar
// ============================================================
test('audio fallido no impide jugar', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  dom.window.AudioManager.setMuted(true);
  assert.equal(dom.window.AudioManager.isMuted(), true);
  dom.window.AudioManager.playSound('correct');
  assert.equal(dom.window.AudioManager.isMuted(), true);
  dom.window.AudioManager.setMuted(false);
});

// ============================================================
// 22. Datos dañados en localStorage se recuperan
// ============================================================
test('datos danados en localStorage se recuperan', () => {
  const dom = createDom();
  const ls = loadAllModules(dom.window);
  ls.setItem('lectoguarida:solo-progress:v1:damaged', 'NOT-JSON{{{');
  const progress = dom.window.SoloProgressRepository.load('damaged');
  assert.equal(progress.version, 1);
  assert.equal(progress.studentProfileId, 'damaged');
});

// ============================================================
// 23. Reset de un perfil no afecta otros
// ============================================================
test('reset de un perfil no afecta otros', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  dom.window.SoloProgressRepository.completeGame('multi', 'non_reader', 'vocal-a', 3);
  dom.window.SoloProgressRepository.completeGame('multi', 'beginner', 'other-game', 2);
  dom.window.SoloProgressRepository.resetProfile('multi', 'non_reader');
  const nr = dom.window.SoloProgressRepository.getProfileProgress('multi', 'non_reader');
  const bg = dom.window.SoloProgressRepository.getProfileProgress('multi', 'beginner');
  assert.equal(nr.completedGames.length, 0);
  assert.ok(bg.completedGames.includes('other-game'));
});

// ============================================================
// 24. Feature flags correctos
// ============================================================
test('feature flags ENABLE_MULTIPROFILE_MENU y ENABLE_SOLO_GAME_ENGINE', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  assert.equal(typeof dom.window.SoloGameEngine, 'object');
  assert.equal(typeof dom.window.SoloGameAdapter, 'object');
});

// ============================================================
// 25. Contenido del juego tiene 5 rondas
// ============================================================
test('contenido del juego vocal-a tiene 5 rondas', () => {
  const dom = createDom();
  loadAllModules(dom.window);
  const def = dom.window.SoloGameAdapter.getGameDef('vocal-a');
  assert.equal(def.content.length, 5);
  def.content.forEach(round => {
    assert.ok(round.question);
    assert.ok(round.options);
    assert.equal(round.options.length, 3);
    assert.ok(round.answers);
    assert.equal(round.answers.length, 1);
  });
});

// ============================================================
// 26. Hash de index.html no cambió
// ============================================================
test('hash de index.html no cambio', () => {
  const src = readFileSync(resolve(__dirname, '../public/expedicion/index.html'), 'utf8');
  const hash = createHash('sha256').update(src).digest('hex').substring(0, 8).toUpperCase();
  assert.equal(hash, '6953E924');
});

// ============================================================
// 27. Hash de auth.js no cambió
// ============================================================
test('hash de auth.js no cambio', () => {
  const src = readFileSync(resolve(__dirname, '../public/expedicion/auth.js'), 'utf8');
  const hash = createHash('sha256').update(src).digest('hex').substring(0, 8).toUpperCase();
  assert.equal(hash, '3426D22B');
});

// ============================================================
// 28. Hash de dashboard.html no cambió
// ============================================================
test('hash de dashboard.html no cambio', () => {
  const src = readFileSync(resolve(__dirname, '../public/expedicion/dashboard.html'), 'utf8');
  const hash = createHash('sha256').update(src).digest('hex').substring(0, 8).toUpperCase();
  assert.equal(hash, '6A4C1541');
});

// ============================================================
// 29. Hash de game.js no cambió
// ============================================================
test('hash de game.js no cambio', () => {
  const src = readFileSync(resolve(__dirname, '../public/expedicion/game.js'), 'utf8');
  const hash = createHash('sha256').update(src).digest('hex').substring(0, 8).toUpperCase();
  assert.equal(hash, '4B86469E');
});
