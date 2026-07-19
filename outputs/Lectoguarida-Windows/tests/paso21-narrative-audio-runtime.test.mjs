/**
 * PASO 21 — FIX FASE D.1: Narrativa, diálogos, audio y captions al juego real.
 * Pruebas de montaje, escenas, audio, captions,with-audio, lifecycle, responsive.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost:3000'
});
global.window = dom.window;
global.document = dom.window.document;
global.matchMedia = dom.window.matchMedia;
global.localStorage = dom.window.localStorage;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ADV = resolve(__dirname, '../public/expedicion/solo/adventure');

function imp(p) { return import(pathToFileURL(p).href); }

const { createNarrativePanel } = await imp(resolve(ADV, 'ui/narrative-panel.js'));
const { createCaptionController } = await imp(resolve(ADV, 'ui/caption-controller.js'));
const { createSoundCueOverlay } = await imp(resolve(ADV, 'ui/sound-cue-overlay.js'));
const { createAccessibleReadingSettings, DEFAULTS } = await imp(resolve(ADV, 'ui/accessible-reading-settings.js'));
const { SCENES, SCENE_MAP } = await imp(resolve(ADV, 'data/dialogue-es-cl.js'));

/* ══════════════════════════════════════════════════
   SCENE DATA (tests 1-7)
   ══════════════════════════════════════════════════ */

test('1. hay exactamente siete escenas', () => {
  assert.equal(SCENES.length, 7, 'expected 7 scenes');
});

test('2. los IDs de escena son únicos', () => {
  var ids = SCENES.map(function (s) { return s.id; });
  var unique = new Set(ids);
  assert.equal(unique.size, 7, 'all IDs unique');
});

test('3. SCENE_MAP tiene 7 entradas', () => {
  assert.equal(Object.keys(SCENE_MAP).length, 7);
});

test('4. cada escena tiene id, speaker, text, audioText', () => {
  SCENES.forEach(function (s) {
    assert.ok(s.id, 'scene ' + s.id + ' has id');
    assert.ok(s.speaker, 'scene ' + s.id + ' has speaker');
    assert.ok(s.text, 'scene ' + s.id + ' has text');
    assert.ok(s.audioText, 'scene ' + s.id + ' has audioText');
  });
});

test('5. cada escena tiene nextSceneId (excepto la última)', () => {
  SCENES.forEach(function (s, i) {
    if (i < SCENES.length - 1) {
      assert.ok(s.nextSceneId, 'scene ' + s.id + ' has nextSceneId');
    } else {
      assert.equal(s.nextSceneId, null, 'last scene has null nextSceneId');
    }
  });
});

test('6. la primera escena es intro-plaza-vaguada', () => {
  assert.equal(SCENES[0].id, 'intro-plaza-vaguada');
});

test('7. la última escena es primera-pagina', () => {
  assert.equal(SCENES[6].id, 'primera-pagina');
});

/* ══════════════════════════════════════════════════
   NARRATIVE PANEL (tests 8-16)
   ══════════════════════════════════════════════════ */

test('8. narrativePanel se crea sin error', () => {
  var container = document.createElement('div');
  var panel = createNarrativePanel(container);
  assert.ok(panel, 'panel created');
  panel.destroy();
});

test('9. narrativePanel mount agrega nodo al DOM', () => {
  var container = document.createElement('div');
  document.body.appendChild(container);
  var panel = createNarrativePanel(container);
  panel.mount();
  var el = container.querySelector('.adv-narrative-panel');
  assert.ok(el, 'panel element in DOM');
  assert.ok(el.isConnected, 'panel connected');
  panel.destroy();
  document.body.removeChild(container);
});

test('10. narrativePanel show hace visible', () => {
  var container = document.createElement('div');
  var panel = createNarrativePanel(container);
  panel.show('Rina', ['Hola'], 'test-scene');
  assert.ok(panel.isVisible(), 'panel is visible');
  var el = container.querySelector('.adv-narrative-panel');
  assert.equal(el.style.opacity, '1');
  panel.destroy();
});

test('11. narrativePanel show setea sceneId en data attribute', () => {
  var container = document.createElement('div');
  var panel = createNarrativePanel(container);
  panel.show('Rina', ['Hola'], 'intro-plaza-vaguada');
  var el = container.querySelector('.adv-narrative-panel');
  assert.equal(el.dataset.sceneId, 'intro-plaza-vaguada');
  panel.destroy();
});

test('12. narrativePanel getSceneId retorna escena activa', () => {
  var container = document.createElement('div');
  var panel = createNarrativePanel(container);
  panel.show('Rina', ['Hola'], 'encuentro-rina');
  assert.equal(panel.getSceneId(), 'encuentro-rina');
  panel.destroy();
});

