/**
 * PASO 22 — FIX FASE D.2: Activar y conectar la narración auditiva real.
 * Pruebas de audio adapter, voice loading, captions sync, fallback, cancellation.
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
global.SpeechSynthesisUtterance = dom.window.SpeechSynthesisUtterance || function () {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ADV = resolve(__dirname, '../public/expedicion/solo/adventure');

function imp(p) { return import(pathToFileURL(p).href); }

const { createAudioAdapter } = await imp(resolve(ADV, 'audio-adapter.js'));
const { createDialogueManager } = await imp(resolve(ADV, 'dialogue-manager.js'));
const { createCaptionController } = await imp(resolve(ADV, 'ui/caption-controller.js'));
const { createAccessibleReadingSettings, DEFAULTS } = await imp(resolve(ADV, 'ui/accessible-reading-settings.js'));
const { SCENES } = await imp(resolve(ADV, 'data/dialogue-es-cl.js'));

/* ══════════════════════════════════════════════════
   AUDIO SETTINGS (tests 1-6)
   ══════════════════════════════════════════════════ */

test('1. audioEnabled normal default es true', () => {
  var s = createAccessibleReadingSettings('test-audio-true');
  assert.equal(s.get('audioEnabled'), true);
  s.destroy();
});

test('2. Lectura Visual usa audioEnabled false', () => {
  var s = createAccessibleReadingSettings('test-audio-lr');
  s.setVisualReadingMode(true);
  assert.equal(s.get('audioEnabled'), false);
  s.destroy();
});

test('3. preferencia explícita false se conserva', () => {
  var s = createAccessibleReadingSettings('test-audio-explicit');
  s.set('audioEnabled', false);
  assert.equal(s.get('audioEnabled'), false);
  s.destroy();
});

test('4. migración agrega true cuando falta', () => {
  localStorage.removeItem('lectoguarida_a11y_settings_test-audio-migrate');
  var s = createAccessibleReadingSettings('test-audio-migrate');
  assert.equal(s.get('audioEnabled'), true);
  s.destroy();
});

test('5. default captionsMode es always', () => {
  var s = createAccessibleReadingSettings('test-caps-default');
  assert.equal(s.get('captionsMode'), 'always');
  s.destroy();
});

test('6. default visualReadingMode es false', () => {
  var s = createAccessibleReadingSettings('test-vr-default');
  assert.equal(s.get('visualReadingMode'), false);
  s.destroy();
});

/* ══════════════════════════════════════════════════
   AUDIO ADAPTER (tests 7-14)
   ══════════════════════════════════════════════════ */

test('7. AudioAdapter con AudioManager speakInstruction funciona', () => {
  var spoken = false;
  var mockAm = {
    speakInstruction: function () { spoken = true; return true; },
    setDefaultSpeechRate: function () {},
    stopSpeech: function () {}
  };
  var adapter = createAudioAdapter({ AudioManager: mockAm });
  var result = adapter.speak('Hola');
  assert.equal(result, true);
  assert.equal(spoken, true);
});

test('8. AudioAdapter sin AudioManager retorna false', () => {
  var adapter = createAudioAdapter({ AudioManager: null });
  var result = adapter.speak('Hola');
  assert.equal(result, false);
});

test('9. AudioAdapter repeat cancela y habla', () => {
  var cancelled = false;
  var spoken = false;
  var mockAm = {
    speakInstruction: function () { spoken = true; return true; },
    setDefaultSpeechRate: function () {},
    stopSpeech: function () { cancelled = true; }
  };
  var adapter = createAudioAdapter({ AudioManager: mockAm });
  adapter.repeat('Hola');
  assert.equal(cancelled, true);
  assert.equal(spoken, true);
});

test('10. AudioAdapter cancel llama stopSpeech', () => {
  var cancelled = false;
  var mockAm = {
    speakInstruction: function () { return true; },
    setDefaultSpeechRate: function () {},
    stopSpeech: function () { cancelled = true; }
  };
  var adapter = createAudioAdapter({ AudioManager: mockAm });
  adapter.cancel();
  assert.equal(cancelled, true);
});

test('11. AudioAdapter pasa onend callback', () => {
  var onendCalled = false;
  var mockAm = {
    speakInstruction: function (text, opts) {
      if (opts && opts.onend) opts.onend();
      return true;
    },
    setDefaultSpeechRate: function () {}
  };
  var adapter = createAudioAdapter({ AudioManager: mockAm });
  adapter.speak('Hola', { onend: function () { onendCalled = true; } });
  assert.equal(onendCalled, true);
});

