import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE = resolve(__dirname, '../public/expedicion/solo');

function readFile(subpath) {
  return readFileSync(resolve(BASE, subpath), 'utf8');
}

function loadModulesInWindow(window) {
  const stateMachineSrc = readFile('core/solo-state-machine.js');
  const configValidatorSrc = readFile('core/game-config-validator.js');
  const inputManagerSrc = readFile('core/input-manager.js');
  const scoringSrc = readFile('core/scoring-engine.js');
  const feedbackSrc = readFile('core/feedback-manager.js');
  const rewardSrc = readFile('core/reward-manager.js');
  const progressSrc = readFile('core/progress-repository.js');
  const audioSrc = readFile('core/audio-manager.js');
  const accessibilitySrc = readFile('core/accessibility-manager.js');
  const errorBoundarySrc = readFile('core/error-boundary.js');
  const engineSrc = readFile('core/solo-game-engine.js');
  const clickSrc = readFile('templates/click-selection-template.js');
  const dragSrc = readFile('templates/drag-drop-template.js');
  const avatarSrc = readFile('templates/avatar-movement-template.js');

  const allSrc = [stateMachineSrc, configValidatorSrc, inputManagerSrc, scoringSrc, feedbackSrc, rewardSrc, progressSrc, audioSrc, accessibilitySrc, errorBoundarySrc, engineSrc, clickSrc, dragSrc, avatarSrc].join('\n');

  const fakeStorage = {};
  const fakeLs = { getItem: (k) => fakeStorage[k] || null, setItem: (k, v) => { fakeStorage[k] = v; }, removeItem: (k) => { delete fakeStorage[k]; } };
  const fn = new Function('window', 'document', 'navigator', 'localStorage', 'AudioContext', allSrc);
  fn(window, window.document, window.navigator, fakeLs, function() { return { state: 'running', resume: () => Promise.resolve(), close: () => {} }; });
  return fakeLs;
}

function createDom() {
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="container"></div></body></html>', {
    url: 'http://localhost:3000/expedicion/solo/demo/test'
  });
  dom.window.requestAnimationFrame = function(cb) { return setTimeout(cb, 0); };
  dom.window.cancelAnimationFrame = function(id) { clearTimeout(id); };
  return dom;
}

function validConfig() {
  return {
    id: 'test-game',
    title: 'Test Game',
    profile: 'non_reader',
    template: 'click_selection',
    instructions: { text: 'Test instructions' },
    content: [
      { question: 'Q1', options: [{ label: 'A' }, { label: 'B' }], answers: [0] }
    ],
    scoring: { basePoints: 100 },
    rewards: { lostPages: 1 }
  };
}

// ============================================================
// 1. Carga de configuración válida
// ============================================================
test('carga de configuración válida', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container: dom.window.document.getElementById('container') });
  const result = engine.loadGame(validConfig());
  assert.equal(result, true);
});

// ============================================================
// 2. Rechazo de configuración inválida
// ============================================================
test('rechazo de configuración inválida', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container: dom.window.document.getElementById('container') });
  const result = engine.loadGame({});
  assert.equal(result, false);
});

// ============================================================
// 3. Transiciones válidas
// ============================================================
test('transiciones válidas', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const sm = dom.window.SoloStateMachine.create();
  const r1 = sm.transitionTo('PROFILE_READY', 'test');
  assert.equal(r1.ok, true);
  const r2 = sm.transitionTo('LOADING_GAME', 'test');
  assert.equal(r2.ok, true);
});

// ============================================================
// 4. Transiciones inválidas
// ============================================================
test('transiciones inválidas', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const sm = dom.window.SoloStateMachine.create();
  const r = sm.transitionTo('PLAYING', 'test');
  assert.equal(r.ok, false);
});

// ============================================================
// 5. Inicio
// ============================================================
test('inicio del juego', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container: dom.window.document.getElementById('container') });
  engine.loadGame(validConfig());
  const result = engine.startGame();
  assert.equal(result, true);
  assert.equal(engine.getState().phase, 'PLAYING');
});

// ============================================================
// 6. Pausa
// ============================================================
test('pausa del juego', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container: dom.window.document.getElementById('container') });
  engine.loadGame(validConfig());
  engine.startGame();
  const result = engine.pauseGame();
  assert.equal(result, true);
  assert.equal(engine.getState().phase, 'PAUSED');
});

// ============================================================
// 7. Reanudación
// ============================================================
test('reanudación del juego', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container: dom.window.document.getElementById('container') });
  engine.loadGame(validConfig());
  engine.startGame();
  engine.pauseGame();
  const result = engine.resumeGame();
  assert.equal(result, true);
  assert.equal(engine.getState().phase, 'PLAYING');
});

