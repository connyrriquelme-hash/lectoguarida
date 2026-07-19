import test, { after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createTestDom, cleanupTestEnvironment, trackEngine } from './helpers/jsdom-test-environment.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE = resolve(__dirname, '../public/expedicion/solo');

afterEach(() => {
  cleanupTestEnvironment();
});

after(() => {
  cleanupTestEnvironment();
});

function readFile(subpath) {
  return readFileSync(resolve(BASE, subpath), 'utf8');
}

/**
 * Crea un entorno con speechSynthesis simulado.
 * Permite configurar la lista de voces y registrar las locuciones emitidas.
 */
function createDomWithSpeech(voices) {
  const dom = createTestDom({ url: 'http://localhost:3000/expedicion/solo/juego/non_reader/rhyme-catcher' });

  const spoken = [];
  const calls = { cancel: 0, speak: 0 };
  function FakeUtterance(text) {
    this.text = text;
    this.lang = null;
    this.voice = null;
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.onerror = null;
  }
  const synth = {
    getVoices: function () { return voices || []; },
    speak: function (u) { calls.speak++; spoken.push(u.text); },
    cancel: function () { calls.cancel++; },
    getVoicesState: function () { return voices || []; }
  };
  dom.window.speechSynthesis = synth;
  dom.window.SpeechSynthesisUtterance = FakeUtterance;
  dom.window.__spoken = spoken;
  dom.window.__calls = calls;
  return dom;
}

function loadAudioModules(window) {
  const files = [
    'core/audio-manager.js',
    'core/voice-guidance-ui.js'
  ];
  const allSrc = files.map(f => readFile(f)).join('\n');
  const fakeStorage = {};
  const fakeLs = { getItem: (k) => fakeStorage[k] || null, setItem: (k, v) => { fakeStorage[k] = v; }, removeItem: (k) => { delete fakeStorage[k]; } };
  const fn = new Function('window', 'document', 'navigator', 'localStorage', allSrc);
  fn(window, window.document, window.navigator, fakeLs);
}

function espVoice(lang, name) {
  return { lang: lang, name: name || ('voice-' + lang) };
}

// ============================================================
// 1. isSpeechAvailable
// ============================================================
test('isSpeechAvailable es true con speechSynthesis', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadAudioModules(dom.window);
  assert.equal(dom.window.AudioManager.isSpeechAvailable(), true);
});

test('isSpeechAvailable es false sin speechSynthesis', () => {
  const dom = createTestDom({ html: '<!DOCTYPE html><html><body></body></html>' });
  dom.window.speechSynthesis = undefined;
  dom.window.SpeechSynthesisUtterance = undefined;
  loadAudioModules(dom.window);
  assert.equal(dom.window.AudioManager.isSpeechAvailable(), false);
});

// ============================================================
// 2. Selección de voz es-CL
// ============================================================
test('selectChileanSpanishVoice elige es-CL exacto', () => {
  const dom = createDomWithSpeech([espVoice('es-ES'), espVoice('es-CL'), espVoice('es-MX')]);
  loadAudioModules(dom.window);
  const v = dom.window.AudioManager.selectChileanSpanishVoice();
  assert.equal(v.lang, 'es-CL');
});

test('selectChileanSpanishVoice acepta otra voz es-CL (es-CL-x)', () => {
  const dom = createDomWithSpeech([espVoice('es-CL-local'), espVoice('es-ES')]);
  loadAudioModules(dom.window);
  const v = dom.window.AudioManager.selectChileanSpanishVoice();
  assert.equal(v.lang, 'es-CL-local');
});

test('selectChileanSpanishVoice cae a es-419 si no hay es-CL', () => {
  const dom = createDomWithSpeech([espVoice('es-ES'), espVoice('es-419'), espVoice('es-MX')]);
  loadAudioModules(dom.window);
  const v = dom.window.AudioManager.selectChileanSpanishVoice();
  assert.equal(v.lang, 'es-419');
});

test('selectChileanSpanishVoice prefiere latinoamericano antes que es-ES', () => {
  const dom = createDomWithSpeech([espVoice('es-ES'), espVoice('es-AR')]);
  loadAudioModules(dom.window);
  const v = dom.window.AudioManager.selectChileanSpanishVoice();
  assert.equal(v.lang, 'es-AR');
});

test('selectChileanSpanishVoice usa es-ES solo como último recurso', () => {
  const dom = createDomWithSpeech([espVoice('es-ES')]);
  loadAudioModules(dom.window);
  const v = dom.window.AudioManager.selectChileanSpanishVoice();
  assert.equal(v.lang, 'es-ES');
});