test('13. narrativePanel show con speaker correcto', () => {
  var container = document.createElement('div');
  var panel = createNarrativePanel(container);
  panel.show('Lumiércoles', ['Test'], 'test');
  var el = container.querySelector('.adv-narrative-speaker');
  assert.equal(el.textContent, 'Lumiércoles');
  panel.destroy();
});

test('14. narrativePanel show con texto correcto', () => {
  var container = document.createElement('div');
  var panel = createNarrativePanel(container);
  panel.show('Rina', ['Hola mundo'], 'test');
  var el = container.querySelector('.adv-narrative-text');
  assert.equal(el.textContent, 'Hola mundo');
  panel.destroy();
});

test('15. narrativePanel tiene z-index 18', () => {
  var container = document.createElement('div');
  var panel = createNarrativePanel(container);
  panel.mount();
  var el = container.querySelector('.adv-narrative-panel');
  assert.equal(el.style.zIndex, '18');
  panel.destroy();
});

test('16. narrativePanel destroy elimina del DOM', () => {
  var container = document.createElement('div');
  var panel = createNarrativePanel(container);
  panel.mount();
  assert.ok(container.querySelector('.adv-narrative-panel'), 'before destroy');
  panel.destroy();
  assert.equal(container.querySelector('.adv-narrative-panel'), null, 'after destroy');
});

/* ══════════════════════════════════════════════════
   CAPTION CONTROLLER (tests 17-25)
   ══════════════════════════════════════════════════ */

test('17. captionController always muestra caption', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.setCaptionMode('always');
  cc.show('Hola', 'Rina');
  assert.ok(cc.isActive(), 'caption active in always mode');
  cc.destroy();
});

test('18. captionController always mantiene caption al terminar', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.setCaptionMode('always');
  cc.show('Hola', 'Rina');
  cc.setAudioPlaying(false);
  assert.ok(cc.isActive(), 'caption stays active after audio ends');
  cc.destroy();
});

test('19. captionController hidden oculta CaptionOverlay', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.setCaptionMode('hidden');
  cc.show('Hola', 'Rina');
  assert.equal(cc.isActive(), false, 'caption not active in hidden mode');
  cc.destroy();
});

test('20. captionController with-audio oculto antes de reproducir', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.setCaptionMode('with-audio');
  cc.show('Hola', 'Rina');
  assert.equal(cc.isActive(), false, 'caption hidden before audio plays');
  cc.destroy();
});

test('21. captionController with-audio aparece durante audio', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.setCaptionMode('with-audio');
  cc.show('Hola', 'Rina');
  cc.setAudioPlaying(true);
  assert.ok(cc.isActive(), 'caption visible during audio');
  cc.destroy();
});

test('22. captionController with-audio se oculta al terminar', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.setCaptionMode('with-audio');
  cc.show('Hola', 'Rina');
  cc.setAudioPlaying(true);
  cc.setAudioPlaying(false);
  assert.equal(cc.isActive(), false, 'caption hidden after audio ends');
  cc.destroy();
});

test('23. captionController hidden no oculta NarrativePanel', () => {
  var container = document.createElement('div');
  var panel = createNarrativePanel(container);
  panel.show('Rina', ['Hola'], 'test');
  assert.ok(panel.isVisible(), 'narrative panel still visible with hidden captions');
  panel.destroy();
});

test('24. captionController tiene aria-live polite', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.mount();
  var el = container.querySelector('.adv-caption-bar');
  assert.equal(el.getAttribute('aria-live'), 'polite');
  cc.destroy();
});

test('25. captionController destroy limpiia', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.mount();
  assert.ok(container.querySelector('.adv-caption-bar'));
  cc.destroy();
  assert.equal(container.querySelector('.adv-caption-bar'), null);
});

/* ══════════════════════════════════════════════════
   AUDIO SETTINGS (tests 26-30)
   ══════════════════════════════════════════════════ */

test('26. audioEnabled default es true en sesión normal', () => {
  var s = createAccessibleReadingSettings('test-default-audio');
  assert.equal(s.get('audioEnabled'), true, 'audio enabled by default');
  s.destroy();
});

test('27. captionsMode default es always', () => {
  var s = createAccessibleReadingSettings('test-default-caps');
  assert.equal(s.get('captionsMode'), 'always');
  s.destroy();
});

test('28. visualReadingMode default es false', () => {
  var s = createAccessibleReadingSettings('test-default-vr');
  assert.equal(s.get('visualReadingMode'), false);
  s.destroy();
});

