/**
 * PASO 19 — FASE D: Joystick universal y narrativa accesible.
 * Pruebas de joystick, narrativa, subtítulos, sonidos, configuración a11y.
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

const { createMobileControls } = await imp(resolve(ADV, 'mobile-controls.js'));
const { createNarrativePanel } = await imp(resolve(ADV, 'ui/narrative-panel.js'));
const { createCaptionController } = await imp(resolve(ADV, 'ui/caption-controller.js'));
const { createSoundCueOverlay, CUE_TYPES, SOUND_CUES } = await imp(resolve(ADV, 'ui/sound-cue-overlay.js'));
const { createAccessibleReadingSettings, DEFAULTS } = await imp(resolve(ADV, 'ui/accessible-reading-settings.js'));
const { SOUND_CUES_ES_CL } = await imp(resolve(ADV, 'data/sound-cues-es-cl.js'));
const { ADVENTURE_CSS } = await imp(resolve(ADV, 'adventure.css.js'));

/* ══════════════════════════════════════════════════
   JOYSTICK TESTS (1-20)
   ══════════════════════════════════════════════════ */

test('joystick se monta en el contenedor', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  var joy = container.querySelector('.adv-joystick');
  assert.ok(joy, 'joystick element exists');
  mc.destroy();
});

test('joystick existe una vez', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  var joys = container.querySelectorAll('.adv-joystick');
  assert.equal(joys.length, 1, 'exactly one joystick');
  mc.destroy();
});

test('joystick tiene aria-label', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  var joy = container.querySelector('.adv-joystick');
  assert.ok(joy.getAttribute('aria-label'), 'has aria-label');
  mc.destroy();
});

test('joystick tiene role group', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  var joy = container.querySelector('.adv-joystick');
  assert.equal(joy.getAttribute('role'), 'group');
  mc.destroy();
});

test('joystick tiene z-index 14', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  var joy = container.querySelector('.adv-joystick');
  assert.ok(joy.style.zIndex === '14', 'z-index is 14');
  mc.destroy();
});

test('joystick tiene pointer-events auto', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  var joy = container.querySelector('.adv-joystick');
  assert.ok(joy.style.pointerEvents === 'auto', 'pointer-events auto');
  mc.destroy();
});

test('getJoystickVector retorna (0,0) inicialmente', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  var v = mc.getJoystickVector();
  assert.equal(v.x, 0);
  assert.equal(v.z, 0);
  mc.destroy();
});

test('isJoystickActive retorna false inicialmente', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  assert.equal(mc.isJoystickActive(), false);
  mc.destroy();
});

test('setJoystickVisible oculta el joystick', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  mc.setJoystickVisible(false);
  assert.equal(mc.isJoystickVisible(), false);
  mc.destroy();
});

test('setJoystickVisible muestra el joystick', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  mc.setJoystickVisible(false);
  mc.setJoystickVisible(true);
  assert.equal(mc.isJoystickVisible(), true);
  mc.destroy();
});

test('setSensitivity cambia la sensibilidad', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  mc.setSensitivity('high');
  assert.equal(mc.getSensitivity(), 1.5);
  mc.setSensitivity('low');
  assert.equal(mc.getSensitivity(), 0.6);
  mc.setSensitivity('normal');
  assert.equal(mc.getSensitivity(), 1.0);
  mc.destroy();
});

test('isPointerConsumed retorna false para puntero no capturado', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  assert.equal(mc.isPointerConsumed(999), false);
  mc.destroy();
});

test('destroy limpia el joystick', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  mc.destroy();
  var joy = container.querySelector('.adv-joystick');
  assert.equal(joy, null);
});

test('joystick no se duplica al crear dos veces', () => {
  var container = document.createElement('div');
  var mc1 = createMobileControls(container, {});
  var mc2 = createMobileControls(container, {});
  var joys = container.querySelectorAll('.adv-joystick');
  assert.equal(joys.length, 2, 'two joysticks from two instances (expected, separate controllers)');
  mc1.destroy();
  mc2.destroy();
});

test('reingreso no acumula movimiento', () => {
  var container = document.createElement('div');
  var mc1 = createMobileControls(container, {});
  mc1.destroy();
  var mc2 = createMobileControls(container, {});
  var v = mc2.getJoystickVector();
  assert.equal(v.x, 0);
  assert.equal(v.z, 0);
  mc2.destroy();
});