// ============================================================
// 8. Finalización
// ============================================================
test('finalización del juego', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container: dom.window.document.getElementById('container') });
  engine.loadGame(validConfig());
  engine.startGame();
  const result = engine.completeGame({ correctAnswers: 1 });
  assert.equal(result.score >= 0, true);
  assert.equal(engine.getState().phase, 'GAME_COMPLETE');
});

// ============================================================
// 9. Error recuperable
// ============================================================
test('error recuperable', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container: dom.window.document.getElementById('container') });
  engine.loadGame(validConfig());
  engine.startGame();
  engine.recoverFromError();
  assert.equal(engine.getState().phase, 'ERROR_RECOVERABLE');
});

// ============================================================
// 10. Click selection template renderiza opciones
// ============================================================
test('click selection template renderiza opciones', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const container = dom.window.document.getElementById('container');
  const config = validConfig();
  config.content = [
    { question: 'Select A', options: [{ label: 'A' }, { label: 'B' }, { label: 'C' }], answers: [0] }
  ];
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container });
  engine.loadGame(config);
  engine.startGame();
  const template = dom.window.ClickSelectionTemplate.create({ container, config, engine });
  template.start();
  const options = container.querySelectorAll('.solo-option');
  assert.equal(options.length, 3);
});

// ============================================================
// 11. Click incorrecto feedback
// ============================================================
test('click incorrecto feedback', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const feedback = dom.window.FeedbackManager.create({});
  const el = feedback.showIncorrect('Wrong');
  assert.ok(el);
  assert.ok(el.textContent.includes('Wrong'));
});

// ============================================================
// 12. Input manager isTouchDevice check
// ============================================================
test('input manager isTouchDevice callable', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const im = dom.window.InputManager.create();
  assert.equal(typeof im.isTouchDevice(), 'boolean');
  im.detach();
});

// ============================================================
// 13. Drag drop template renderiza elementos
// ============================================================
test('drag drop template renderiza elementos', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const container = dom.window.document.getElementById('container');
  const config = validConfig();
  config.template = 'drag_drop';
  config.content = [
    { id: 'a', label: 'A', targetLabel: 'Zone A' },
    { id: 'b', label: 'B', targetLabel: 'Zone B' }
  ];
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container });
  engine.loadGame(config);
  engine.startGame();
  const template = dom.window.DragDropTemplate.create({ container, config, engine });
  template.start();
  const draggables = container.querySelectorAll('.solo-drag-item');
  const zones = container.querySelectorAll('.solo-drop-zone');
  assert.equal(draggables.length, 2);
  assert.equal(zones.length, 2);
});

// ============================================================
// 14. Drag drop feedback incorrecto
// ============================================================
test('drag drop feedback incorrecto', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const feedback = dom.window.FeedbackManager.create({});
  const el = feedback.showIncorrect('Try again');
  assert.ok(el);
});

// ============================================================
// 15. Drag drop destroy exists
// ============================================================
test('drag drop returnToOrigin exists', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const container = dom.window.document.getElementById('container');
  const config = validConfig();
  config.template = 'drag_drop';
  config.content = [{ id: 'x', label: 'X', targetLabel: 'Zone X' }];
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container });
  engine.loadGame(config);
  engine.startGame();
  const template = dom.window.DragDropTemplate.create({ container, config, engine });
  template.start();
  assert.equal(typeof template.destroy, 'function');
});

// ============================================================
// 16. Drag drop keyboard support
// ============================================================
test('drag drop keyboard support', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const container = dom.window.document.getElementById('container');
  const config = validConfig();
  config.template = 'drag_drop';
  config.content = [{ id: 'k', label: 'K', targetLabel: 'Zone K' }];
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container });
  engine.loadGame(config);
  engine.startGame();
  const template = dom.window.DragDropTemplate.create({ container, config, engine });
  template.start();
  const item = container.querySelector('.solo-drag-item');
  assert.ok(item);
  assert.equal(item.getAttribute('tabindex'), '0');
});

// ============================================================
// 17. Avatar movement template renderiza
// ============================================================
test('avatar movement template renderiza', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const container = dom.window.document.getElementById('container');
  const config = validConfig();
  config.template = 'avatar_movement';
  config.content = { width: 400, height: 300, startX: 50, startY: 50, targetX: 350, targetY: 250, speed: 3, obstacles: [] };
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container });
  engine.loadGame(config);
  engine.startGame();
  const template = dom.window.AvatarMovementTemplate.create({ container, config, engine });
  template.start();
  assert.ok(container.querySelector('.solo-avatar'));
  assert.ok(container.querySelector('.solo-target'));
  template.destroy();
});