test('selectChileanSpanishVoice devuelve null sin voces', () => {
  const dom = createDomWithSpeech([]);
  loadAudioModules(dom.window);
  assert.equal(dom.window.AudioManager.selectChileanSpanishVoice(), null);
});

// ============================================================
// 3. Una sola utterance activa (cancel antes de hablar)
// ============================================================
test('speakInstruction cancela la locución anterior', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadAudioModules(dom.window);
  dom.window.AudioManager.speakInstruction('Hola');
  dom.window.AudioManager.speakInstruction('Adiós');
  assert.equal(dom.window.__calls.cancel, 2);
  assert.equal(dom.window.__calls.speak, 2);
  assert.deepEqual(dom.window.__spoken, ['Hola', 'Adiós']);
});

// ============================================================
// 4. speakInstruction / speakWord / speakPhoneme
// ============================================================
test('speakInstruction usa texto indicado', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadAudioModules(dom.window);
  assert.equal(dom.window.AudioManager.speakInstruction('Toca la imagen'), true);
  assert.equal(dom.window.__spoken[0], 'Toca la imagen');
});

test('speakWord pronuncia la palabra', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadAudioModules(dom.window);
  assert.equal(dom.window.AudioManager.speakWord('Gato'), true);
  assert.equal(dom.window.__spoken[0], 'Gato');
});

test('speakPhoneme da pista fff/foca', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadAudioModules(dom.window);
  dom.window.AudioManager.speakPhoneme('f', ['foca', 'fresa']);
  assert.ok(dom.window.__spoken[0].includes('foca'));
  assert.ok(dom.window.__spoken[0].toLowerCase().startsWith('fff'));
});

test('speakPhoneme da pista mmm/mono', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadAudioModules(dom.window);
  dom.window.AudioManager.speakPhoneme('m', ['mono']);
  assert.ok(dom.window.__spoken[0].includes('mono'));
  assert.ok(dom.window.__spoken[0].toLowerCase().startsWith('mmm'));
});

test('speakPhoneme da pista sss/sapo', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadAudioModules(dom.window);
  dom.window.AudioManager.speakPhoneme('s', ['sapo']);
  assert.ok(dom.window.__spoken[0].includes('sapo'));
  assert.ok(dom.window.__spoken[0].toLowerCase().startsWith('sss'));
});

test('PHONEME_SPEECH_HINTS contiene f, m y s', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadAudioModules(dom.window);
  const hints = dom.window.AudioManager.PHONEME_SPEECH_HINTS;
  assert.ok(hints.f.includes('foca'));
  assert.ok(hints.m.includes('mono'));
  assert.ok(hints.s.includes('sapo'));
});

// ============================================================
// 5. repeatLastInstruction
// ============================================================
test('repeatLastInstruction repite la última instrucción', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadAudioModules(dom.window);
  dom.window.AudioManager.speakInstruction('Escucha la palabra');
  dom.window.AudioManager.repeatLastInstruction();
  assert.equal(dom.window.__spoken[1], 'Escucha la palabra');
});

test('repeatLastInstruction no habla si no hay instrucción previa', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadAudioModules(dom.window);
  assert.equal(dom.window.AudioManager.repeatLastInstruction(), false);
});

// ============================================================
// 6. stopSpeech
// ============================================================
test('stopSpeech cancela la locución activa', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadAudioModules(dom.window);
  dom.window.AudioManager.speakInstruction('Algo');
  dom.window.AudioManager.stopSpeech();
  assert.equal(dom.window.__calls.cancel, 2);
});

// ============================================================
// 7. destroy detiene la voz
// ============================================================
test('destroy llama stopSpeech', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadAudioModules(dom.window);
  dom.window.AudioManager.speakInstruction('Fin');
  dom.window.AudioManager.destroy();
  assert.ok(dom.window.__calls.cancel >= 2);
});

// ============================================================
// 8. Sin SpeechSynthesis no bloquea
// ============================================================
test('speakInstruction no lanza sin speechSynthesis', () => {
  const dom = createTestDom({ html: '<!DOCTYPE html><html><body></body></html>' });
  dom.window.speechSynthesis = undefined;
  dom.window.SpeechSynthesisUtterance = undefined;
  loadAudioModules(dom.window);
  assert.doesNotThrow(() => {
    dom.window.AudioManager.speakInstruction('x');
    dom.window.AudioManager.speakWord('y');
    dom.window.AudioManager.speakPhoneme('f', ['foca']);
    dom.window.AudioManager.repeatLastInstruction();
    dom.window.AudioManager.stopSpeech();
  });
});