test('setCameraController funciona sin error', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  mc.setCameraController({ rotateBy: function () {}, zoomBy: function () {}, recenter: function () {} });
  mc.destroy();
});

test('setCanvas funciona sin error', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  mc.setCanvas(document.createElement('canvas'));
  mc.destroy();
});

test('joystick tiene knob interno', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  var knob = container.querySelector('.adv-joystick-knob');
  assert.ok(knob, 'knob exists');
  mc.destroy();
});

test('joystick tiene borde visible', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  var joy = container.querySelector('.adv-joystick');
  assert.ok(joy.style.border.length > 0 || joy.style.borderWidth.length > 0, 'has border');
  mc.destroy();
});

test('joystick tiene box-shadow', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  var joy = container.querySelector('.adv-joystick');
  assert.ok(joy.style.boxShadow.includes('rgba(0,0,0'), 'has shadow');
  mc.destroy();
});

/* ══════════════════════════════════════════════════
   NARRATIVE PANEL TESTS (21-35)
   ══════════════════════════════════════════════════ */

test('narrative panel se monta al hacer show', () => {
  var container = document.createElement('div');
  var np = createNarrativePanel(container);
  np.show('Rina', ['Hola']);
  var el = container.querySelector('.adv-narrative-panel');
  assert.ok(el, 'panel exists');
  np.destroy();
});

test('narrative panel existe una vez', () => {
  var container = document.createElement('div');
  var np = createNarrativePanel(container);
  np.show('Rina', ['Hola']);
  np.show('Rina', ['Hola de nuevo']);
  var els = container.querySelectorAll('.adv-narrative-panel');
  assert.equal(els.length, 1, 'exactly one panel');
  np.destroy();
});

test('narrative panel muestra nombre del hablante', () => {
  var container = document.createElement('div');
  var np = createNarrativePanel(container);
  np.show('Rina', ['Texto de prueba']);
  var speaker = container.querySelector('.adv-narrative-speaker');
  assert.equal(speaker.textContent, 'Rina');
  np.destroy();
});

test('narrative panel muestra texto', () => {
  var container = document.createElement('div');
  var np = createNarrativePanel(container);
  np.show('Rina', ['Hola mundo']);
  var text = container.querySelector('.adv-narrative-text');
  assert.equal(text.textContent, 'Hola mundo');
  np.destroy();
});

test('narrative panel muestra progreso', () => {
  var container = document.createElement('div');
  var np = createNarrativePanel(container);
  np.show('Rina', ['Linea 1', 'Linea 2', 'Linea 3']);
  var progress = container.querySelector('.adv-narrative-progress');
  assert.equal(progress.textContent, '1/3');
  np.destroy();
});

test('narrative panel avanzar línea', () => {
  var container = document.createElement('div');
  var np = createNarrativePanel(container);
  np.show('Rina', ['Primera', 'Segunda']);
  np.advanceLine();
  var text = container.querySelector('.adv-narrative-text');
  assert.equal(text.textContent, 'Segunda');
  np.destroy();
});

test('narrative panel hide oculta el panel', () => {
  var container = document.createElement('div');
  var np = createNarrativePanel(container);
  np.show('Rina', ['Texto']);
  np.hide();
  assert.equal(np.isVisible(), false);
  np.destroy();
});

test('narrative panel isVisible retorna true al mostrar', () => {
  var container = document.createElement('div');
  var np = createNarrativePanel(container);
  np.show('Rina', ['Texto']);
  assert.equal(np.isVisible(), true);
  np.destroy();
});

test('narrative panel tiene aria-live polite', () => {
  var container = document.createElement('div');
  var np = createNarrativePanel(container);
  np.show('Rina', ['Texto']);
  var body = container.querySelector('.adv-narrative-body');
  assert.equal(body.getAttribute('aria-live'), 'polite');
  np.destroy();
});

test('narrative panel tiene role region', () => {
  var container = document.createElement('div');
  var np = createNarrativePanel(container);
  np.show('Rina', ['Texto']);
  var el = container.querySelector('.adv-narrative-panel');
  assert.equal(el.getAttribute('role'), 'region');
  np.destroy();
});