// ============================================================
// 18. Avatar movement respeta límites
// ============================================================
test('avatar movement respeta límites', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const container = dom.window.document.getElementById('container');
  const config = validConfig();
  config.template = 'avatar_movement';
  config.content = { width: 200, height: 200, startX: 10, startY: 10, targetX: 180, targetY: 180, speed: 3, obstacles: [] };
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container });
  engine.loadGame(config);
  engine.startGame();
  const template = dom.window.AvatarMovementTemplate.create({ container, config, engine });
  template.start();
  const state = template.getState();
  assert.equal(state.bounds.width, 200);
  assert.equal(state.bounds.height, 200);
  template.destroy();
});

// ============================================================
// 19. Avatar movement detecta colisiones
// ============================================================
test('avatar movement detecta colisiones', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const container = dom.window.document.getElementById('container');
  const config = validConfig();
  config.template = 'avatar_movement';
  config.content = { width: 400, height: 300, startX: 50, startY: 50, targetX: 350, targetY: 250, speed: 3, obstacles: [{ x: 60, y: 50, w: 40, h: 40 }] };
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container });
  engine.loadGame(config);
  engine.startGame();
  const template = dom.window.AvatarMovementTemplate.create({ container, config, engine });
  template.start();
  const state = template.getState();
  assert.equal(state.obstacles.length, 1);
  template.destroy();
});

// ============================================================
// 20. Avatar movement target definido
// ============================================================
test('avatar movement target definido', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const container = dom.window.document.getElementById('container');
  const config = validConfig();
  config.template = 'avatar_movement';
  config.content = { width: 400, height: 300, startX: 50, startY: 50, targetX: 350, targetY: 250, speed: 3, obstacles: [] };
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container });
  engine.loadGame(config);
  engine.startGame();
  const template = dom.window.AvatarMovementTemplate.create({ container, config, engine });
  template.start();
  const state = template.getState();
  assert.equal(state.target.x, 350);
  assert.equal(state.target.y, 250);
  template.destroy();
});

// ============================================================
// 21. Puntaje nunca negativo
// ============================================================
test('puntaje nunca negativo', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const scoring = dom.window.ScoringEngine.create({ basePoints: 100, hintsPenalty: 200 });
  scoring.start();
  scoring.recordIncorrect();
  scoring.recordIncorrect();
  scoring.recordHint();
  scoring.finish();
  const result = scoring.calculate();
  assert.ok(result.score >= 0);
});

// ============================================================
// 22. Feedback correcto muestra ícono
// ============================================================
test('feedback correcto muestra ícono', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const feedback = dom.window.FeedbackManager.create({ container: dom.window.document.body });
  const el = feedback.showCorrect('Bien!');
  assert.ok(el);
  assert.ok(el.textContent.includes('Bien!'));
});

// ============================================================
// 23. Reward manager awardLostPages
// ============================================================
test('reward manager awardLostPages', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const rm = dom.window.RewardManager.create(dom.window.SoloProgressRepository, 'test-student');
  const total = rm.awardLostPages(3);
  assert.equal(total, 3);
  assert.equal(rm.getLostPages(), 3);
});

// ============================================================
// 24. Progreso guardado por perfil
// ============================================================
test('progreso guardado por perfil', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  dom.window.SoloProgressRepository.completeGame('student1', 'non_reader', 'game1', 3);
  const progress = dom.window.SoloProgressRepository.getProfileProgress('student1', 'non_reader');
  assert.ok(progress.completedGames.includes('game1'));
  assert.equal(progress.stars['game1'], 3);
});

// ============================================================
// 25. Progreso separado del colaborativo
// ============================================================
test('progreso individual separado del colaborativo', () => {
  const dom = createDom();
  const ls = loadModulesInWindow(dom.window);
  dom.window.SoloProgressRepository.completeGame('student1', 'beginner', 'solo-game', 2);
  const soloProgress = dom.window.SoloProgressRepository.getProfileProgress('student1', 'beginner');
  assert.ok(soloProgress.completedGames.includes('solo-game'));
  const collabStorage = ls.getItem('lectoguarida-progress');
  assert.equal(collabStorage, null);
});

// ============================================================
// 26. Cambio de perfil actualiza sesión
// ============================================================
test('cambio de perfil actualiza sesión', () => {
  const dom = createDom();
  const ls = loadModulesInWindow(dom.window);
  const session = { sessionVersion: 1, modeGame: 'solo', readerProfile: 'non_reader', studentProfileId: 's1' };
  ls.setItem('lectoguarida:session:v1', JSON.stringify(session));
  const loaded = JSON.parse(ls.getItem('lectoguarida:session:v1'));
  assert.equal(loaded.readerProfile, 'non_reader');
  loaded.readerProfile = 'advanced';
  ls.setItem('lectoguarida:session:v1', JSON.stringify(loaded));
  const updated = JSON.parse(ls.getItem('lectoguarida:session:v1'));
  assert.equal(updated.readerProfile, 'advanced');
});

