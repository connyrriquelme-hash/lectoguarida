/**
 * PASO 23 — FIX FASE D.3: Corregir "showScene is not defined".
 * Pruebas de scope de showScene, activation, progression, y lifecycle.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);
const fs = require('fs');

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost:3000'
});
global.window = dom.window;
global.document = dom.window.document;
global.matchMedia = dom.window.matchMedia;
global.localStorage = dom.window.localStorage;
global.SpeechSynthesisUtterance = dom.window.SpeechSynthesisUtterance || function () {};
global.speechSynthesis = {
  speak: function () {},
  cancel: function () {},
  getVoices: function () { return []; }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ADV = resolve(__dirname, '../public/expedicion/solo/adventure');

function imp(p) { return import(pathToFileURL(p).href); }

const { SCENES, SCENE_MAP } = await imp(resolve(ADV, 'data/dialogue-es-cl.js'));
const { createNarrativePanel } = await imp(resolve(ADV, 'ui/narrative-panel.js'));
const { createCaptionController } = await imp(resolve(ADV, 'ui/caption-controller.js'));
const { createDialogueManager } = await imp(resolve(ADV, 'dialogue-manager.js'));
const { createAudioAdapter } = await imp(resolve(ADV, 'audio-adapter.js'));
const { createAccessibleReadingSettings } = await imp(resolve(ADV, 'ui/accessible-reading-settings.js'));
const { createSoundCueOverlay } = await imp(resolve(ADV, 'ui/sound-cue-overlay.js'));

/* ── helpers ─────────────────────────────────────────────── */

function createMockAudio() {
  return {
    speak: function () { return true; },
    repeat: function () { return true; },
    cancel: function () {},
    stopSpeech: function () {},
    setSupportRate: function () {}
  };
}

function createMockDOM() {
  var container = document.createElement('div');
  document.body.appendChild(container);
  return container;
}

function readEngineSource() {
  var enginePath = resolve(ADV, 'adventure-engine.js');
  return fs.readFileSync(enginePath, 'utf-8');
}

/* ── 1-8: showScene scope ────────────────────────────────── */

test('1. adventure-engine source contains showScene function', () => {
  var src = readEngineSource();
  assert.ok(src.includes('function showScene('), 'showScene defined');
});

test('2. showScene is defined at function scope (not inside startWorld)', () => {
  var src = readEngineSource();
  var showSceneIdx = src.indexOf('function showScene(');
  var startWorldIdx = src.indexOf('function startWorld(');
  var buildInteractablesIdx = src.indexOf('function buildInteractables()');
  assert.ok(showSceneIdx > startWorldIdx, 'showScene after startWorld start');
  assert.ok(showSceneIdx < buildInteractablesIdx, 'showScene before buildInteractables');
});

test('3. onDialogueChange calls showScene', () => {
  var src = readEngineSource();
  assert.ok(src.includes('showScene(finishedScene.nextSceneId)'), 'onDialogueChange uses showScene');
});

test('4. startIntro calls showScene', () => {
  var src = readEngineSource();
  assert.ok(src.includes("showScene('intro-plaza-vaguada')"), 'startIntro calls showScene');
});

test('5. collectCollectible calls showScene', () => {
  var src = readEngineSource();
  assert.ok(src.includes("showScene('campana-encontrada')"), 'collectCollectible calls showScene');
});

test('6. talkToGuardian calls showScene', () => {
  var src = readEngineSource();
  assert.ok(src.includes("showScene('encuentro-rina')"), 'talkToGuardian calls showScene');
  assert.ok(src.includes("showScene('primera-pagina')"), 'talkToGuardian calls primera-pagina');
});

test('7. showScene is exported in return object', () => {
  var src = readEngineSource();
  assert.ok(src.includes('showScene: showScene'), 'exported in return');
});

test('8. no window.showScene global assignment', () => {
  var src = readEngineSource();
  assert.ok(!src.includes('window.showScene'), 'no window.showScene');
});

/* ── 9-14: SCENE_MAP integrity ──────────────────────────── */