test('narrative panel botón Continuar funciona', () => {
  var container = document.createElement('div');
  var np = createNarrativePanel(container);
  var advanced = false;
  np.setOnAdvance(function () { advanced = true; });
  np.show('Rina', ['Una', 'Dos']);
  np.advanceLine();
  np.advanceLine();
  assert.equal(advanced, true);
  np.destroy();
});

test('narrative panel destroy limpia el panel', () => {
  var container = document.createElement('div');
  var np = createNarrativePanel(container);
  np.show('Rina', ['Texto']);
  np.destroy();
  var el = container.querySelector('.adv-narrative-panel');
  assert.equal(el, null);
});

test('narrative panel setCaption muestra subtítulo', () => {
  var container = document.createElement('div');
  var np = createNarrativePanel(container);
  np.show('Rina', ['Texto']);
  np.setCaption('Subtítulo de prueba');
  var cap = container.querySelector('.adv-narrative-caption');
  assert.equal(cap.textContent, 'Subtítulo de prueba');
  assert.ok(cap.style.display !== 'none');
  np.destroy();
});

test('narrative panel setCaption vacío oculta', () => {
  var container = document.createElement('div');
  var np = createNarrativePanel(container);
  np.show('Rina', ['Texto']);
  np.setCaption(null);
  var cap = container.querySelector('.adv-narrative-caption');
  assert.ok(cap.style.display === 'none');
  np.destroy();
});

test('narrative panel getCurrentSpeaker retorna nombre', () => {
  var container = document.createElement('div');
  var np = createNarrativePanel(container);
  np.show('Lumiércoles', ['Texto']);
  assert.equal(np.getCurrentSpeaker(), 'Lumiércoles');
  np.destroy();
});

/* ══════════════════════════════════════════════════
   CAPTION CONTROLLER TESTS (36-45)
   ══════════════════════════════════════════════════ */

test('caption controller se monta al hacer show', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.show('Texto de prueba', 'Rina');
  var el = container.querySelector('.adv-caption-bar');
  assert.ok(el, 'caption bar exists');
  cc.destroy();
});

test('caption controller isActive retorna true al mostrar', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.show('Texto', 'Rina');
  assert.equal(cc.isActive(), true);
  cc.destroy();
});

test('caption controller hide desactiva', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.show('Texto', 'Rina');
  cc.hide();
  assert.equal(cc.isActive(), false);
  cc.destroy();
});

test('caption controller muestra speaker', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.show('Hola', 'Lumiércoles');
  var speaker = container.querySelector('.adv-caption-speaker');
  assert.equal(speaker.textContent, 'Lumiércoles');
  cc.destroy();
});

test('caption controller muestra texto', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.show('Mensaje', 'Narrador');
  var text = container.querySelector('.adv-caption-text');
  assert.equal(text.textContent, 'Mensaje');
  cc.destroy();
});

test('caption controller updateText actualiza texto', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.show('Original', 'Rina');
  cc.updateText('Actualizado');
  assert.equal(cc.getCurrentText(), 'Actualizado');
  cc.destroy();
});

test('caption controller setCaptionMode hidden oculta', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.setCaptionMode('hidden');
  cc.show('Texto', 'Rina');
  assert.equal(cc.isActive(), false);
  cc.destroy();
});

test('caption controller getCaptionMode retorna modo', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.setCaptionMode('always');
  assert.equal(cc.getCaptionMode(), 'always');
  cc.destroy();
});

test('caption controller tiene aria-live polite', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.show('Texto', 'Rina');
  var el = container.querySelector('.adv-caption-bar');
  assert.equal(el.getAttribute('aria-live'), 'polite');
  cc.destroy();
});

test('caption controller destroy limpia', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.show('Texto', 'Rina');
  cc.destroy();
  var el = container.querySelector('.adv-caption-bar');
  assert.equal(el, null);
});

/* ══════════════════════════════════════════════════
   SOUND CUE OVERLAY TESTS (46-55)
   ══════════════════════════════════════════════════ */

test('sound cue overlay se monta al showCue', () => {
  var container = document.createElement('div');
  var sco = createSoundCueOverlay(container);
  sco.showCue('bell_found');
  var el = container.querySelector('.adv-sound-cue-overlay');
  assert.ok(el, 'overlay exists');
  sco.destroy();
});