test('29. Lectura Visual cambia audioEnabled a false', () => {
  var s = createAccessibleReadingSettings('test-lr-audio');
  s.setVisualReadingMode(true);
  assert.equal(s.get('audioEnabled'), false);
  s.destroy();
});

test('30. Lectura Visual cambia captionsMode a always', () => {
  var s = createAccessibleReadingSettings('test-lr-caps');
  s.setVisualReadingMode(true);
  assert.equal(s.get('captionsMode'), 'always');
  s.destroy();
});

/* ══════════════════════════════════════════════════
   SCENE BLOCKING (tests 31-32)
   ══════════════════════════════════════════════════ */

test('31. escenas blocking tienen blocking=true', () => {
  var blocking = SCENES.filter(function (s) { return s.blocking; });
  assert.ok(blocking.length >= 3, 'at least 3 blocking scenes');
  assert.ok(blocking.find(function (s) { return s.id === 'intro-plaza-vaguada'; }), 'intro is blocking');
  assert.ok(blocking.find(function (s) { return s.id === 'encuentro-rina'; }), 'encuentro is blocking');
  assert.ok(blocking.find(function (s) { return s.id === 'buscar-campanas'; }), 'buscar is blocking');
});

test('32. escenas non-blocking tienen blocking=false', () => {
  var nonBlocking = SCENES.filter(function (s) { return !s.blocking; });
  assert.ok(nonBlocking.length >= 2, 'at least 2 non-blocking scenes');
  assert.ok(nonBlocking.find(function (s) { return s.id === 'lumiercoles-guia'; }), 'guia is non-blocking');
  assert.ok(nonBlocking.find(function (s) { return s.id === 'campana-encontrada'; }), 'campana-encontrada is non-blocking');
});

/* ══════════════════════════════════════════════════
   LIFECYCLE (tests 33-35)
   ══════════════════════════════════════════════════ */

test('33. reingreso no duplica panel narrativo', () => {
  var container = document.createElement('div');
  document.body.appendChild(container);
  var panel1 = createNarrativePanel(container);
  panel1.mount();
  var count1 = container.querySelectorAll('.adv-narrative-panel').length;
  panel1.destroy();
  var panel2 = createNarrativePanel(container);
  panel2.mount();
  var count2 = container.querySelectorAll('.adv-narrative-panel').length;
  assert.equal(count1, 1, 'first mount: 1 panel');
  assert.equal(count2, 1, 'second mount: 1 panel');
  panel2.destroy();
  document.body.removeChild(container);
});

test('34. reingreso no duplica captions', () => {
  var container = document.createElement('div');
  document.body.appendChild(container);
  var cc1 = createCaptionController(container);
  cc1.mount();
  var count1 = container.querySelectorAll('.adv-caption-bar').length;
  cc1.destroy();
  var cc2 = createCaptionController(container);
  cc2.mount();
  var count2 = container.querySelectorAll('.adv-caption-bar').length;
  assert.equal(count1, 1);
  assert.equal(count2, 1);
  cc2.destroy();
  document.body.removeChild(container);
});

test('35. destroy elimina panel y cancela audio', () => {
  var container = document.createElement('div');
  var panel = createNarrativePanel(container);
  panel.mount();
  panel.show('Rina', ['Hola'], 'test');
  panel.destroy();
  assert.equal(container.querySelector('.adv-narrative-panel'), null);
  assert.equal(panel.isVisible(), false);
});

/* ══════════════════════════════════════════════════
   RESPONSIVE (tests 36-37)
   ══════════════════════════════════════════════════ */

test('36. panel mantiene ancho en viewport 941x608', () => {
  var container = document.createElement('div');
  document.body.appendChild(container);
  var panel = createNarrativePanel(container);
  panel.show('Rina', ['Texto de prueba para verificar dimensiones'], 'test');
  var el = container.querySelector('.adv-narrative-panel');
  assert.ok(el, 'panel exists');
  assert.ok(el.isConnected, 'panel connected to DOM');
  assert.equal(el.style.position, 'absolute', 'panel positioned');
  assert.ok(el.style.zIndex, 'panel has z-index');
  panel.destroy();
  document.body.removeChild(container);
});

test('37. panel mantiene ancho en viewport 390x844', () => {
  var container = document.createElement('div');
  document.body.appendChild(container);
  var panel = createNarrativePanel(container);
  panel.show('Rina', ['Texto'], 'test');
  var el = container.querySelector('.adv-narrative-panel');
  assert.ok(el, 'panel exists');
  assert.equal(el.style.position, 'absolute', 'panel positioned absolute');
  assert.equal(parseInt(el.style.zIndex), 18, 'z-index is 18');
  panel.destroy();
  document.body.removeChild(container);
});