// ============================================================
// 9. Error de voz no bloqueante
// ============================================================
test('error de locución se captura sin lanzar', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  dom.window.speechSynthesis.speak = function () { throw new Error('speech fail'); };
  loadAudioModules(dom.window);
  assert.doesNotThrow(() => {
    dom.window.AudioManager.speakInstruction('Hola');
  });
  assert.equal(dom.window.AudioManager.speakInstruction('Hola'), false);
});

// ============================================================
// 10. Ausencia de micrófono y MediaRecorder
// ============================================================
test('AudioManager no usa getUserMedia ni MediaRecorder', () => {
  const src = readFile('core/audio-manager.js');
  assert.equal(/getUserMedia\s*\(/.test(src), false);
  assert.equal(/new MediaRecorder/.test(src), false);
  assert.equal(/navigator\.mediaDevices/.test(src), false);
});

test('voice-guidance-ui no usa micrófono ni MediaRecorder', () => {
  const src = readFile('core/voice-guidance-ui.js');
  assert.equal(src.includes('getUserMedia'), false);
  assert.equal(src.includes('MediaRecorder'), false);
});

// ============================================================
// 11. Botones con teclado y touch (VoiceGuidanceUI)
// ============================================================
function loadBarModules(window) {
  const files = [
    'core/audio-manager.js',
    'core/voice-guidance-ui.js'
  ];
  const allSrc = files.map(f => readFile(f)).join('\n');
  const fn = new Function('window', 'document', 'navigator', allSrc);
  fn(window, window.document, window.navigator);
}

test('barra de voz crea botones Escuchar instrucción, nuevamente y nombre', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadBarModules(dom.window);
  const container = dom.window.document.getElementById('container');
  dom.window.VoiceGuidanceUI.createVoiceGuidanceBar({
    container: container,
    instruction: 'Toca la que rima',
    word: 'Gato'
  });
  const labels = Array.from(container.querySelectorAll('.solo-voice-btn-label')).map(b => b.textContent);
  assert.ok(labels.includes('Escuchar instrucción'));
  assert.ok(labels.includes('Escuchar nuevamente'));
  assert.ok(labels.includes('Escuchar nombre'));
});

test('botón Escuchar instrucción dispara speakInstruction por click y touchend', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadBarModules(dom.window);
  const container = dom.window.document.getElementById('container');
  dom.window.VoiceGuidanceUI.createVoiceGuidanceBar({
    container: container,
    instruction: 'Toca la imagen',
    word: 'Gato'
  });
  const btn = container.querySelector('.solo-voice-btn--instruction');
  btn.dispatchEvent(new dom.window.Event('click'));
  assert.equal(dom.window.__spoken[0], 'Toca la imagen');
  btn.dispatchEvent(new dom.window.Event('touchend'));
  assert.equal(dom.window.__spoken[1], 'Toca la imagen');
});

test('botón Escuchar nombre dispara speakWord', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadBarModules(dom.window);
  const container = dom.window.document.getElementById('container');
  dom.window.VoiceGuidanceUI.createVoiceGuidanceBar({
    container: container,
    instruction: 'X',
    word: 'Mono'
  });
  const btn = container.querySelector('.solo-voice-btn--word');
  btn.dispatchEvent(new dom.window.Event('click'));
  assert.equal(dom.window.__spoken[0], 'Mono');
});

test('botón de sonido dispara speakPhoneme con ejemplos', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadBarModules(dom.window);
  const container = dom.window.document.getElementById('container');
  dom.window.VoiceGuidanceUI.createVoiceGuidanceBar({
    container: container,
    instruction: 'X',
    phoneme: 'f',
    phonemeExamples: ['foca']
  });
  const btn = container.querySelector('.solo-voice-btn--phoneme');
  btn.dispatchEvent(new dom.window.Event('click'));
  assert.ok(dom.window.__spoken[0].includes('foca'));
});