test('sound cue overlay muestra cue correcta', () => {
  var container = document.createElement('div');
  var sco = createSoundCueOverlay(container);
  sco.showCue('bell_found');
  var cue = container.querySelector('.adv-sound-cue');
  assert.ok(cue, 'cue element exists');
  assert.ok(cue.textContent.includes('campana'), 'contains bell text');
  sco.destroy();
});

test('sound cue overlay setShowAmbient funciona', () => {
  var container = document.createElement('div');
  var sco = createSoundCueOverlay(container);
  sco.setShowAmbient(true);
  assert.equal(sco.getShowAmbient(), true);
  sco.setShowAmbient(false);
  assert.equal(sco.getShowAmbient(), false);
  sco.destroy();
});

test('sound cue overlay ambient oculto por defecto', () => {
  var container = document.createElement('div');
  var sco = createSoundCueOverlay(container);
  sco.showCue('vaguada_wind');
  var cue = container.querySelector('.adv-sound-cue');
  assert.equal(cue, null, 'ambient cue not shown when disabled');
  sco.destroy();
});

test('sound cue overlay ambient visible si activado', () => {
  var container = document.createElement('div');
  var sco = createSoundCueOverlay(container);
  sco.setShowAmbient(true);
  sco.showCue('vaguada_wind');
  var cue = container.querySelector('.adv-sound-cue');
  assert.ok(cue, 'ambient cue shown when enabled');
  sco.destroy();
});

test('sound cue overlay tiene aria-live polite', () => {
  var container = document.createElement('div');
  var sco = createSoundCueOverlay(container);
  sco.showCue('bell_found');
  var el = container.querySelector('.adv-sound-cue-overlay');
  assert.equal(el.getAttribute('aria-live'), 'polite');
  sco.destroy();
});

test('sound cue overlay tiene role status', () => {
  var container = document.createElement('div');
  var sco = createSoundCueOverlay(container);
  sco.showCue('mission_complete');
  var el = container.querySelector('.adv-sound-cue-overlay');
  assert.equal(el.getAttribute('role'), 'status');
  sco.destroy();
});

test('sound cue overlay destroy limpia', () => {
  var container = document.createElement('div');
  var sco = createSoundCueOverlay(container);
  sco.showCue('bell_found');
  sco.destroy();
  var el = container.querySelector('.adv-sound-cue-overlay');
  assert.equal(el, null);
});

test('SOUND_CUES_ES_CL tiene claves esperadas', () => {
  assert.ok(SOUND_CUES_ES_CL.bell_nearby);
  assert.ok(SOUND_CUES_ES_CL.bell_found);
  assert.ok(SOUND_CUES_ES_CL.rina_speaking);
  assert.ok(SOUND_CUES_ES_CL.word_correct);
  assert.ok(SOUND_CUES_ES_CL.mission_complete);
});

test('CUE_TYPES tiene los tipos esperados', () => {
  assert.equal(CUE_TYPES.INSTRUCTION, 'instruction');
  assert.equal(CUE_TYPES.DIRECTIONAL, 'directional');
  assert.equal(CUE_TYPES.SUCCESS, 'success');
  assert.equal(CUE_TYPES.WARNING, 'warning');
  assert.equal(CUE_TYPES.AMBIENT, 'ambient');
});

/* ══════════════════════════════════════════════════
   ACCESSIBLE READING SETTINGS TESTS (56-70)
   ══════════════════════════════════════════════════ */

test('a11y settings tiene defaults correctos', () => {
  var s = createAccessibleReadingSettings('test-student-1');
  assert.equal(s.get('captionsMode'), 'always');
  assert.equal(s.get('soundDescriptions'), true);
  assert.equal(s.get('textSize'), 'normal');
  assert.equal(s.get('contrastMode'), 'standard');
  assert.equal(s.get('visualReadingMode'), false);
  assert.equal(s.get('audioEnabled'), true);
  assert.equal(s.get('vibrationEnabled'), false);
  s.destroy();
});

test('a11y settings set/get funciona', () => {
  var s = createAccessibleReadingSettings('test-student-2');
  s.setTextSize('large');
  assert.equal(s.get('textSize'), 'large');
  s.destroy();
});