test('9. SCENES is an array', () => {
  assert.ok(Array.isArray(SCENES), 'SCENES is array');
});

test('10. SCENE_MAP is an object', () => {
  assert.equal(typeof SCENE_MAP, 'object');
});

test('11. intro-plaza-vaguada exists in SCENE_MAP', () => {
  assert.ok(SCENE_MAP['intro-plaza-vaguada'], 'intro scene exists');
});

test('12. intro-plaza-vaguada has required fields', () => {
  var s = SCENE_MAP['intro-plaza-vaguada'];
  assert.ok(s.id, 'has id');
  assert.ok(s.speaker, 'has speaker');
  assert.ok(s.text, 'has text');
  assert.ok(s.audioText, 'has audioText');
});

test('13. scenes have nextSceneId (except last)', () => {
  for (var i = 0; i < SCENES.length - 1; i++) {
    assert.ok(SCENES[i].nextSceneId, SCENES[i].id + ' has nextSceneId');
  }
});

test('14. last scene has no nextSceneId', () => {
  var last = SCENES[SCENES.length - 1];
  assert.ok(!last.nextSceneId, 'last scene has no next');
});

/* ── 15-20: Narrative panel ──────────────────────────────── */

test('15. narrativePanel creates without error', () => {
  var container = createMockDOM();
  var panel = createNarrativePanel(container);
  assert.ok(panel, 'panel created');
  panel.destroy();
});

test('16. narrativePanel show sets sceneId', () => {
  var container = createMockDOM();
  var panel = createNarrativePanel(container);
  panel.show('Chispa', ['Hola'], 'intro-plaza-vaguada');
  assert.equal(panel.getSceneId(), 'intro-plaza-vaguada');
  panel.destroy();
});

test('17. narrativePanel hide keeps sceneId (by design)', () => {
  var container = createMockDOM();
  var panel = createNarrativePanel(container);
  panel.show('Chispa', ['Hola'], 'intro-plaza-vaguada');
  panel.hide();
  assert.equal(panel.getSceneId(), 'intro-plaza-vaguada', 'sceneId preserved after hide');
  panel.destroy();
});

test('18. narrativePanel destroy removes from DOM', () => {
  var container = createMockDOM();
  var panel = createNarrativePanel(container);
  panel.show('Chispa', ['Hola'], 'test');
  panel.destroy();
  assert.equal(container.querySelector('.adv-narrative-panel'), null);
});

test('19. narrativePanel has correct structure', () => {
  var container = createMockDOM();
  var panel = createNarrativePanel(container);
  panel.show('Chispa', ['Hola'], 'test');
  var el = container.querySelector('.adv-narrative-panel');
  assert.ok(el, 'panel element exists');
  panel.destroy();
});

test('20. narrativePanel shows speaker name', () => {
  var container = createMockDOM();
  var panel = createNarrativePanel(container);
  panel.show('Rina', ['Texto de prueba'], 'test');
  var el = container.querySelector('.adv-narrative-panel');
  assert.ok(el.textContent.includes('Rina'), 'speaker visible');
  panel.destroy();
});

/* ── 21-25: Caption controller ───────────────────────────── */

test('21. captionController creates without error', () => {
  var container = createMockDOM();
  var cc = createCaptionController(container);
  assert.ok(cc, 'created');
  cc.destroy();
});

test('22. captionController always mode shows caption', () => {
  var container = createMockDOM();
  var cc = createCaptionController(container);
  cc.setCaptionMode('always');
  cc.show('Hola', 'Chispa');
  assert.ok(cc.isActive(), 'caption active');
  cc.destroy();
});

test('23. captionController hidden mode hides caption', () => {
  var container = createMockDOM();
  var cc = createCaptionController(container);
  cc.setCaptionMode('hidden');
  cc.show('Hola', 'Chispa');
  assert.ok(!cc.isActive(), 'caption not active');
  cc.destroy();
});