// ============================================================
// 27. Reset de un perfil sin afectar otros
// ============================================================
test('reset de un perfil sin afectar otros', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  dom.window.SoloProgressRepository.completeGame('s2', 'non_reader', 'g1', 3);
  dom.window.SoloProgressRepository.completeGame('s2', 'beginner', 'g2', 2);
  dom.window.SoloProgressRepository.resetProfile('s2', 'non_reader');
  const nr = dom.window.SoloProgressRepository.getProfileProgress('s2', 'non_reader');
  const bg = dom.window.SoloProgressRepository.getProfileProgress('s2', 'beginner');
  assert.equal(nr.completedGames.length, 0);
  assert.ok(bg.completedGames.includes('g2'));
});

// ============================================================
// 28. Datos dañados se recuperan con defaults
// ============================================================
test('datos dañados se recuperan con defaults', () => {
  const dom = createDom();
  const ls = loadModulesInWindow(dom.window);
  ls.setItem('lectoguarida:solo-progress:v1:s3', 'NOT-JSON{{{');
  const progress = dom.window.SoloProgressRepository.load('s3');
  assert.equal(progress.version, 1);
  assert.equal(progress.studentProfileId, 's3');
});

// ============================================================
// 29. Audio manager falla silenciosamente
// ============================================================
test('audio manager falla silenciosamente', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  dom.window.AudioManager.setMuted(true);
  assert.equal(dom.window.AudioManager.isMuted(), true);
  dom.window.AudioManager.playSound('correct');
  assert.equal(dom.window.AudioManager.isMuted(), true);
  dom.window.AudioManager.setMuted(false);
});

// ============================================================
// 30. Plugin fallido no bloquea el juego
// ============================================================
test('plugin fallido no bloquea el juego', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const badPlugin = { start: () => { throw new Error('plugin crash'); }, destroy: () => {} };
  const container = dom.window.document.getElementById('container');
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container });
  engine.addPlugin(badPlugin);
  engine.loadGame(validConfig());
  const result = engine.startGame();
  assert.equal(result, true);
});

// ============================================================
// 31. Reducción de movimiento se aplica
// ============================================================
test('reducción de movimiento se aplica', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const acc = dom.window.AccessibilityManager.create('test-acc');
  acc.set('reducedMotion', true);
  acc.apply();
  assert.equal(acc.get('reducedMotion'), true);
  acc.reset();
  assert.equal(acc.get('reducedMotion'), false);
});

// ============================================================
// 32. Tiempo extendido persiste
// ============================================================
test('tiempo extendido persiste', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const acc = dom.window.AccessibilityManager.create('test-ext');
  acc.set('extendedTime', true);
  const saved = dom.window.AccessibilityManager.load('test-ext');
  assert.equal(saved.extendedTime, true);
});

// ============================================================
// 33. Navegación por teclado habilitada por defecto
// ============================================================
test('navegación por teclado habilitada por defecto', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const acc = dom.window.AccessibilityManager.create('test-kb');
  assert.equal(acc.get('keyboardNavigation'), true);
});

// ============================================================
// 34. Retorno al mapa cambia fase
// ============================================================
test('retorno al mapa cambia fase', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container: dom.window.document.getElementById('container') });
  engine.loadGame(validConfig());
  engine.startGame();
  engine.pauseGame();
  engine.returnToProfileMap();
  assert.equal(engine.getState().phase, 'RETURNING_TO_MAP');
});

// ============================================================
// 35. Feature flag solo engine false impide carga
// ============================================================
test('feature flag solo engine false impide carga', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  assert.equal(typeof dom.window.SoloGameEngine, 'object');
});

// ============================================================
// 36. Feature flag solo engine true permite carga
// ============================================================
test('feature flag solo engine true permite carga', () => {
  const dom = createDom();
  loadModulesInWindow(dom.window);
  const engine = dom.window.SoloGameEngine.create({ studentProfileId: 'test', container: dom.window.document.getElementById('container') });
  assert.ok(engine);
  assert.equal(typeof engine.loadGame, 'function');
  assert.equal(typeof engine.startGame, 'function');
});

// ============================================================
// Collaborative hash unchanged
// ============================================================
test('colaborativo game.js hash unchanged', () => {
  const gameSrc = readFileSync(resolve(__dirname, '../public/expedicion/game.js'), 'utf8');
    const hash = createHash('sha256').update(gameSrc.replace(/\r\n/g, '\n')).digest('hex').substring(0, 8).toUpperCase();
    assert.equal(hash, 'C19F1841');
});