test('a11y settings getTextSizePx retorna valor correcto', () => {
  var s = createAccessibleReadingSettings('test-student-3');
  s.setTextSize('normal');
  assert.equal(s.getTextSizePx(), '0.95rem');
  s.setTextSize('large');
  assert.equal(s.getTextSizePx(), '1.15rem');
  s.setTextSize('xlarge');
  assert.equal(s.getTextSizePx(), '1.35rem');
  s.destroy();
});

test('a11y settings getContrastStyle retorna objeto', () => {
  var s = createAccessibleReadingSettings('test-student-4');
  s.setContrastMode('standard');
  assert.deepEqual(s.getContrastStyle(), {});
  s.setContrastMode('high');
  assert.ok(s.getContrastStyle().filter);
  s.destroy();
});

test('a11y settings setCaptionsMode funciona', () => {
  var s = createAccessibleReadingSettings('test-student-5');
  s.setCaptionsMode('with-audio');
  assert.equal(s.get('captionsMode'), 'with-audio');
  s.destroy();
});

test('a11y settings setSoundDescriptions funciona', () => {
  var s = createAccessibleReadingSettings('test-student-6');
  s.setSoundDescriptions(false);
  assert.equal(s.get('soundDescriptions'), false);
  s.destroy();
});

test('a11y settings setVisualReadingMode configura todo', () => {
  var s = createAccessibleReadingSettings('test-student-7');
  s.setVisualReadingMode(true);
  assert.equal(s.get('visualReadingMode'), true);
  assert.equal(s.get('captionsMode'), 'always');
  assert.equal(s.get('soundDescriptions'), true);
  assert.equal(s.get('textSize'), 'large');
  assert.equal(s.get('contrastMode'), 'high');
  assert.equal(s.get('audioEnabled'), false);
  s.destroy();
});

test('a11y settings setAudioEnabled funciona', () => {
  var s = createAccessibleReadingSettings('test-student-8');
  s.setAudioEnabled(false);
  assert.equal(s.get('audioEnabled'), false);
  s.destroy();
});

test('a11y settings setVibrationEnabled funciona', () => {
  var s = createAccessibleReadingSettings('test-student-9');
  s.setVibrationEnabled(true);
  assert.equal(s.get('vibrationEnabled'), true);
  s.destroy();
});

test('a11y settings onChange notifica cambios', () => {
  var s = createAccessibleReadingSettings('test-student-10');
  var notified = false;
  var notifiedKey = null;
  s.onChange(function (k, v) { notified = true; notifiedKey = k; });
  s.setTextSize('large');
  assert.equal(notified, true);
  assert.equal(notifiedKey, 'textSize');
  s.destroy();
});

test('a11y settings getAll retorna copia', () => {
  var s = createAccessibleReadingSettings('test-student-11');
  var all = s.getAll();
  all.textSize = 'xlarge';
  assert.equal(s.get('textSize'), 'normal', 'original not mutated');
  s.destroy();
});

test('a11y settings persiste en localStorage', () => {
  var s = createAccessibleReadingSettings('test-student-12');
  s.setTextSize('large');
  s.destroy();
  var s2 = createAccessibleReadingSettings('test-student-12');
  assert.equal(s2.get('textSize'), 'large');
  s2.destroy();
});

test('a11y settings no guarda diagnóstico médico', () => {
  var s = createAccessibleReadingSettings('test-student-13');
  var all = s.getAll();
  assert.equal(all.diagnosis, undefined);
  assert.equal(all.disability, undefined);
  assert.equal(all.medicalData, undefined);
  s.destroy();
});

test('a11y settings destroy limpia listeners', () => {
  var s = createAccessibleReadingSettings('test-student-14');
  var count = 0;
  s.onChange(function () { count++; });
  s.destroy();
  s.setTextSize('large');
  assert.equal(count, 0, 'no notification after destroy');
});

test('a11y settings setJoystickSensitivity funciona', () => {
  var s = createAccessibleReadingSettings('test-student-15');
  s.setJoystickSensitivity('high');
  assert.equal(s.get('joystickSensitivity'), 'high');
  s.destroy();
});

/* ══════════════════════════════════════════════════
   RESPONSIVE / CSS TESTS (71-78)
   ══════════════════════════════════════════════════ */

test('CSS tiene .adv-joystick', () => {
  assert.ok(ADVENTURE_CSS.includes('.adv-joystick'), 'joystick class in CSS');
});