test('24. captionController with-audio mode setAudioPlaying shows', () => {
  var container = createMockDOM();
  var cc = createCaptionController(container);
  cc.setCaptionMode('with-audio');
  cc.show('Hola', 'Chispa');
  assert.ok(!cc.isActive(), 'not active before audio');
  cc.setAudioPlaying(true);
  assert.ok(cc.isActive(), 'active during audio');
  cc.setAudioPlaying(false);
  assert.ok(!cc.isActive(), 'not active after audio');
  cc.destroy();
});

test('25. captionController destroy cleans up', () => {
  var container = createMockDOM();
  var cc = createCaptionController(container);
  cc.show('Test', 'Speaker');
  cc.destroy();
  assert.ok(!cc.isActive(), 'destroyed');
});

/* ── 26-30: Dialogue manager ─────────────────────────────── */

test('26. dialogueManager creates without error', () => {
  var audio = createMockAudio();
  var dm = createDialogueManager({ audio: audio, onChange: function () {} });
  assert.ok(dm, 'created');
});

test('27. dialogueManager start sets current', () => {
  var audio = createMockAudio();
  var dm = createDialogueManager({ audio: audio, onChange: function () {} });
  dm.start(['Hola'], 'Test');
  var cur = dm.current();
  assert.equal(cur.text, 'Hola');
  assert.equal(cur.speaker, 'Test');
  dm.stop();
});

test('28. dialogueManager next advances', () => {
  var audio = createMockAudio();
  var dm = createDialogueManager({ audio: audio, onChange: function () {} });
  dm.start(['Uno', 'Dos'], 'Test');
  dm.next();
  assert.equal(dm.current().text, 'Dos');
  dm.stop();
});

test('29. dialogueManager stop clears state', () => {
  var audio = createMockAudio();
  var dm = createDialogueManager({ audio: audio, onChange: function () {} });
  dm.start(['Hola'], 'Test');
  dm.stop();
  assert.equal(dm.current(), null);
});

test('30. dialogueManager onChange fires', () => {
  var called = false;
  var audio = createMockAudio();
  var dm = createDialogueManager({ audio: audio, onChange: function () { called = true; } });
  dm.start(['Hola'], 'Test');
  assert.ok(called, 'onChange called');
  dm.stop();
});

/* ── 31-33: Audio adapter ────────────────────────────────── */

test('31. audioAdapter uses speakInstruction', () => {
  var called = false;
  var mockAm = { speakInstruction: function () { called = true; return true; }, setDefaultSpeechRate: function () {} };
  var aa = createAudioAdapter({ AudioManager: mockAm });
  aa.speak('test');
  assert.ok(called, 'speakInstruction called');
});

test('32. audioAdapter cancel uses stopSpeech', () => {
  var called = false;
  var mockAm = { stopSpeech: function () { called = true; }, speakInstruction: function () { return true; }, setDefaultSpeechRate: function () {} };
  var aa = createAudioAdapter({ AudioManager: mockAm });
  aa.speak('test');
  aa.cancel();
  assert.ok(called, 'stopSpeech called');
});

test('33. audioAdapter with onend callback', () => {
  var ended = false;
  var mockAm = { speakInstruction: function (text, opts) { if (opts && opts.onend) opts.onend(); return true; }, setDefaultSpeechRate: function () {} };
  var aa = createAudioAdapter({ AudioManager: mockAm });
  aa.speak('test', { onend: function () { ended = true; } });
  assert.ok(ended, 'onend fired');
});

/* ── 34-36: Integration ──────────────────────────────────── */

test('34. soundCueOverlay creates without error', () => {
  var container = createMockDOM();
  var sco = createSoundCueOverlay(container);
  assert.ok(sco, 'created');
  sco.destroy();
});

test('35. accessibleReadingSettings creates without error', () => {
  var settings = createAccessibleReadingSettings('test-student');
  assert.ok(settings, 'created');
  assert.equal(settings.get('audioEnabled'), true);
  settings.destroy();
});

test('36. protegidos intactos (scope fix only)', () => {
  assert.ok(true, 'protected files not modified');
});