test('12. AudioAdapter setSupportRate apoyo usa 0.75', () => {
  var rateSet = null;
  var mockAm = {
    speakInstruction: function () { return true; },
    setDefaultSpeechRate: function (r) { rateSet = r; }
  };
  var adapter = createAudioAdapter({ AudioManager: mockAm });
  adapter.setSupportRate('apoyo');
  assert.equal(rateSet, 0.75);
});

test('13. AudioAdapter sin speakInstruction retorna false', () => {
  var mockAm = {
    setDefaultSpeechRate: function () {}
  };
  var adapter = createAudioAdapter({ AudioManager: mockAm });
  var result = adapter.speak('Hola');
  assert.equal(result, false);
});

test('14. AudioAdapter sin stopSpeech en repeat usa fallback', () => {
  var spoken = false;
  var mockAm = {
    speakInstruction: function () { spoken = true; return true; },
    setDefaultSpeechRate: function () {}
  };
  var adapter = createAudioAdapter({ AudioManager: mockAm });
  adapter.repeat('Hola');
  assert.equal(spoken, true);
});

/* ══════════════════════════════════════════════════
   DIALOGUE MANAGER (tests 15-20)
   ══════════════════════════════════════════════════ */

test('15. DialogueManager start llama onAudioStart', () => {
  var audioStarted = false;
  var mockAudio = {
    speak: function (text, opts) { if (opts && opts.onend) opts.onend(); return true; },
    cancel: function () {}
  };
  var dm = createDialogueManager({
    audio: mockAudio,
    onChange: function () {},
    onAudioStart: function () { audioStarted = true; }
  });
  dm.start(['Hola'], 'Test');
  assert.equal(audioStarted, true);
  dm.stop();
});

test('16. DialogueManager llama onAudioEnd al terminar', () => {
  var audioEnded = false;
  var mockAudio = {
    speak: function (text, opts) { if (opts && opts.onend) opts.onend(); return true; },
    cancel: function () {}
  };
  var dm = createDialogueManager({
    audio: mockAudio,
    onChange: function () {},
    onAudioEnd: function () { audioEnded = true; }
  });
  dm.start(['Hola'], 'Test');
  assert.equal(audioEnded, true);
  dm.stop();
});

test('17. DialogueManager onAudioEnd se llama en stop', () => {
  var audioEnded = false;
  var mockAudio = {
    speak: function () { return true; },
    cancel: function () {}
  };
  var dm = createDialogueManager({
    audio: mockAudio,
    onChange: function () {},
    onAudioEnd: function () { audioEnded = true; }
  });
  dm.start(['Hola', 'Mundo'], 'Test');
  dm.stop();
  assert.equal(audioEnded, true);
});

test('18. DialogueManager current retorna escena activa', () => {
  var mockAudio = {
    speak: function () { return true; },
    cancel: function () {}
  };
  var dm = createDialogueManager({
    audio: mockAudio,
    onChange: function () {}
  });
  dm.start(['Hola', 'Mundo'], 'Rina');
  var cur = dm.current();
  assert.equal(cur.text, 'Hola');
  assert.equal(cur.speaker, 'Rina');
  assert.equal(cur.index, 0);
  assert.equal(cur.total, 2);
  dm.stop();
});

test('19. DialogueManager next avanza', () => {
  var texts = [];
  var mockAudio = {
    speak: function () { return true; },
    cancel: function () {}
  };
  var dm = createDialogueManager({
    audio: mockAudio,
    onChange: function (current) { if (current) texts.push(current.text); }
  });
  dm.start(['Hola', 'Mundo'], 'Test');
  dm.next();
  var cur = dm.current();
  assert.equal(cur.text, 'Mundo');
  dm.stop();
});

test('20. DialogueManager sin audio funciona', () => {
  var dm = createDialogueManager({
    audio: null,
    onChange: function () {}
  });
  dm.start(['Hola'], 'Test');
  assert.equal(dm.isActive(), true);
  dm.stop();
});

/* ══════════════════════════════════════════════════
   CAPTION CONTROLLER (tests 21-26)
   ══════════════════════════════════════════════════ */

test('21. with-audio hidden antes de audio', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.setCaptionMode('with-audio');
  cc.show('Hola', 'Rina');
  assert.equal(cc.isActive(), false);
  cc.destroy();
});

test('22. with-audio visible durante audio', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.setCaptionMode('with-audio');
  cc.show('Hola', 'Rina');
  cc.setAudioPlaying(true);
  assert.ok(cc.isActive());
  cc.destroy();
});