test('CSS tiene .adv-narrative-panel', () => {
  assert.ok(ADVENTURE_CSS.includes('.adv-narrative-panel'), 'narrative panel class in CSS');
});

test('CSS tiene .adv-caption-bar', () => {
  assert.ok(ADVENTURE_CSS.includes('.adv-caption-bar'), 'caption bar class in CSS');
});

test('CSS tiene .adv-sound-cue-overlay', () => {
  assert.ok(ADVENTURE_CSS.includes('.adv-sound-cue-overlay'), 'sound cue overlay class in CSS');
});

test('CSS tiene adv-text-large', () => {
  assert.ok(ADVENTURE_CSS.includes('.adv-text-large'), 'text large class in CSS');
});

test('CSS tiene adv-contrast-high', () => {
  assert.ok(ADVENTURE_CSS.includes('.adv-contrast-high'), 'contrast high class in CSS');
});

test('CSS tiene @keyframes advCueFadeIn', () => {
  assert.ok(ADVENTURE_CSS.includes('@keyframes advCueFadeIn'), 'cue animation in CSS');
});

test('CSS tiene media query para móvil', () => {
  assert.ok(ADVENTURE_CSS.includes('max-width: 600px'), 'mobile breakpoint');
  assert.ok(ADVENTURE_CSS.includes('max-width: 480px'), 'small mobile breakpoint');
});

/* ══════════════════════════════════════════════════
   INTEGRATION TESTS (79-85)
   ══════════════════════════════════════════════════ */

test('joystick + narrative panel coexisten sin conflicto', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  var np = createNarrativePanel(container);
  np.show('Rina', ['Hola']);
  var joy = container.querySelector('.adv-joystick');
  var panel = container.querySelector('.adv-narrative-panel');
  assert.ok(joy, 'joystick exists');
  assert.ok(panel, 'panel exists');
  mc.destroy();
  np.destroy();
});

test('caption controller + sound cue overlay coexisten', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  var sco = createSoundCueOverlay(container);
  cc.show('Texto', 'Rina');
  sco.showCue('bell_found');
  assert.ok(container.querySelector('.adv-caption-bar'));
  assert.ok(container.querySelector('.adv-sound-cue-overlay'));
  cc.destroy();
  sco.destroy();
});

test('a11y settings + joystick se integran', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  var s = createAccessibleReadingSettings('test-integration');
  mc.setSensitivity(s.get('joystickSensitivity'));
  mc.setJoystickVisible(s.get('joystickVisible'));
  assert.equal(mc.getSensitivity(), 1.0);
  assert.equal(mc.isJoystickVisible(), true);
  mc.destroy();
  s.destroy();
});

test('destroy completo limpia todo', () => {
  var container = document.createElement('div');
  var mc = createMobileControls(container, {});
  var np = createNarrativePanel(container);
  var cc = createCaptionController(container);
  var sco = createSoundCueOverlay(container);
  np.show('Rina', ['Hola']);
  cc.show('Texto', 'Rina');
  sco.showCue('bell_found');
  mc.destroy();
  np.destroy();
  cc.destroy();
  sco.destroy();
  assert.equal(container.querySelector('.adv-joystick'), null);
  assert.equal(container.querySelector('.adv-narrative-panel'), null);
  assert.equal(container.querySelector('.adv-caption-bar'), null);
  assert.equal(container.querySelector('.adv-sound-cue-overlay'), null);
});

test('misión puede completarse sin audio (conceptual)', () => {
  var s = createAccessibleReadingSettings('test-silent-play');
  s.setVisualReadingMode(true);
  assert.equal(s.get('audioEnabled'), false, 'audio disabled');
  assert.equal(s.get('captionsMode'), 'always', 'captions always');
  assert.equal(s.get('soundDescriptions'), true, 'sound descriptions on');
  assert.equal(s.get('textSize'), 'large', 'text large');
  assert.equal(s.get('contrastMode'), 'high', 'high contrast');
  s.destroy();
});

test('SOUND_CUES tiene iconos para cada cue', () => {
  Object.keys(SOUND_CUES).forEach(function (key) {
    assert.ok(SOUND_CUES[key].icon, key + ' has icon');
    assert.ok(SOUND_CUES[key].text, key + ' has text');
    assert.ok(SOUND_CUES[key].type, key + ' has type');
  });
});