// ============================================================
// 12. Integración en los cuatro juegos (vía engine + plantillas)
// ============================================================
function loadAllSolo(window) {
  const files = [
    'core/solo-state-machine.js',
    'core/game-config-validator.js',
    'core/input-manager.js',
    'core/scoring-engine.js',
    'core/feedback-manager.js',
    'core/reward-manager.js',
    'core/progress-repository.js',
    'core/audio-manager.js',
    'core/voice-guidance-ui.js',
    'core/accessibility-manager.js',
    'core/error-boundary.js',
    'templates/click-selection-template.js',
    'templates/drag-drop-template.js',
    'templates/avatar-movement-template.js',
    'templates/syllable-tap-template.js',
    'templates/falling-items-template.js',
    'plugins/audio-instruction-plugin.js',
    'plugins/timer-plugin.js',
    'plugins/keyboard-input-plugin.js',
    'plugins/reward-plugin.js',
    'plugins/accessibility-plugin.js',
    'core/solo-game-engine.js',
    'core/solo-game-adapter.js',
    'games/vocal-a-game.js',
    'games/non-reader/rhyme-catcher.js',
    'games/non-reader/initial-sound-detector.js',
    'games/non-reader/syllable-counter.js',
    'games/non-reader/final-sound-catcher.js'
  ];
  const allSrc = files.map(f => readFile(f)).join('\n');
  const fakeStorage = {};
  const fakeLs = { getItem: (k) => fakeStorage[k] || null, setItem: (k, v) => { fakeStorage[k] = v; }, removeItem: (k) => { delete fakeStorage[k]; } };
  const fn = new Function('window', 'document', 'navigator', 'localStorage', 'AudioContext', allSrc);
  fn(window, window.document, window.navigator, fakeLs, function () { return { state: 'running', resume: () => Promise.resolve(), close: () => {} }; });
  if (window.SoloGameAdapter && window.SoloGameAdapter.createEngine) {
    const __orig = window.SoloGameAdapter.createEngine;
    window.SoloGameAdapter.createEngine = function (opts) {
      const adapter = __orig.call(this, opts);
      try { trackEngine(adapter.engine); } catch (e) { /* ignore */ }
      return adapter;
    };
  }
}

const GAMES = ['rhyme-catcher', 'initial-sound-detector', 'syllable-counter', 'final-sound-catcher'];

GAMES.forEach(function (id) {
  test('juego ' + id + ' tiene voiceGuidance activo', () => {
    const dom = createDomWithSpeech([espVoice('es-CL')]);
    loadAllSolo(dom.window);
    const game = dom.window.SoloGameAdapter.getGameDef(id);
    assert.equal(game.accessibility.voiceGuidance, true);
  });
});

GAMES.forEach(function (id) {
  test('template de ' + id + ' renderiza barra de voz con speech disponible', () => {
    const dom = createDomWithSpeech([espVoice('es-CL')]);
    loadAllSolo(dom.window);
    const container = dom.window.document.getElementById('container');
    const adapter = dom.window.SoloGameAdapter.createEngine({
      studentProfileId: 'test',
      container: container,
      gameId: id
    });
    adapter.loadAndStart();
    const btns = container.querySelectorAll('.solo-voice-btn');
    assert.ok(btns.length >= 1, 'debe haber al menos un botón de voz');
  });
});

test('cambio de juego detiene la locución activa', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadAllSolo(dom.window);
  const container = dom.window.document.getElementById('container');
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 'test',
    container: container,
    gameId: 'rhyme-catcher'
  });
  adapter.loadAndStart();
  dom.window.AudioManager.speakInstruction('Instrucción uno');
  const cancelsBefore = dom.window.__calls.cancel;
  const adapter2 = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 'test',
    container: container,
    gameId: 'syllable-counter'
  });
  adapter2.loadAndStart();
  assert.ok(dom.window.__calls.cancel >= cancelsBefore);
});

test('retorno al mapa detiene la locución', () => {
  const dom = createDomWithSpeech([espVoice('es-CL')]);
  loadAllSolo(dom.window);
  const container = dom.window.document.getElementById('container');
  const adapter = dom.window.SoloGameAdapter.createEngine({
    studentProfileId: 'test',
    container: container,
    gameId: 'rhyme-catcher'
  });
  adapter.loadAndStart();
  dom.window.AudioManager.speakInstruction('Instrucción');
  const before = dom.window.__calls.cancel;
  adapter.engine.returnToProfileMap();
  assert.ok(dom.window.__calls.cancel >= before);
});

// ============================================================
// 13. Hashes colaborativos intactos
// ============================================================
const COLLAB = [
  ['game.js', 'C19F1841'],
  ['juego.html', '7CC05A92'],
  ['juego-v2.html', '3BAF8F16'],
  ['environment-v2.js', '584685B3'],
  ['environment-v2.css', '9E938C7F'],
  ['auth.js', '515A1249'],
  ['index.html', '22B1EEDE'],
  ['dashboard.html', 'E0D902C5']
];

COLLAB.forEach(function ([file, expected]) {
  test('hash colaborativo ' + file + ' intacto', () => {
    const src = readFileSync(resolve(__dirname, '../public/expedicion/' + file), 'utf8');
    const hash = createHash('sha256').update(src.replace(/\r\n/g, '\n')).digest('hex').substring(0, 8).toUpperCase();
    assert.equal(hash, expected);
  });
});