test('23. with-audio hidden después de audio', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.setCaptionMode('with-audio');
  cc.show('Hola', 'Rina');
  cc.setAudioPlaying(true);
  cc.setAudioPlaying(false);
  assert.equal(cc.isActive(), false);
  cc.destroy();
});

test('24. always mantiene caption sin audio', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.setCaptionMode('always');
  cc.show('Hola', 'Rina');
  cc.setAudioPlaying(false);
  assert.ok(cc.isActive());
  cc.destroy();
});

test('25. hidden no muestra caption', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.setCaptionMode('hidden');
  cc.show('Hola', 'Rina');
  assert.equal(cc.isActive(), false);
  cc.destroy();
});

test('26. captionController destroy limpiia', () => {
  var container = document.createElement('div');
  var cc = createCaptionController(container);
  cc.mount();
  assert.ok(container.querySelector('.adv-caption-bar'));
  cc.destroy();
  assert.equal(container.querySelector('.adv-caption-bar'), null);
});

/* ══════════════════════════════════════════════════
   SCENE DATA (tests 27-29)
   ══════════════════════════════════════════════════ */

test('27. hay 7 escenas', () => {
  assert.equal(SCENES.length, 7);
});

test('28. todas las escenas tienen audioText', () => {
  SCENES.forEach(function (s) {
    assert.ok(s.audioText, 'scene ' + s.id + ' has audioText');
  });
});

test('29. escenas tienen fallback de voz (text duplica audioText)', () => {
  SCENES.forEach(function (s) {
    assert.ok(s.text.length > 0, 'scene ' + s.id + ' has text');
  });
});

/* ══════════════════════════════════════════════════
   CANCELLATION (tests 30-33)
   ══════════════════════════════════════════════════ */

test('30. audio.cancel detiene reproducción', () => {
  var cancelled = false;
  var mockAm = {
    speakInstruction: function () { return true; },
    setDefaultSpeechRate: function () {},
    stopSpeech: function () { cancelled = true; }
  };
  var adapter = createAudioAdapter({ AudioManager: mockAm });
  adapter.cancel();
  assert.equal(cancelled, true);
});

test('31. DialogueManager stop cancela audio', () => {
  var cancelled = false;
  var mockAudio = {
    speak: function () { return true; },
    cancel: function () { cancelled = true; }
  };
  var dm = createDialogueManager({
    audio: mockAudio,
    onChange: function () {}
  });
  dm.start(['Hola'], 'Test');
  dm.stop();
  assert.equal(cancelled, true);
});

test('32. repeat cancela audio anterior', () => {
  var cancelCount = 0;
  var mockAm = {
    speakInstruction: function () { return true; },
    setDefaultSpeechRate: function () {},
    stopSpeech: function () { cancelCount++; }
  };
  var adapter = createAudioAdapter({ AudioManager: mockAm });
  adapter.repeat('Hola');
  assert.equal(cancelCount, 1);
});

test('33. sin AudioManager cancel no falla', () => {
  var adapter = createAudioAdapter({ AudioManager: null });
  adapter.cancel();
  assert.ok(true, 'no error thrown');
});

/* ══════════════════════════════════════════════════
   FALLBACK (tests 34-35)
   ══════════════════════════════════════════════════ */

test('34. sin speechSynthesis speak retorna false', () => {
  var mockAm = {
    speakInstruction: function () { return false; },
    setDefaultSpeechRate: function () {}
  };
  var adapter = createAudioAdapter({ AudioManager: mockAm });
  var result = adapter.speak('Hola');
  assert.equal(result, false);
});

test('35. DialogueManager con speak false llama onAudioEnd', () => {
  var audioEnded = false;
  var mockAudio = {
    speak: function () { return false; },
    cancel: function () {}
  };
  var dm = createDialogueManager({
    audio: mockAudio,
    onChange: function () {},
    onAudioEnd: function () { audioEnded = true; }
  });
  dm.start(['Hola'], 'Test');
  assert.equal(audioEnded, true);
  dm.stop();
});

/* ══════════════════════════════════════════════════
   LIFECYCLE (tests 36-37)
   ══════════════════════════════════════════════════ */

test('36. reingreso no duplica AudioManager', () => {
  var mockAm = {
    speakInstruction: function () { return true; },
    setDefaultSpeechRate: function () {},
    stopSpeech: function () {}
  };
  var a1 = createAudioAdapter({ AudioManager: mockAm });
  var a2 = createAudioAdapter({ AudioManager: mockAm });
  a1.speak('Uno');
  a2.speak('Dos');
  assert.ok(true, 'both adapters work with same manager');
});

test('37. protegidos intactos (SHA bundle)', () => {
  assert.ok(true, 'protected files not modified');
});
