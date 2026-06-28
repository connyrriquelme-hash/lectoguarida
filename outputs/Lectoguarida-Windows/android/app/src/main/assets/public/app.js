import { adventureZones, readingRoutes, zoneForReading, miniGameCatalog } from './adventure-data.js';

const app = document.querySelector('#app');
const homeButton = document.querySelector('#homeButton');
const sessionBadge = document.querySelector('#sessionBadge');
const toast = document.querySelector('#toast');

const skinCatalog = {
  archetype: [
    ['axolotl', 'Axolote luminoso', '🫧'], ['capybara', 'Capibara nube', '☁️'], ['cosmic-cat', 'Gatito cósmico', '🐱'],
    ['garden-dino', 'Dino jardinero', '🦕'], ['pastel-panda', 'Panda pastel', '🐼'], ['forest-fox', 'Zorrito del bosque', '🦊'],
    ['cardboard-robot', 'Robot de cartón', '🤖'], ['rainbow-unicorn', 'Unicornio arcoíris', '🦄'], ['artist-octopus', 'Pulpo artista', '🐙'],
    ['library-owl', 'Búho bibliotecario', '🦉'], ['music-frog', 'Rana musical', '🐸'], ['bubble-dragon', 'Dragón de burbujas', '🐲'],
    ['space-rabbit','Conejo espacial','🐰'],['river-otter','Nutria del río','🦦'],['hummingbird','Picaflor curioso','🐦'],['sea-turtle','Tortuga marina','🐢'],['mountain-llama','Llama de montaña','🦙'],['happy-pudu','Pudú feliz','🦌'],['star-whale','Ballena estelar','🐋'],['koala-reader','Koala lector','🐨'],['chinchilla','Chinchilla andina','🐭'],['red-panda','Panda rojo','🐼'],['friendly-bee','Abeja amistosa','🐝'],['sleepy-sloth','Perezoso soñador','🦥'],['moon-bat','Murciélago lunar','🦇'],['little-penguin','Pingüino explorador','🐧'],['wise-huemul','Huemul sabio','🦌'],['curious-vizcacha','Vizcacha curiosa','🐇'],['magic-seal','Foca mágica','🦭'],['tiny-alpaca','Alpaca de nube','🦙']
  ],
  palette: [['coral','Coral','🧡'],['aqua','Aqua','🩵'],['violet','Violeta','💜'],['gold','Dorado','💛'],['mint','Menta','💚'],['sky','Cielo','💙'],['rose','Rosa','🌸'],['ocean','Océano','🌊'],['sunset','Atardecer','🌇'],['lime','Lima','🍋'],['lavender','Lavanda','🪻'],['cocoa','Cacao','🍫']],
  outfit: [['explorer','Exploradora','🧭'],['reader','Lectora','📚'],['artist','Artista','🎨'],['scientist','Científica','🔬'],['gardener','Jardinera','🌱'],['musician','Música','🎵'],['astronomer','Astrónoma','🔭'],['veterinarian','Veterinaria','🩺'],['chef','Chef','👩‍🍳'],['cartographer','Cartógrafa','🗺️'],['storyteller','Narradora','📜'],['meteorologist','Meteoróloga','🌦️'],['paleontologist','Paleontóloga','🦴'],['dancer','Bailarina','💃'],['builder','Constructora','🛠️']],
  accessory: [['star-glasses','Lentes estrella','🤩'],['flower-crown','Corona de flores','🌼'],['headphones','Audífonos','🎧'],['backpack','Mochila','🎒'],['scarf','Bufanda','🧣'],['cap','Gorra','🧢'],['binoculars','Binoculares','🔭'],['telescope','Telescopio','🔭'],['magnifier','Lupa','🔎'],['compass','Brújula','🧭'],['leaf-pin','Prendedor hoja','🍃'],['comet-pin','Prendedor cometa','☄️'],['rainbow-boots','Botas arcoíris','🌈'],['magic-pencil','Lápiz mágico','✏️'],['camera','Cámara','📷'],['book-hat','Sombrero libro','📘'],['shell-necklace','Collar marino','🐚'],['planet-ring','Anillo planeta','🪐']],
  companion: [['firefly','Luciérnaga','✨'],['cloud','Nubecita','☁️'],['star','Estrellita','⭐'],['book-sprite','Libro duende','📖'],['butterfly','Mariposa','🦋'],['mini-comet','Mini cometa','☄️'],['mini-hummingbird','Mini picaflor','🐦'],['mini-pudu','Mini pudú','🦌'],['mini-penguin','Mini pingüino','🐧'],['mini-otter','Mini nutria','🦦'],['mini-turtle','Mini tortuga','🐢'],['mini-llama','Mini llama','🦙'],['mini-bee','Mini abeja','🐝'],['fox-cub','Zorrito compañero','🦊'],['mini-whale','Ballena nube','🐋']]
};
const shopBasePrices = { archetype: 150, palette: 60, outfit: 100, accessory: 80, companion: 120 };
const stickerPackPrice = 50;
const stickerPityLimit = 5;
const stickerSets = [
  ['Humedales de Chile',[['wet-chercan','Chercán cantor','🐦','common'],['wet-garza','Garza tranquila','🪶','common'],['wet-tagua','Tagua nadadora','🦆','common'],['wet-coipo','Coipo amable','🦫','common'],['wet-junco','Junco verde','🌾','common'],['wet-rana','Rana de humedal','🐸','common'],['wet-libelula','Libélula azul','🪲','common'],['wet-cisne','Cisne brillante','🦢','rare'],['wet-martin','Martín pescador','🐦','rare'],['wet-picaflor','Picaflor legendario','✨','legendary']]],
  ['Cuerpo y bienestar',[['body-heart','Corazón activo','❤️','common'],['body-lungs','Pulmones de aire','🫁','common'],['body-stomach','Estómago feliz','🥣','common'],['body-brain','Cerebro curioso','🧠','common'],['body-hands','Manos limpias','🧼','common'],['body-water','Agua vital','💧','common'],['body-apple','Manzana energética','🍎','common'],['body-skeleton','Esqueleto bailarín','🦴','rare'],['body-muscle','Músculo valiente','💪','rare'],['body-guardian','Guardián del bienestar','🏅','legendary']]],
  ['Agua y clima',[['clima-drop','Gotita viajera','💧','common'],['clima-cloud','Nube suave','☁️','common'],['clima-rain','Lluvia cantora','🌧️','common'],['clima-snow','Copo de nieve','❄️','common'],['clima-sun','Sol cálido','☀️','common'],['clima-wind','Viento veloz','🌬️','common'],['clima-rainbow','Arcoíris lector','🌈','common'],['clima-storm','Tormenta especial','⛈️','rare'],['clima-cycle','Ciclo del agua','🔄','rare'],['clima-crystal','Gota de cristal','💎','legendary']]],
  ['Paisajes de Chile',[['land-desert','Desierto florido','🏜️','common'],['land-valley','Valle luminoso','🏞️','common'],['land-mountain','Montaña nevada','🏔️','common'],['land-forest','Bosque profundo','🌲','common'],['land-river','Río viajero','🌊','common'],['land-island','Isla del sur','🏝️','common'],['land-glacier','Glaciar azul','🧊','common'],['land-volcano','Volcán brillante','🌋','rare'],['land-torres','Torres del viento','⛰️','rare'],['land-chile','Chile estelar','🇨🇱','legendary']]],
  ['Pueblos y memorias',[['memory-loom','Telar de colores','🧶','common'],['memory-clay','Vasija de greda','🏺','common'],['memory-canoe','Canoa viajera','🛶','common'],['memory-drum','Kultrún de memoria','🥁','common'],['memory-basket','Canasto tejido','🧺','common'],['memory-seed','Semilla ancestral','🌱','common'],['memory-shell','Concha del sur','🐚','common'],['memory-condor','Cóndor protector','🦅','rare'],['memory-moai','Moái de historia','🗿','rare'],['memory-fire','Fuego de la memoria','🔥','legendary']]],
  ['Universo lector',[['read-book','Libro explorador','📘','common'],['read-pencil','Lápiz creador','✏️','common'],['read-letter','Letra brillante','🔤','common'],['read-mic','Micrófono lector','🎙️','common'],['read-library','Biblioteca nube','📚','common'],['read-telescope','Telescopio curioso','🔭','common'],['read-planet','Planeta palabra','🪐','common'],['read-comet','Cometa narrador','☄️','rare'],['read-galaxy','Galaxia de cuentos','🌌','rare'],['read-guardian','Guardián de la lectura','🏆','legendary']]],
  ['Clásicos de la Guarida',[['bee-reader','Abeja lectora','🐝','common'],['happy-book','Libro feliz','📘','common'],['letter-star','Estrella A','🌟','common'],['pencil-hero','Lápiz héroe','✏️','common'],['moon-reader','Luna lectora','🌙','common'],['frog-rhythm','Rana rítmica','🐸','common'],['magic-mic','Micrófono mágico','🎙️','rare'],['rainbow-book','Libro arcoíris','🌈','rare'],['owl-master','Búho maestro','🦉','rare'],['comet-word','Cometa palabra','☄️','rare'],['golden-guardian','Guardián dorado','🏆','legendary'],['crystal-castle','Castillo de cristal','🏰','legendary']]]
];
const stickerCatalog = stickerSets.flatMap(([set, items]) => items.map((item) => [...item, set]));
const shopPrice = (part, id) => {
  const index = skinCatalog[part].findIndex(([value]) => value === id);
  return index <= 0 ? 0 : shopBasePrices[part] + (index - 1) * 5;
};
const inventoryKey = (part, id) => `${part}:${id}`;
function inventoryDetails(key = '') {
  const [part, id] = String(key).split(':');
  const item = skinCatalog[part]?.find(([value]) => value === id);
  const partName = { archetype:'Personaje', palette:'Color', outfit:'Vestuario', accessory:'Accesorio', companion:'Compañero' }[part] || 'Objeto';
  return { part, id, name:item?.[1] || id, icon:item?.[2] || '🎁', partName };
}
const ownsItem = (student, part, id) => id === skinCatalog[part][0][0] || (student?.unlocked || []).includes(inventoryKey(part, id));

function skinOption(part, id) {
  return skinCatalog[part].find(([value]) => value === id) || skinCatalog[part][0];
}

function skinAvatar(student, size = 'normal') {
  const skin = student?.skin || { archetype: 'axolotl', palette: 'coral', outfit: 'explorer', accessory: 'star-glasses', companion: 'firefly' };
  const character = skinOption('archetype', skin.archetype);
  const outfit = skinOption('outfit', skin.outfit);
  const accessory = skinOption('accessory', skin.accessory);
  const companion = skinOption('companion', skin.companion);
  return `<span class="skin-avatar skin-${escapeHtml(skin.palette)} skin-${size}" aria-label="${escapeHtml(character[1])}"><span class="skin-character">${character[2]}</span><span class="skin-outfit">${outfit[2]}</span><span class="skin-accessory">${accessory[2]}</span><span class="skin-companion">${companion[2]}</span></span>`;
}

const state = {
  view: 'home',
  routePreference: 'starting',
  students: [],
  student: null,
  reading: null,
  mapReadings: [],
  warmupAnswer: null,
  warmupBuild: '',
  transcript: '',
  elapsedSeconds: 0,
  startedAt: null,
  recognition: null,
  listening: false,
  mediaRecorder: null,
  recordingStream: null,
  recordedChunks: [],
  recordingUrl: '',
  hasRecording: false,
  recordingPlaying: false,
  instructionSpeaking: false,
  comprehensionAnswer: null,
  result: null,
  teacherToken: sessionStorage.getItem('teacherToken') || '',
  classCode: sessionStorage.getItem('classCode') || '',
  studentToken: sessionStorage.getItem('studentToken') || '',
  studentSessionId: sessionStorage.getItem('studentSessionId') || '',
  pinDigits: '',
  pinMode: 'login',
  firstPin: '',
  teacher: null,
  dashboard: null,
  skinDraft: null,
  shopReturn: 'students',
  packResult: null,
  packOpening: null,
  dailyReward: null,
  karaokePlaying: false,
  karaokeWord: -1,
  neuralAudio: null,
  tradeData: null,
  tradeTarget: '',
  studentQuery: '',
  installPrompt: null
};

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  state.installPrompt = event;
  if (state.view === 'home') render();
});

window.addEventListener('lectoguarida-native-speech', (event) => {
  const detail = event.detail || {};
  if (detail.type === 'instruction-start' || detail.type === 'instruction-end') {
    state.instructionSpeaking = detail.type === 'instruction-start';
    document.querySelectorAll('[data-action="speak-instruction"]').forEach((button) => {
      button.classList.toggle('speaking', state.instructionSpeaking);
      button.setAttribute('aria-pressed', String(state.instructionSpeaking));
    });
    return;
  }
  if (detail.type === 'instruction-error') {
    state.instructionSpeaking = false;
    showToast(detail.message || 'No pude reproducir la instrucción por audio.');
    return;
  }
  if (detail.type === 'recording-ready') {
    state.hasRecording = true;
    state.recordingPlaying = false;
    if (state.view === 'reading') render();
    return;
  }
  if (detail.type === 'recording-playback-start' || detail.type === 'recording-playback-end') {
    state.recordingPlaying = detail.type === 'recording-playback-start';
    if (state.view === 'reading') render();
    return;
  }
  if (detail.type === 'recording-error') {
    state.recordingPlaying = false;
    showToast(detail.message || 'No pude preparar la grabación. Puedes intentarlo otra vez.');
    if (state.view === 'reading') render();
    return;
  }
  if (detail.type === 'start') {
    state.listening = true;
    if (state.view === 'reading') render();
    return;
  }
  if (detail.type === 'partial' || detail.type === 'result') {
    state.transcript = String(detail.transcript || '').trim();
    const box = app.querySelector('#transcript');
    if (box) box.value = state.transcript;
    return;
  }
  if (detail.type === 'error') {
    state.listening = false;
    showToast(detail.message || 'El oído mágico tuvo una dificultad. Puedes escribir la lectura.');
    if (state.view === 'reading') render();
    return;
  }
  if (detail.type === 'end') {
    state.listening = false;
    if (state.view === 'reading') render();
  }
});

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.classCode) headers['X-Class-Code'] = state.classCode;
  if (path.startsWith('/api/teacher/') && state.teacherToken) headers.Authorization = `Bearer ${state.teacherToken}`;
  else if (state.studentToken) headers.Authorization = `Bearer ${state.studentToken}`;
  if (window.lectoguaridaLocalApi) return window.lectoguaridaLocalApi(path, { ...options, headers });
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'No fue posible completar la acción');
  return data;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.add('hidden'), 3200);
}

function setSession(text = '') {
  sessionBadge.textContent = text;
  sessionBadge.classList.toggle('hidden', !text);
}

function stopRecognition() {
  if (window.LectoguaridaSpeech && state.listening) window.LectoguaridaSpeech.stop();
  else if (state.recognition && state.listening) state.recognition.stop();
  stopWebRecording();
  state.listening = false;
}

function clearRecording() {
  stopWebRecording();
  if (state.recordingUrl) URL.revokeObjectURL(state.recordingUrl);
  state.recordingUrl = '';
  state.recordedChunks = [];
  state.hasRecording = false;
  state.recordingPlaying = false;
}

function instructionButton(text, compact = false) {
  return `<button type="button" class="instruction-audio ${compact ? 'compact' : ''}" data-action="speak-instruction" data-text="${escapeHtml(text)}" aria-label="Escuchar instrucciones" aria-pressed="false"><span aria-hidden="true">🔊</span><strong>${compact ? 'Escuchar' : 'Escuchar instrucciones'}</strong></button>`;
}

function setSpeaking(active) {
  state.instructionSpeaking = active;
  document.querySelectorAll('.instruction-audio').forEach((button) => button.classList.toggle('speaking', active));
}

async function fetchNeuralAudio(text) {
  if (!state.studentToken || sessionStorage.getItem('neuralTtsUnavailable') === '1') return null;
  const response = await fetch('/api/tts', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'X-Class-Code':state.classCode, Authorization:`Bearer ${state.studentToken}` },
    body:JSON.stringify({ studentId:state.student.id, text })
  });
  if (!response.ok) {
    if (response.status === 502 || response.status === 503) sessionStorage.setItem('neuralTtsUnavailable','1');
    return null;
  }
  const blob = await response.blob();
  return new Audio(URL.createObjectURL(blob));
}

async function speakInstruction(text) {
  const clean = String(text || '').trim();
  if (!clean) return;
  state.neuralAudio?.pause?.();
  try {
    const audio = await fetchNeuralAudio(clean);
    if (audio) {
      state.neuralAudio = audio;
      setSpeaking(true);
      const done = () => { setSpeaking(false); URL.revokeObjectURL(audio.src); };
      audio.onended = done; audio.onerror = done;
      await audio.play();
      return;
    }
  } catch {}
  if (window.LectoguaridaSpeech?.speak) {
    window.LectoguaridaSpeech.speak(clean, 'es-CL');
    return;
  }
  if (!('speechSynthesis' in window)) return showToast('Este dispositivo no ofrece lectura de instrucciones por audio.');
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((item)=>/^es-CL$/i.test(item.lang)) || voices.find((item)=>/^es-419$/i.test(item.lang)) || voices.find((item)=>/^es-MX$/i.test(item.lang)) || voices.find((item)=>/^es/i.test(item.lang));
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang || 'es-CL';
  utterance.rate = 0.9;
  utterance.pitch = 1.04;
  utterance.onstart = () => setSpeaking(true);
  utterance.onend = utterance.onerror = () => setSpeaking(false);
  window.speechSynthesis.speak(utterance);
}

function setKaraokeWord(index) {
  state.karaokeWord = index;
  document.querySelectorAll('.karaoke-word').forEach((word, wordIndex) => {
    word.classList.toggle('active', wordIndex === index);
    word.classList.toggle('passed', wordIndex < index);
  });
}

function stopKaraoke() {
  state.neuralAudio?.pause?.();
  window.speechSynthesis?.cancel();
  window.clearInterval(state.karaokeTimer);
  state.karaokePlaying = false;
  setKaraokeWord(-1);
  document.querySelector('[data-action="karaoke-reading"]')?.classList.remove('speaking');
}

async function startKaraokeReading() {
  if (state.karaokePlaying) { stopKaraoke(); return render(); }
  const text = state.reading.text;
  const words = text.trim().split(/\s+/);
  state.karaokePlaying = true;
  render();
  const button = document.querySelector('[data-action="karaoke-reading"]');
  button?.classList.add('speaking');
  try {
    const audio = await fetchNeuralAudio(text);
    if (audio) {
      state.neuralAudio = audio;
      await new Promise((resolve) => { audio.onloadedmetadata = resolve; audio.load(); });
      const weights = words.map((word) => Math.max(2, word.replace(/[^a-záéíóúñü]/gi,'').length));
      const total = weights.reduce((sum,value)=>sum+value,0);
      const cumulative = weights.reduce((items,value)=>{items.push((items.at(-1)||0)+value);return items;},[]);
      state.karaokeTimer = window.setInterval(() => {
        const position = audio.duration ? (audio.currentTime / audio.duration) * total : 0;
        setKaraokeWord(Math.max(0,cumulative.findIndex((value)=>value>=position)));
      },80);
      audio.onended = audio.onerror = () => { stopKaraoke(); render(); };
      await audio.play();
      return;
    }
  } catch {}
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang='es-CL'; utterance.rate=.82; utterance.pitch=1.02;
    utterance.onboundary=(event)=>{const prefix=text.slice(0,event.charIndex);setKaraokeWord(Math.max(0,prefix.trim().split(/\s+/).length-1));};
    utterance.onend=utterance.onerror=()=>{stopKaraoke();render();};
    window.speechSynthesis.speak(utterance);
  } else {
    let index=0; setKaraokeWord(0);
    state.karaokeTimer=window.setInterval(()=>{index+=1;if(index>=words.length){stopKaraoke();render();}else setKaraokeWord(index);},430);
    window.LectoguaridaSpeech?.speak(text,'es-CL');
  }
}

function playRewardChime(isSpecial = false) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const notes = isSpecial ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const startsAt = context.currentTime + index * (isSpecial ? 0.12 : 0.09);
      oscillator.type = isSpecial ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, startsAt);
      gain.gain.exponentialRampToValueAtTime(0.12, startsAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.24);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + 0.26);
    });
    setTimeout(() => context.close().catch(() => {}), 1200);
  } catch {}
}

function rarityLabel(rarity) {
  return rarity === 'legendary' ? 'Legendario' : rarity === 'rare' ? 'Raro' : 'Común';
}

async function startWebRecording() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return false;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  state.recordingStream = stream;
  state.recordedChunks = [];
  const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported?.(type));
  const recorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);
  state.mediaRecorder = recorder;
  recorder.ondataavailable = (event) => { if (event.data?.size) state.recordedChunks.push(event.data); };
  recorder.onstop = () => {
    if (state.recordingUrl) URL.revokeObjectURL(state.recordingUrl);
    const blob = new Blob(state.recordedChunks, { type: recorder.mimeType || 'audio/webm' });
    state.recordingUrl = blob.size ? URL.createObjectURL(blob) : '';
    state.hasRecording = Boolean(state.recordingUrl);
    state.recordingPlaying = false;
    state.recordingStream?.getTracks().forEach((track) => track.stop());
    state.recordingStream = null;
    state.mediaRecorder = null;
    if (state.view === 'reading') render();
  };
  recorder.start(250);
  return true;
}

function stopWebRecording() {
  if (state.mediaRecorder?.state === 'recording') state.mediaRecorder.stop();
  else if (state.recordingStream) {
    state.recordingStream.getTracks().forEach((track) => track.stop());
    state.recordingStream = null;
  }
}

function playRecordedReading() {
  if (window.LectoguaridaSpeech?.playRecording) {
    window.LectoguaridaSpeech.playRecording();
    return;
  }
  if (!state.recordingUrl) return showToast('Primero graba tu lectura con el micrófono.');
  const audio = new Audio(state.recordingUrl);
  state.recordingPlaying = true;
  render();
  audio.onended = audio.onerror = () => { state.recordingPlaying = false; if (state.view === 'reading') render(); };
  audio.play().catch(() => { state.recordingPlaying = false; showToast('No pude reproducir el audio. Intenta grabarlo nuevamente.'); render(); });
}

function resetToHome() {
  stopRecognition();
  clearRecording();
  state.neuralAudio?.pause?.();
  window.speechSynthesis?.cancel();
  state.studentToken = '';
  state.studentSessionId = '';
  sessionStorage.removeItem('studentToken');
  sessionStorage.removeItem('studentSessionId');
  Object.assign(state, {
    view: 'home', student: null, reading: null, warmupAnswer: null, warmupBuild: '', transcript: '', elapsedSeconds: 0,
    startedAt: null, recognition: null, listening: false, comprehensionAnswer: null, result: null
  });
  setSession('');
  render();
}

homeButton.addEventListener('click', resetToHome);

function homeView() {
  return `
    <section class="hero">
      <div>
        <div class="hero-kicker"><p class="eyebrow">Juego chileno de fluidez lectora</p><span class="hd-badge">Edición HD · 2.º básico</span></div>
        <h1>Tu voz abre Lectoguarida.</h1>
        <p class="lead">Una aventura exclusiva para 2.º básico: lee con ritmo, crea tu guardián y descubre pistas. Aquí equivocarse no quita vidas; muestra el próximo camino.</p>
        <div class="role-grid">
          <button class="role-card" data-action="student-entry">
            <span class="icon">🧭</span><h3>Soy estudiante</h3>
            <p>Entrar a una misión de lectura y ganar luz para mi avatar.</p>
          </button>
          <button class="role-card" data-action="teacher-entry">
            <span class="icon">🔭</span><h3>Soy profesora</h3>
            <p>Conny administra hasta 40 perfiles, puntajes, habilidades y focos de apoyo.</p>
          </button>
        </div>
        ${state.installPrompt ? '<div class="btn-row"><button class="btn btn-secondary" data-action="install-app">📲 Instalar Lectoguarida</button></div>' : ''}
      </div>
      <div class="hero-art" aria-hidden="true"><div class="orbit"></div><div class="planet">🏕️</div></div>
    </section>`;
}

function classLoginView() {
  return `
    <button class="back-link" data-action="home">← Volver</button>
    <section class="card pin-card">
      <p class="eyebrow">Entrada protegida · 2.º básico</p><h2>Abre la puerta de tu curso</h2>
      <p class="lead">Escribe el código que Conny compartió con tu familia.</p>
      ${instructionButton('Escribe el código de tu curso y presiona Entrar a Lectoguarida.', true)}
      <form id="classLoginForm"><label>Código del curso<input id="classCode" type="text" inputmode="text" maxlength="24" autocomplete="off" autocapitalize="characters" placeholder="Ej.: GUARIDA-27" required></label><div class="btn-row"><button class="btn btn-primary" type="submit">Entrar a Lectoguarida</button></div></form>
      <p style="margin-top:20px;color:var(--muted);font-size:13px">Este código protege los nombres y avances del curso.</p>
    </section>`;
}

async function loadStudents() {
  state.students = await api('/api/students');
}

async function enterStudentSession(result) {
  state.student = result.student;
  state.studentToken = result.token;
  state.studentSessionId = result.student.id;
  state.routePreference = localStorage.getItem(`lectoguarida-route-${result.student.id}`) || 'starting';
  sessionStorage.setItem('studentToken', result.token);
  sessionStorage.setItem('studentSessionId', result.student.id);
  const readings = await api(`/api/readings?grade=${state.student.grade}&studentId=${encodeURIComponent(state.student.id)}`);
  state.mapReadings = readings;
  state.reading = readings.find((item) => item.current) || readings[0];
  state.pinDigits = '';
  state.firstPin = '';
  state.view = 'map';
  setSession(`${state.student.avatar} ${state.student.name}`);
  render();
}

function studentsView() {
  const query = state.studentQuery.trim().toLocaleLowerCase('es-CL');
  const students = state.students.filter((student) => student.grade === 2);
  const visibleCount = students.filter((student) => student.name.toLocaleLowerCase('es-CL').includes(query)).length;
  return `
    <button class="back-link" data-action="home">← Volver</button>
    <div class="section-head"><div><p class="eyebrow">2.º básico · ${students.length} guardianes</p><h2>¿Quién entra a la guarida?</h2>${instructionButton('Busca tu primer nombre y apellido. Luego presiona entrar para comenzar tu misión.', true)}</div><p>Tu progreso, habilidades y skin quedan guardados.</p></div>
    <div class="profile-toolbar card-lite">
      <label class="search-box"><span>Buscar estudiante</span><input id="studentSearch" type="search" value="${escapeHtml(state.studentQuery)}" placeholder="Ej.: Luna Núñez" autocomplete="off"></label>
      <div class="profile-count"><strong id="profileCount">${visibleCount}</strong><span>perfiles visibles</span></div>
    </div>
    <div class="profile-grid">
      ${students.map((student) => {
        const character = skinOption('archetype', student.skin?.archetype);
        const outfit = skinOption('outfit', student.skin?.outfit);
        const companion = skinOption('companion', student.skin?.companion);
        const level = Math.floor(Number(student.xp || 0) / 100) + 1;
        const hidden = query && !student.name.toLocaleLowerCase('es-CL').includes(query) ? ' hidden' : '';
        return `<article class="profile-card${hidden}" data-name="${escapeHtml(student.name.toLocaleLowerCase('es-CL'))}">
          <div class="profile-card-head">${skinAvatar(student)}<span class="level-badge">Nivel ${level}</span></div>
          <strong>${escapeHtml(student.name)}</strong>
          <div class="profile-meta"><span>2.º básico</span><span>${student.xp} XP · 🪙 ${student.coins || 0}</span></div>
          <div class="profile-characteristics">
            <div><span>Guardián</span><strong>${escapeHtml(character[1])}</strong></div>
            <div><span>Estilo</span><strong>${escapeHtml(outfit[1])}</strong></div>
            <div><span>Compañero</span><strong>${escapeHtml(companion[1])}</strong></div>
          </div>
          <div class="profile-actions"><button class="btn btn-primary" data-action="select-student" data-id="${student.id}">${student.hasPin ? '🔐 Entrar con PIN' : '✨ Crear mi PIN'}</button></div>
        </article>`;
      }).join('')}
      <div id="profileEmpty" class="empty profile-empty ${visibleCount ? 'hidden' : ''}">No encontramos ese nombre. Revisa la escritura e inténtalo otra vez.</div>
    </div>`;
}

function studentPinView() {
  const setup = state.pinMode === 'setup' || state.pinMode === 'confirm';
  const title = state.pinMode === 'confirm' ? 'Repite tu nuevo PIN' : setup ? 'Crea tu PIN secreto' : `Hola, ${escapeHtml(state.student.name)}`;
  const guidance = state.pinMode === 'confirm' ? 'Escribe los mismos cuatro números para confirmarlo.' : setup ? 'Elige cuatro números que puedas recordar. No uses tu fecha de nacimiento.' : 'Escribe tus cuatro números para abrir tu progreso.';
  const dots = Array.from({ length:4 }, (_, index) => `<span class="${index < state.pinDigits.length ? 'filled' : ''}">${index < state.pinDigits.length ? '●' : '○'}</span>`).join('');
  const keys = [1,2,3,4,5,6,7,8,9,'back',0];
  const submitLabel = state.pinMode === 'confirm' ? 'Crear PIN y entrar' : state.pinMode === 'setup' ? 'Continuar para repetirlo' : 'Entrar a mi mapa';
  return `<button class="back-link" data-action="cancel-pin">← Elegir otro perfil</button>
    <section class="card student-pin-card">
      <div>${skinAvatar(state.student, 'large')}</div><p class="eyebrow">Perfil protegido</p><h2>${title}</h2><p class="lead">${guidance}</p>
      ${instructionButton(`${title}. ${guidance}`, true)}
      ${setup ? `<div class="pin-steps"><span class="${state.pinMode==='setup'?'active':'done'}">1 · Elegir</span><span class="${state.pinMode==='confirm'?'active':''}">2 · Repetir</span><span>3 · Entrar</span></div>` : ''}
      <div class="pin-dots" aria-label="${state.pinDigits.length} de 4 números escritos">${dots}</div>
      <div class="number-pad" aria-label="Teclado numérico">${keys.map((key) => key === 'back' ? '<button data-action="pin-backspace" aria-label="Borrar último número">⌫</button>' : `<button data-action="pin-key" data-value="${key}" aria-label="Número ${key}">${key}</button>`).join('')}<span aria-hidden="true"></span></div>
      <button class="btn btn-primary pin-main-action" data-action="pin-submit" ${state.pinDigits.length === 4 ? '' : 'disabled'}>${submitLabel}</button>
      <p class="privacy-audio">🔒 El PIN se guarda cifrado. Si algo falla, Conny puede crear uno nuevo desde su panel.</p>
      <button class="btn btn-ghost pin-help-button" data-action="pin-help">¿No puedes crear o recordar el PIN?</button>
      <div class="pin-help hidden" id="pinHelp"><strong>Solución rápida</strong><p>Pide a Conny que abra tu ficha en el panel docente y escriba un PIN nuevo de cuatro números. Nunca perderás tus puntos.</p></div>
    </section>`;
}

function skinEditorView() {
  const student = state.student;
  const draftStudent = { ...student, skin: state.skinDraft };
  const groups = [
    ['archetype', 'Personaje original'], ['palette', 'Color de energía'], ['outfit', 'Vocación'], ['accessory', 'Accesorio'], ['companion', 'Compañero']
  ];
  return `
    <button class="back-link" data-action="students">← Volver a los perfiles</button>
    <section class="card skin-editor">
      <div class="skin-editor-head"><div>${skinAvatar(draftStudent, 'large')}</div><div><p class="eyebrow">Taller de caracterización</p><h2>La skin de ${escapeHtml(student.name)}</h2><p class="lead">Combina personajes y accesorios originales. Ningún cambio afecta el puntaje.</p></div></div>
      ${groups.map(([part, label]) => `<fieldset class="skin-group"><legend>${label}</legend><div class="skin-options">${skinCatalog[part].map(([id, name, icon]) => { const owned = ownsItem(student, part, id); return `<button type="button" class="skin-option ${state.skinDraft[part] === id ? 'selected' : ''} ${owned ? '' : 'locked'}" ${owned ? `data-action="choose-skin" data-part="${part}" data-value="${id}"` : 'disabled'}><span>${owned ? icon : '🔒'}</span><small>${escapeHtml(name)}</small></button>`; }).join('')}</div></fieldset>`).join('')}
      <div class="btn-row"><button class="btn btn-primary" data-action="save-skin">Guardar mi guardián ✦</button><button class="btn btn-ghost" data-action="random-skin">Sorpréndeme</button><button class="btn btn-coin" data-action="open-current-shop">🪙 Tienda · ${student.coins || 0}</button></div>
      <p class="safety-note">Colección propia de Lectoguarida: 12 arquetipos amables, sin armas, combate ni personajes de franquicias.</p>
    </section>`;
}

const refugeCatalog = [
  ['library','Biblioteca de palabras','📚'],
  ['garden','Jardín de sonidos','🌱'],
  ['observatory','Observatorio de historias','🔭'],
  ['musicRoom','Sala del ritmo','🎵']
];

function refugeView() {
  const levels = state.student.refuge || {};
  const total = refugeCatalog.reduce((sum,[id]) => sum + Number(levels[id] || 0), 0);
  return `<button class="back-link" data-action="map">← Volver al mapa</button>
    <section class="card refuge-hero"><div>${skinAvatar(state.student,'large')}</div><div><p class="eyebrow">Construcción sin compras reales</p><h2>El refugio de ${escapeHtml(state.student.name)}</h2><p class="lead">Cada lectura te ayuda a construir un lugar propio, pieza por pieza.</p></div><div class="coin-wallet">🪙 <strong>${state.student.coins || 0}</strong><span>coins</span></div></section>
    <div class="refuge-grid">${refugeCatalog.map(([id,name,icon])=>{const level=Number(levels[id]||0);const cost=40+level*30;return `<article class="card refuge-part level-${level}"><span class="refuge-icon">${icon}</span><h3>${name}</h3><div class="build-level" aria-label="Nivel ${level} de 5">${Array.from({length:5},(_,i)=>`<i class="${i<level?'built':''}"></i>`).join('')}</div><p>${level>=5?'¡Construcción completa!':`Próxima mejora: ${cost} coins`}</p><button class="btn ${level>=5?'btn-ghost':'btn-coin'}" data-action="upgrade-refuge" data-part="${id}" ${level>=5?'disabled':''}>${level>=5?'✓ Completo':'Construir nivel '+(level+1)}</button></article>`}).join('')}</div>
    <section class="card refuge-progress"><strong>Progreso total del refugio</strong><span>${total}/20 mejoras</span><div class="progress-line"><span style="width:${Math.round(total/20*100)}%"></span></div></section>`;
}

function mapView() {
  const completed = state.mapReadings.filter((reading) => reading.completed).length;
  const totalLevels = state.mapReadings.length;
  const route = readingRoutes.find((item)=>item.id===state.routePreference) || readingRoutes[0];
  const zoned = new Map(adventureZones.map((zone)=>[zone.id,[]]));
  const stageCounters = {};
  state.mapReadings.forEach((reading)=>{const index=stageCounters[reading.stage]||0;stageCounters[reading.stage]=index+1;zoned.get(zoneForReading(reading,index))?.push(reading);});
  return `<section class="map-header card">
    <div>${skinAvatar(state.student, 'large')}</div><div><p class="eyebrow">Mundo 2.5D explorable</p><h2>Lectoguarida de ${escapeHtml(state.student.name)}</h2><p class="lead">Cruza portales, reúne llaves y fortalece habilidades del Currículum Nacional.</p></div>
    <div class="map-counters"><span>🔥 <strong>${state.student.streak || 0}</strong><small>racha diaria</small></span><span>🪙 <strong>${state.student.coins || 0}</strong><small>coins</small></span><span>✨ <strong>${state.student.exchangeStars || 0}</strong><small>estrellas</small></span><span>🧠 <strong>${Object.keys(state.student.skillProgress || {}).length}</strong><small>habilidades</small></span><span>⭐ <strong>${completed}/${totalLevels}</strong><small>niveles</small></span></div>
  </section>
  ${state.dailyReward ? `<section class="card daily-reveal"><span>🎁</span><div><p class="eyebrow">Premio diario</p><h3>${escapeHtml(state.dailyReward.label)}</h3><p>+${state.dailyReward.coins} coins${state.dailyReward.stars?` · +${state.dailyReward.stars} estrellas`:''}</p></div></section>` : ''}
  <section class="route-selector card"><div><p class="eyebrow">Ruta adaptativa</p><h3>${route.icon} ${route.name}</h3><p>${route.help}</p></div><div>${readingRoutes.map((item)=>`<button class="route-button ${item.id===route.id?'active':''}" data-action="select-route" data-route="${item.id}"><span>${item.icon}</span><strong>${item.name}</strong><small>${item.help}</small></button>`).join('')}</div></section>
  <section class="world3d-shell card"><div><p class="eyebrow">Mapa 3D interactivo</p><h3>Toca un portal para viajar</h3></div><div id="world3dMap" role="img" aria-label="Diez portales tridimensionales de Lectoguarida"></div></section>
  <div class="map-actions"><button class="btn btn-primary" data-action="claim-daily">🎁 Cofre diario</button><button class="btn btn-secondary" data-action="open-skills">🧠 Mis habilidades</button><button class="btn btn-secondary" data-action="open-refuge">🏡 Mi refugio</button><button class="btn btn-coin" data-action="open-map-shop">🛍️ Tienda</button><button class="btn btn-secondary" data-action="open-trades">🔄 Intercambios</button><button class="btn btn-secondary" data-action="open-album">📒 Álbum</button><button class="btn btn-ghost" data-action="students">Cambiar perfil</button></div>
  <section class="bonus-dock card"><div><p class="eyebrow">Minijuegos entre misiones</p><h3>Bonus de la guarida</h3></div>${miniGameCatalog.map((game)=>`<span title="${game.name}">${game.icon}<small>${game.name}</small></span>`).join('')}</section>
  <div class="adventure-map world-map">
  ${adventureZones.map((zone,zoneIndex) => { const levels=zoned.get(zone.id)||[]; const done=levels.filter((item)=>item.completed).length; return levels.length ? `<section class="map-stage world-zone zone-${zone.id}" style="--zone-index:${zoneIndex}"><header><span>${zone.icon}</span><div><p class="eyebrow">Portal ${zoneIndex+1} · ${done}/${levels.length}</p><h3>${zone.name}</h3><small>${zone.objective}</small></div><b>${done===levels.length?'🏆':done?'✨':'🔒'}</b></header><div class="level-path">${levels.map((reading,index)=>`<button class="level-node ${reading.completed?'completed':''} ${reading.current?'current':''} ${reading.locked?'locked':''} side-${index%2}" data-action="select-level" data-id="${reading.id}" ${reading.locked?'disabled':''}><span class="node-orb">${reading.completed?'✓':reading.locked?'🔒':escapeHtml(reading.focusSymbol||String(reading.order))}</span><span class="node-copy"><small>Nivel ${reading.order} · ${index<Math.ceil(levels.length/3)?'Inicial':index<Math.ceil(levels.length*2/3)?'Medio':'Avanzado'}</small><strong>${escapeHtml(reading.title)}</strong><em>${reading.completed?'Habilidad desbloqueada':reading.current?'¡Entra al portal!':'Disponible'}</em></span></button>`).join('')}</div></section>` : ''; }).join('')}
  </div>`;
}

function missionView() {
  const curriculum = state.reading.curriculum;
  const totalLevels = state.mapReadings.length || 105;
  const missionInstruction = `Hola ${state.student.name}. Completa tres actividades. Primero responde el calentamiento. Después lee el texto en voz alta y escucha tu grabación. Finalmente resuelve la pista de comprensión.`;
  return `
    <button class="back-link" data-action="map">← Volver al mapa</button>
    <section class="card">
      <div class="mission-heading"><div>${skinAvatar(state.student, 'large')}</div><div><p class="eyebrow">Nivel ${state.reading.level} · ${escapeHtml(state.reading.stage || 'Fluidez')} · Ruta ${state.reading.order}/${totalLevels}</p><h2>${escapeHtml(state.reading.world)}</h2></div><div class="focus-rune">${escapeHtml(state.reading.focusSymbol || '⚡')}</div></div>
      <p class="lead">${escapeHtml(state.reading.title)}: lee el mensaje para descubrir la pista escondida.</p>
      ${instructionButton(missionInstruction)}
      <div class="mission-strip"><span>Modo <strong>${escapeHtml(state.reading.challenge.name)}</strong> · ${escapeHtml(state.reading.challenge.focus)}</span><span>Recompensa <strong>20+ XP · 5+ coins</strong></span></div>
      <div class="curriculum-card"><strong>Ruta curricular chilena</strong><div class="focus-list"><span class="chip">${escapeHtml(curriculum.fluencyOA)}</span><span class="chip">${escapeHtml(curriculum.supportOA)}</span><span class="chip">${escapeHtml(curriculum.transversal.theme)}</span></div><small>${escapeHtml(curriculum.transversal.category)} · ${escapeHtml(curriculum.transversal.objective)}</small></div>
      <div class="activity-path">
        <div><span>1</span><strong>Calentamiento</strong><small>Sonidos y vocabulario</small></div>
        <div><span>2</span><strong>Lectura oral</strong><small>Precisión y fluidez</small></div>
        <div><span>3</span><strong>Comprensión</strong><small>Usar la pista</small></div>
      </div>
      <div class="btn-row"><button class="btn btn-primary" data-action="begin-reading">Comenzar las 3 actividades ✦</button><button class="btn btn-ghost" data-action="edit-current-skin">Editar mi skin</button></div>
    </section>`;
}

function warmupView() {
  const warmup = state.reading.warmup;
  const audioInstruction = `${warmup.prompt} Elige la respuesta correcta y luego presiona Encender la runa.`;
  return `
    <button class="back-link" data-action="back-mission">← Volver a la misión</button>
    <section class="card">
      <p class="eyebrow">Actividad 1 de 3 · Calentamiento</p>
      <div class="activity-title"><h2>${escapeHtml(warmup.prompt)}</h2>${instructionButton(audioInstruction, true)}</div>
      <p class="lead">Activa la runa correcta para preparar tu voz.</p>
      ${warmup.mode === 'write' ? `<label class="written-answer">Tu respuesta<input id="writtenWarmup" maxlength="20" autocomplete="off" placeholder="${escapeHtml(warmup.placeholder || 'Escribe aquí')}" value="${escapeHtml(state.warmupAnswer || '')}"></label>` : ''}
      ${warmup.mode === 'build' ? `<div class="tile-builder"><div id="tileDropZone" class="build-result drop-zone" data-drop-type="tile">${escapeHtml(state.warmupBuild || 'Arrastra o toca las letras')}</div><div class="letter-tiles">${warmup.options.map((option) => `<button class="letter-tile" draggable="true" data-drag-type="tile" data-action="append-tile" data-value="${escapeHtml(option.id)}">${escapeHtml(option.label)}</button>`).join('')}</div><button class="btn btn-ghost" data-action="clear-tiles">Borrar</button></div>` : ''}
      ${!warmup.mode || warmup.mode === 'tap' ? `<div class="scene-grid">
        ${warmup.options.map((option) => `
          <button class="scene-card word-bubble ${state.warmupAnswer === option.id ? 'selected popped' : ''}" data-action="select-warmup" data-id="${option.id}">
            <span class="scene-icon">${option.icon}</span><strong>${escapeHtml(option.label)}</strong>
          </button>`).join('')}
      </div>` : ''}
      <div class="btn-row"><button class="btn btn-primary" data-action="finish-warmup" ${state.warmupAnswer ? '' : 'disabled'}>Encender la runa →</button></div>
    </section>`;
}

function readingView() {
  const canNativeSpeech = Boolean(window.LectoguaridaSpeech);
  const canSpeech = canNativeSpeech || Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const speechHint = canNativeSpeech ? 'Usa el reconocimiento de voz del teléfono y permite el micrófono.' : (canSpeech ? 'Usa Edge o Chrome y permite el micrófono.' : 'Este navegador no ofrece reconocimiento de voz. Usa la transcripción manual.');
  const readInstruction = `Lee en voz alta el texto que aparece en pantalla. Presiona Usar micrófono para comenzar. Cuando termines, detén la grabación y escucha tu propia lectura antes de continuar.`;
  const karaokeWords = state.reading.text.trim().split(/\s+/).map((word,index)=>`<span class="karaoke-word ${index===state.karaokeWord?'active':''} ${index<state.karaokeWord?'passed':''}">${escapeHtml(word)}</span>`).join(' ');
  return `
    <div class="mission-strip"><span>${escapeHtml(state.reading.world)} · <strong>${escapeHtml(state.reading.title)}</strong></span><span id="timer">00:00</span></div>
    <div class="reading-shell">
      <section class="card">
        <p class="eyebrow">Actividad 2 de 3 · Lee en voz alta</p>
        ${instructionButton(readInstruction)}
        <button class="instruction-audio karaoke-control ${state.karaokePlaying?'speaking':''}" data-action="karaoke-reading"><span>🎵</span><strong>${state.karaokePlaying?'Detener lectura guiada':'Lectura guiada tipo karaoke'}</strong></button>
        <div class="reading-text karaoke-text">${karaokeWords}</div>
        <label>Lo que escuchó el oído mágico
          <textarea id="transcript" class="transcript-box" placeholder="La transcripción aparecerá aquí. También puedes escribirla para probar." aria-label="Transcripción de lectura">${escapeHtml(state.transcript)}</textarea>
        </label>
        <div class="btn-row">
          <button class="btn btn-ghost" data-action="sample-reading">Cargar lectura de prueba</button>
          <button class="btn btn-primary" data-action="go-comprehension">Ya terminé →</button>
        </div>
        <section class="recording-review ${state.hasRecording ? 'ready' : ''}" aria-live="polite">
          <div class="recording-review-icon">${state.hasRecording ? '🎧' : '🎙️'}</div>
          <div><strong>${state.hasRecording ? 'Tu lectura está lista para escuchar' : 'Aquí aparecerá tu grabación'}</strong><p>${state.hasRecording ? 'Escúchate con calma. Nota tus pausas, ritmo y expresión.' : 'Graba con el micrófono y detén la grabación al terminar.'}</p></div>
          <button class="btn btn-secondary" data-action="play-recording" ${state.hasRecording ? '' : 'disabled'}>${state.recordingPlaying ? '🔊 Reproduciendo…' : '▶ Escuchar mi lectura'}</button>
        </section>
        <p class="privacy-audio">🔒 La grabación queda solo en este dispositivo y se reemplaza al comenzar una nueva misión.</p>
      </section>
      <aside class="card mic-panel">
        <div id="micOrb" class="mic-orb ${state.listening ? 'listening' : ''}">🎙️</div>
        <h3>${state.listening ? 'Te estoy escuchando…' : 'Oído mágico'}</h3>
        <p id="micStatus" class="status">${speechHint}</p>
        <button class="btn ${state.listening ? 'btn-danger' : 'btn-secondary'}" data-action="toggle-mic" ${canSpeech ? '' : 'disabled'}>${state.listening ? 'Detener' : 'Usar micrófono'}</button>
      </aside>
    </div>`;
}

function comprehensionView() {
  const task = state.reading.comprehension;
  const audioInstruction = `${task.prompt} Usa la información del relato y elige la escena correcta. Después presiona Activar la pista.`;
  return `
    <button class="back-link" data-action="back-reading">← Volver a la lectura</button>
    <section class="card">
      <p class="eyebrow">Actividad 3 de 3 · Usa la pista del relato</p><div class="activity-title"><h2>${escapeHtml(task.prompt)}</h2>${instructionButton(audioInstruction, true)}</div>
      <p class="lead">No es una prueba: arrastra al guardián hacia la escena correcta o tócala.</p>
      <div class="drag-character" draggable="true" data-drag-type="character" aria-label="Guardián para arrastrar">${state.student.avatar || '🫧'}<small>Arrástrame</small></div>
      <div class="scene-grid">
        ${task.options.map((option) => `
          <button class="scene-card drop-scene ${state.comprehensionAnswer === option.id ? 'selected' : ''}" data-drop-type="scene" data-action="select-scene" data-id="${option.id}">
            <span class="scene-icon">${option.icon}</span><strong>${escapeHtml(option.label)}</strong>
          </button>`).join('')}
      </div>
      <div class="btn-row"><button class="btn btn-primary" data-action="submit-attempt" ${state.comprehensionAnswer ? '' : 'disabled'}>Activar la pista ✦</button></div>
    </section>`;
}

function resultView() {
  const scores = state.result.attempt.scores;
  const skill = state.result.skillAward;
  return `
    <div class="celebration-layer" aria-hidden="true">${['★','✦','●','★','✦','●','★','✦','●','★','✦','●'].map((shape,index)=>`<i style="--i:${index}">${shape}</i>`).join('')}</div>
    <section class="card score-hero">
      <p class="eyebrow">Misión completada</p>
      <h2>${escapeHtml(scores.message)}</h2>
      <div class="streak-celebration">🔥 <strong>${state.student.streak || 1} días de racha</strong>${scores.streakBonus?`<span>+${scores.streakBonus} coins de constancia</span>`:''}</div>
      <div class="score-ring" style="--score:${scores.overall}"><span>${scores.overall}</span></div>
      <div class="stat-grid">
        <div class="stat"><strong>${scores.warmup}%</strong><span>Calentamiento</span></div>
        <div class="stat"><strong>${scores.accuracy}%</strong><span>Precisión</span></div>
        <div class="stat"><strong>${scores.wpm}</strong><span>Palabras/minuto</span></div>
        <div class="stat"><strong>${scores.comprehension}%</strong><span>Comprensión</span></div>
        <div class="stat"><strong>+${scores.xp}</strong><span>XP ganado</span></div>
        <div class="stat coin-stat"><strong>+${scores.coins || 0}</strong><span>Coins ganadas</span></div>
      </div>
      <div class="focus-list">${scores.focus.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join('')}</div>
      ${skill ? `<section class="skill-unlock ${skill.newlyUnlocked?'new':''}"><span>🧠</span><div><small>${skill.newlyUnlocked?'Nueva habilidad curricular':'Habilidad fortalecida'}</small><strong>${escapeHtml(skill.label)}</strong><p>${escapeHtml(skill.oa)} · Dominio ${skill.level}/3 · ${skill.points}/12 puntos</p></div></section>` : ''}
      <p class="lead" style="margin:22px auto 0">La profesora Conny ya puede ver este resultado en su panel.</p>
      <div class="btn-row" style="justify-content:center"><button class="btn btn-primary" data-action="new-mission">Siguiente aventura</button><button class="btn btn-ghost" data-action="home">Salir</button></div>
    </section>`;
}

function skillsView() {
  const skills = Object.values(state.student.skillProgress || {}).sort((a,b)=>String(a.domain).localeCompare(String(b.domain),'es') || String(a.label).localeCompare(String(b.label),'es'));
  const domains = [...new Set(skills.map((skill)=>skill.domain))];
  return `<button class="back-link" data-action="map">← Volver al mapa</button><section class="card skills-hero"><div><p class="eyebrow">Currículum chileno en progreso</p><h2>Habilidades de ${escapeHtml(state.student.name)}</h2><p class="lead">Cada misión entrega hasta tres puntos: calentamiento, lectura oral y comprensión. Repite para subir de Inicial a Experta.</p></div><div class="skill-total">🧠<strong>${skills.length}</strong><span>desbloqueadas</span></div></section>
  ${skills.length ? domains.map((domain)=>`<section class="skill-domain"><h3>${escapeHtml(domain)}</h3><div class="skill-grid">${skills.filter((skill)=>skill.domain===domain).map((skill)=>{const mastery=['','Inicial','En progreso','Experta'][skill.level]||'Inicial';return `<article class="skill-card level-${skill.level}"><div><span>🧩</span><small>${mastery}</small></div><strong>${escapeHtml(skill.label)}</strong><p>${escapeHtml(skill.oa)}</p><div class="progress-line"><span style="width:${Math.round(skill.points/12*100)}%"></span></div><em>${skill.points}/12 puntos curriculares</em></article>`;}).join('')}</div></section>`).join('') : '<section class="card empty">Completa tu primera misión para desbloquear una habilidad curricular.</section>'}`;
}

function tradesView() {
  const data = state.tradeData || { fee:10, mine:[], offers:[], students:[] };
  const incoming = data.offers.filter((offer) => offer.toStudentId === state.student.id && offer.status === 'pending');
  const history = data.offers.filter((offer) => offer.fromStudentId === state.student.id || offer.status !== 'pending');
  const myOwned = state.student.unlocked || [];
  const candidates = data.students.filter((student) => student.inventory?.some((key)=>!myOwned.includes(key)) && data.mine.some((key)=>!(student.owned||[]).includes(key)));
  const target = candidates.find((student) => student.id === (state.tradeTarget || candidates[0]?.id));
  if (target && !state.tradeTarget) state.tradeTarget = target.id;
  const statusLabel = { pending:'Esperando respuesta', accepted:'Intercambio completado', rejected:'Propuesta rechazada' };
  const offerCard = (offer, actionable = false) => {
    const give = inventoryDetails(offer.offeredKey); const receive = inventoryDetails(offer.requestedKey);
    return `<article class="trade-card ${offer.status}"><p class="eyebrow">${actionable ? `${escapeHtml(offer.fromName)} te propone` : `Con ${escapeHtml(offer.toName)}`}</p><div class="trade-swap"><span>${give.icon}<small>${escapeHtml(give.name)}</small></span><b>⇄</b><span>${receive.icon}<small>${escapeHtml(receive.name)}</small></span></div><p>${statusLabel[offer.status] || offer.status} · ${offer.fee} coins por perfil</p>${actionable ? `<div class="btn-row"><button class="btn btn-primary" data-action="trade-respond" data-id="${offer.id}" data-decision="accept">Aceptar intercambio</button><button class="btn btn-ghost" data-action="trade-respond" data-id="${offer.id}" data-decision="reject">Rechazar</button></div>` : ''}</article>`;
  };
  const mineForTarget = target ? data.mine.filter((key)=>!(target.owned||[]).includes(key)) : [];
  const targetForMe = target ? target.inventory.filter((key)=>!myOwned.includes(key)) : [];
  return `<button class="back-link" data-action="map">← Volver al mapa</button><section class="card trade-hero"><div><p class="eyebrow">Intercambio justo y sin dinero real</p><h2>Mercado amistoso</h2><p class="lead">Ambos estudiantes deben aceptar. Cada perfil paga ${data.fee} coins y recibe un objeto que todavía no tiene.</p></div><div class="coin-wallet">🪙 <strong>${state.student.coins || 0}</strong><span>coins</span></div></section>
  ${incoming.length ? `<section class="trade-section"><h3>Propuestas para ti</h3><div class="trade-grid">${incoming.map((offer) => offerCard(offer, true)).join('')}</div></section>` : ''}
  <section class="card trade-builder"><h3>Crear una propuesta</h3>${mineForTarget.length && targetForMe.length ? `<form id="tradeOfferForm"><label>Yo entrego<select id="tradeOffered">${mineForTarget.map((key) => { const item=inventoryDetails(key); return `<option value="${escapeHtml(key)}">${item.icon} ${escapeHtml(item.name)}</option>`; }).join('')}</select></label><span class="trade-arrow">⇄</span><label>Intercambio con<select id="tradeTarget">${candidates.map((student) => `<option value="${student.id}" ${student.id===target.id?'selected':''}>${escapeHtml(student.name)}</option>`).join('')}</select></label><label>Quiero recibir<select id="tradeRequested">${targetForMe.map((key) => { const item=inventoryDetails(key); return `<option value="${escapeHtml(key)}">${item.icon} ${escapeHtml(item.name)}</option>`; }).join('')}</select></label><button class="btn btn-primary" type="submit">Enviar propuesta · ${data.fee} coins al aceptar</button></form>` : '<div class="empty">Para intercambiar, tú y otro perfil deben tener objetos comprados que no estén equipados.</div>'}</section>
  ${history.length ? `<section class="trade-section"><h3>Historial de propuestas</h3><div class="trade-grid">${history.map((offer) => offerCard(offer)).join('')}</div></section>` : ''}`;
}

function albumSetsMarkup() {
  return `<div class="album-sets">${stickerSets.map(([setName, items]) => {
    const collected = items.filter(([id]) => Number(state.student.stickers?.[id] || 0) > 0).length;
    return `<section class="album-set"><div class="album-set-title"><div><p class="eyebrow">${collected}/${items.length} encontrados</p><h3>${escapeHtml(setName)}</h3></div><span>📚</span></div><div class="album-grid">${items.map(([id,name,icon,rarity])=>{const count=Number(state.student.stickers?.[id]||0);return `<article class="album-slot ${count?'collected':'missing'} rarity-${rarity}"><span>${count?icon:'?'}</span><strong>${count?escapeHtml(name):'Sticker misterioso'}</strong><small>${count?`x${count}`:rarity==='legendary'?'Legendario':'Por descubrir'}</small></article>`;}).join('')}</div></section>`;
  }).join('')}</div>`;
}

function legacyShopView() {
  const groups = [['archetype','Personajes'],['palette','Colores'],['outfit','Vocaciones'],['accessory','Accesorios'],['companion','Compañeros']];
  const ownedCount = stickerCatalog.filter(([id]) => Number(state.student.stickers?.[id] || 0) > 0).length;
  return `<button class="back-link" data-action="back-from-shop">← Volver</button>
    <section class="card shop-hero"><div><p class="eyebrow">Bazar de la Guarida</p><h2>Desbloquea nuevas skins</h2><p class="lead">Juega misiones para ganar coins. Comprar objetos no cambia el puntaje lector.</p></div><div class="coin-wallet">🪙 <strong>${state.student.coins || 0}</strong><span>coins</span></div></section>
    <nav class="shop-tabs" aria-label="Categorías de tienda"><a href="#skins">🎭 Skins</a><a href="#stickers">📒 Stickers</a></nav>
    <div id="skins">${groups.map(([part,label]) => `<section class="shop-section"><h3>${label}</h3><div class="shop-grid">${skinCatalog[part].map(([id,name,icon]) => { const owned=ownsItem(state.student,part,id); const price=shopPrice(part,id); return `<article class="shop-item ${owned?'owned':''}"><span class="shop-icon">${icon}</span><strong>${escapeHtml(name)}</strong><small>${owned?'Desbloqueado':`${price} coins`}</small><button class="btn ${owned?'btn-ghost':'btn-coin'}" ${owned?'disabled':`data-action="purchase-item" data-part="${part}" data-value="${id}"`}>${owned?'✓ Tuyo':'Comprar'}</button></article>`; }).join('')}</div></section>`).join('')}</div>
    <section id="stickers" class="sticker-store card"><div><p class="eyebrow">Colección sorpresa</p><h2>Álbum de stickers</h2><p>Completa tu álbum sin dinero real. Los duplicados devuelven coins.</p><div class="probability-row"><span>Común 72%</span><span>Raro 23%</span><span>Legendario 5%</span></div></div><div class="sticker-pack"><div class="pack-art">✉️<span>?</span></div><strong>Sobre sorpresa · 3 stickers</strong><small>Raro garantizado como máximo cada 5 sobres</small><button class="btn btn-coin" data-action="open-sticker-pack" ${(state.student.coins||0)<stickerPackPrice?'disabled':''}>Abrir por ${stickerPackPrice} coins</button></div></section>
    ${state.packResult ? `<section class="pack-reveal card"><p class="eyebrow">¡Sobre abierto!</p><h2>Tu nueva colección</h2><div class="reveal-grid">${state.packResult.results.map((item)=>`<article class="sticker-card rarity-${item.rarity}"><span>${item.icon}</span><strong>${escapeHtml(item.name)}</strong><small>${item.rarity==='legendary'?'Legendario':item.rarity==='rare'?'Raro':'Común'}${item.duplicate?` · Repetido +${item.refund} coins`:''}</small></article>`).join('')}</div></section>` : ''}
    <section class="album-section"><div class="section-head"><div><p class="eyebrow">${ownedCount}/${stickerCatalog.length} encontrados · ${stickerSets.length} colecciones</p><h2>Mi gran álbum</h2></div></div>${albumSetsMarkup()}</section>`;
}

function shopView() {
  const groups = [['archetype','Personajes'],['palette','Colores'],['outfit','Vocaciones'],['accessory','Accesorios'],['companion','Compañeros']];
  const ownedCount = stickerCatalog.filter(([id]) => Number(state.student.stickers?.[id] || 0) > 0).length;
  const pityProgress = Math.min(stickerPityLimit - 1, Number(state.student.packsSinceRare || 0));
  const pityRemaining = stickerPityLimit - pityProgress;
  const pityDots = Array.from({ length: stickerPityLimit }, (_, index) => `<span class="${index < pityProgress ? 'filled' : ''}" aria-hidden="true">${index < pityProgress ? '★' : '☆'}</span>`).join('');
  const specialResult = Boolean(state.packResult?.results?.some((item) => item.rarity !== 'common'));
  const packReveal = state.packOpening
    ? `<section class="pack-reveal pack-opening ${state.packOpening.special ? 'special' : 'common'} card" aria-live="polite"><div class="opening-envelope">✉️<i>✨</i></div><p class="eyebrow">Abriendo con magia...</p><h2>${state.packOpening.special ? '¡Este sobre está brillando!' : '¡Llegan nuevos stickers!'}</h2></section>`
    : state.packResult
      ? `<section class="pack-reveal ${specialResult ? 'special-reveal' : 'common-reveal'} card" aria-live="polite"><p class="eyebrow">${state.packResult.pityTriggered ? '¡Meta brillante completada!' : '¡Sobre abierto!'}</p><h2>${specialResult ? '¡Increíble, encontraste uno especial!' : '¡Tu colección sigue creciendo!'}</h2><div class="reveal-grid">${state.packResult.results.map((item)=>`<article class="sticker-card rarity-${item.rarity}"><span>${item.icon}</span><strong>${escapeHtml(item.name)}</strong><small>${rarityLabel(item.rarity)}${item.duplicate?` · Repetido +${item.refund} coins`:''}</small></article>`).join('')}</div>${state.packResult.duplicateRefund ? `<p class="refund-note">♻️ Recuperaste ${state.packResult.duplicateRefund} coins por repetidos.</p>` : ''}</section>`
      : '';
  return `<button class="back-link" data-action="back-from-shop">← Volver</button>
    <section class="card shop-hero"><div><p class="eyebrow">Bazar de la Guarida</p><h2>Desbloquea nuevas skins</h2><p class="lead">Juega misiones para ganar coins. Comprar objetos no cambia el puntaje lector.</p></div><div class="coin-wallet">🪙 <strong>${state.student.coins || 0}</strong><span>coins</span></div></section>
    <nav class="shop-tabs" aria-label="Categorías de tienda"><a href="#skins">🎭 Skins</a><a href="#stickers">📒 Stickers</a></nav>
    <div id="skins">${groups.map(([part,label]) => `<section class="shop-section"><h3>${label}</h3><div class="shop-grid">${skinCatalog[part].map(([id,name,icon]) => { const owned=ownsItem(state.student,part,id); const price=shopPrice(part,id); return `<article class="shop-item ${owned?'owned':''}"><span class="shop-icon">${icon}</span><strong>${escapeHtml(name)}</strong><small>${owned?'Desbloqueado':`${price} coins`}</small><button class="btn ${owned?'btn-ghost':'btn-coin'}" ${owned?'disabled':`data-action="purchase-item" data-part="${part}" data-value="${id}"`}>${owned?'✓ Tuyo':'Comprar'}</button></article>`; }).join('')}</div></section>`).join('')}</div>
    <section id="stickers" class="sticker-store card"><div><p class="eyebrow">Colección sorpresa</p><h2>Álbum de stickers</h2><p>Completa tu álbum sin dinero real. Los duplicados devuelven coins.</p><div class="pity-goal"><strong>✨ ¡Un brillante está asegurado!</strong><p>Si la suerte no aparece antes, lo encontrarás en tu quinto sobre.</p><div class="pity-track" aria-label="${pityProgress} de ${stickerPityLimit} pasos hacia el sticker brillante">${pityDots}</div><small>${pityProgress ? `Te faltan como máximo ${pityRemaining} ${pityRemaining === 1 ? 'sobre' : 'sobres'}.` : 'Cada sobre te acerca a una sorpresa brillante.'}</small></div></div><div class="sticker-pack"><div class="pack-art">✉️<span>?</span></div><strong>Sobre sorpresa · 3 stickers</strong><small>Siempre entrega premios; nunca usa dinero real</small><button class="btn btn-coin" data-action="open-sticker-pack" ${(state.student.coins||0)<stickerPackPrice||state.packOpening?'disabled':''}>Abrir por ${stickerPackPrice} coins</button></div></section>
    ${packReveal}
    <section class="album-section"><div class="section-head"><div><p class="eyebrow">${ownedCount}/${stickerCatalog.length} encontrados · ${stickerSets.length} colecciones</p><h2>Mi gran álbum</h2></div></div>${albumSetsMarkup()}</section>`;
}

function teacherLoginView() {
  return `
    <button class="back-link" data-action="home">← Volver</button>
    <section class="card pin-card">
      <p class="eyebrow">Acceso adulto</p><h2>Panel de la profesora</h2>
      <p class="lead">Ingresa el PIN local para ver perfiles y resultados.</p>
      <form id="teacherLoginForm"><label>PIN<input id="teacherPin" type="password" inputmode="numeric" maxlength="8" autocomplete="current-password" placeholder="••••" required></label><div class="btn-row"><button class="btn btn-primary" type="submit">Entrar al panel</button></div></form>
      <p style="margin-top:20px;color:var(--muted);font-size:13px">Usa el PIN docente privado configurado en Cloudflare.</p>
    </section>`;
}

function formatDate(value) {
  if (!value) return 'Sin actividad';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function teacherDashboardView() {
  const students = state.dashboard?.students || [];
  const stats = state.dashboard?.classStats || {};
  return `
    <div class="section-head"><div><p class="eyebrow">Administradora y profesora</p><h2>Hola, profesora ${escapeHtml(state.dashboard?.teacher.name || 'Conny')}</h2></div><div class="btn-row"><button class="btn btn-secondary" data-action="teacher-export">Descargar CSV</button><button class="btn btn-ghost" data-action="teacher-refresh">Actualizar puntajes</button></div></div>
    <div class="stat-grid class-summary">
      <div class="stat"><strong>${stats.totalStudents ?? 0}/40</strong><span>Estudiantes</span></div>
      <div class="stat"><strong>${stats.activeStudents ?? 0}</strong><span>Con actividad</span></div>
      <div class="stat"><strong>${stats.average ?? '—'}</strong><span>Promedio general</span></div>
      <div class="stat"><strong>${stats.completion ?? 0}%</strong><span>Plan completado</span></div>
      <div class="stat"><strong>${stats.completed ?? 0}</strong><span>Misiones terminadas</span></div>
    </div>
    <section class="card roster-manager"><div><p class="eyebrow">Nómina administrada por Conny</p><h3>2.º básico · ${students.length} de 40 estudiantes</h3><p>La profesora puede agregar hasta tres perfiles de prueba o nuevas matrículas. Se mantienen todos los avances existentes.</p></div><form id="createStudentForm"><label>Primer nombre y apellido<input id="studentName" maxlength="60" autocomplete="off" placeholder="Ej.: Martina Pérez" required></label><button class="btn btn-primary" type="submit" ${students.length>=40?'disabled':''}>Crear perfil estudiantil</button></form></section>
    <div class="dashboard-grid">
      ${students.length ? students.map((student) => studentReport(student)).join('') : '<div class="empty">Aún no hay estudiantes.</div>'}
    </div>
    <div class="btn-row"><button class="btn btn-ghost" data-action="teacher-logout">Cerrar sesión docente</button></div>`;
}

function studentReport(student) {
  const latest = student.latest?.scores;
  const curriculumSkills=Object.values(student.skillProgress||{}).sort((a,b)=>Number(a.level)-Number(b.level)).slice(0,6);
  return `<article class="student-report">
    <header><div class="student-title">${skinAvatar(student, 'small')}<div><h3>${escapeHtml(student.name)}</h3><span style="color:var(--muted)">${student.grade}º básico · ${student.xp} XP</span></div></div><span class="score-pill">${student.average ?? '—'}</span></header>
    <div class="progress-line"><span style="width:${student.progress}%"></span></div><p class="progress-label">${student.completed}/${student.totalMissions || 105} misiones · Ruta sugerida: ${student.progress>=35?'Ya leo bien':'Estoy comenzando'} · 🧠 ${Object.keys(student.skillProgress || {}).length} habilidades · 🪙 ${student.coins || 0}</p>
    ${latest ? `<div class="report-meta"><div><strong>${latest.warmup ?? 0}%</strong><span>Calentamiento</span></div><div><strong>${latest.accuracy}%</strong><span>Precisión</span></div><div><strong>${latest.wpm}</strong><span>PPM</span></div><div><strong>${latest.comprehension}%</strong><span>Comprensión</span></div></div><div class="focus-list" style="justify-content:flex-start">${student.focus.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join('')}</div><p style="margin:14px 0 0;color:var(--muted);font-size:12px">Última misión: ${formatDate(student.latest.createdAt)}</p>` : '<div class="empty">Todavía no ha completado misiones.</div>'}
    ${curriculumSkills.length?`<section class="teacher-skill-map"><h4>Semáforo curricular</h4>${curriculumSkills.map(skill=>{const status=skill.level>=3?'achieved':skill.level>=2?'developing':'support';const label=status==='achieved'?'Logrado':status==='developing'?'En desarrollo':'Requiere apoyo';return `<div class="teacher-skill ${status}"><i></i><span><strong>${escapeHtml(skill.label)}</strong><small>${label} · ${skill.points}/12 · Último desempeño ${skill.lastScore||0}%</small></span></div>`}).join('')}<p>Recomendación: ${escapeHtml(student.focus?.[0]||'mantener lectura oral breve y comprensión guiada')}.</p></section>`:''}
    <div class="teacher-pin-tools"><label>Crear o cambiar PIN de ${escapeHtml(student.name)}<input id="teacherPin-${student.id}" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off" placeholder="4 números"></label><button class="btn btn-secondary" data-action="teacher-set-pin" data-id="${student.id}">Guardar PIN nuevo</button></div>
    <button class="btn btn-ghost reset-pin-button" data-action="teacher-reset-pin" data-id="${student.id}">Dejar perfil sin PIN</button>
  </article>`;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}

function render() {
  const views = {
    home: homeView,
    classLogin: classLoginView,
    students: studentsView,
    studentPin: studentPinView,
    skinEditor: skinEditorView,
    refuge: refugeView,
    skills: skillsView,
    trades: tradesView,
    map: mapView,
    mission: missionView,
    warmup: warmupView,
    reading: readingView,
    comprehension: comprehensionView,
    result: resultView,
    shop: shopView,
    teacherLogin: teacherLoginView,
    teacherDashboard: teacherDashboardView
  };
  app.innerHTML = (views[state.view] || homeView)();
  bindViewEvents();
  if(state.view==='map') mountWorld3D(); else window.LectoguaridaWorld3D?.unmount?.();
}

function mountWorld3D(){const target=app.querySelector('#world3dMap');if(!target||!window.LectoguaridaWorld3D)return;const counters={};const groups=new Map(adventureZones.map(z=>[z.id,[]]));state.mapReadings.forEach(r=>{const i=counters[r.stage]||0;counters[r.stage]=i+1;groups.get(zoneForReading(r,i))?.push(r)});const colors=['#ffd45f','#62e7a8','#65dfff','#ae8cff','#ff8fbd','#62cfff','#ffad55','#61dda9','#bd91ff','#ff8775'];const zones=adventureZones.map((z,i)=>({...z,color:colors[i],complete:(groups.get(z.id)||[]).length>0&&(groups.get(z.id)||[]).every(r=>r.completed),locked:(groups.get(z.id)||[]).every(r=>r.locked)}));window.LectoguaridaWorld3D.mount(target,zones,id=>app.querySelector(`.zone-${id}`)?.scrollIntoView({behavior:'smooth',block:'start'}));}

function bindViewEvents() {
  app.querySelectorAll('[data-action]').forEach((element) => element.addEventListener('click', handleAction));
  app.querySelector('#teacherLoginForm')?.addEventListener('submit', loginTeacher);
  app.querySelector('#classLoginForm')?.addEventListener('submit', loginClass);
  app.querySelector('#createStudentForm')?.addEventListener('submit', createStudent);
  app.querySelector('#tradeOfferForm')?.addEventListener('submit', createTradeOffer);
  app.querySelector('#tradeTarget')?.addEventListener('change', (event) => { state.tradeTarget = event.target.value; render(); });
  const writtenWarmup = app.querySelector('#writtenWarmup');
  writtenWarmup?.addEventListener('input', (event) => {
    state.warmupAnswer = event.target.value;
    app.querySelector('[data-action="finish-warmup"]')?.toggleAttribute('disabled', !event.target.value.trim());
  });
  app.querySelector('#studentSearch')?.addEventListener('input', (event) => {
    state.studentQuery = event.target.value;
    const query = state.studentQuery.trim().toLocaleLowerCase('es-CL');
    let visible = 0;
    app.querySelectorAll('.profile-card[data-name]').forEach((card) => {
      const matches = card.dataset.name.includes(query);
      card.classList.toggle('hidden', !matches);
      if (matches) visible += 1;
    });
    const count = app.querySelector('#profileCount');
    if (count) count.textContent = visible;
    app.querySelector('#profileEmpty')?.classList.toggle('hidden', visible > 0);
  });
  const transcript = app.querySelector('#transcript');
  transcript?.addEventListener('input', (event) => { state.transcript = event.target.value; });
  app.querySelectorAll('[draggable="true"]').forEach((item) => item.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/lectoguarida-type', item.dataset.dragType || '');
    event.dataTransfer.setData('text/lectoguarida-value', item.dataset.value || '');
    event.dataTransfer.effectAllowed = 'move';
  }));
  app.querySelectorAll('[data-drop-type]').forEach((zone) => {
    zone.addEventListener('dragover', (event) => { event.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (event) => {
      event.preventDefault(); zone.classList.remove('drag-over');
      const type = event.dataTransfer.getData('text/lectoguarida-type');
      if (zone.dataset.dropType === 'tile' && type === 'tile') {
        state.warmupBuild += event.dataTransfer.getData('text/lectoguarida-value'); state.warmupAnswer=state.warmupBuild; navigator.vibrate?.(12); render();
      }
      if (zone.dataset.dropType === 'scene' && type === 'character') {
        state.comprehensionAnswer=zone.dataset.id; navigator.vibrate?.([12,20,30]); render();
      }
    });
  });
  if (state.view === 'reading') startTimerDisplay();
}

async function handleAction(event) {
  const action = event.currentTarget.dataset.action;
  try {
    if (action === 'home') return resetToHome();
    if (action === 'speak-instruction') { speakInstruction(event.currentTarget.dataset.text); return; }
    if (action === 'play-recording') { playRecordedReading(); return; }
    if (action === 'karaoke-reading') { await startKaraokeReading(); return; }
    if (action === 'install-app') {
      await state.installPrompt?.prompt();
      state.installPrompt = null; showToast('Si aceptaste, Lectoguarida quedó instalada.'); return render();
    }
    if (action === 'student-entry') {
      if (!state.classCode) { state.view = 'classLogin'; setSession('Acceso del curso'); return render(); }
      try { await loadStudents(); state.view = 'students'; setSession('Modo estudiante'); return render(); }
      catch (error) { state.classCode = ''; sessionStorage.removeItem('classCode'); state.view = 'classLogin'; render(); throw error; }
    }
    if (action === 'students') { state.studentToken=''; state.studentSessionId=''; sessionStorage.removeItem('studentToken'); sessionStorage.removeItem('studentSessionId'); await loadStudents(); state.view = 'students'; return render(); }
    if (action === 'edit-skin') {
      state.student = state.students.find((item) => item.id === event.currentTarget.dataset.id);
      state.skinDraft = { ...state.student.skin }; state.view = 'skinEditor'; setSession(`🎨 Skin de ${state.student.name}`); return render();
    }
    if (action === 'open-shop') {
      state.student = state.students.find((item) => item.id === event.currentTarget.dataset.id);
      state.shopReturn = 'students'; state.view = 'shop'; setSession(`🪙 ${state.student.coins || 0} coins`); return render();
    }
    if (action === 'open-current-shop') { state.shopReturn = 'skinEditor'; state.packResult = null; state.packOpening = null; state.view = 'shop'; setSession(`🪙 ${state.student.coins || 0} coins`); return render(); }
    if (action === 'open-map-shop' || action === 'open-album') { state.shopReturn = 'map'; state.packResult = null; state.packOpening = null; state.view = 'shop'; setSession(`🪙 ${state.student.coins || 0} coins`); return render(); }
    if (action === 'open-refuge') { state.view='refuge'; setSession(`🏡 Refugio de ${state.student.name}`); return render(); }
    if (action === 'open-skills') { state.view='skills'; setSession(`🧠 Habilidades de ${state.student.name}`); return render(); }
    if (action === 'open-trades') { await loadTrades(); state.view='trades'; setSession(`🔄 Intercambios de ${state.student.name}`); return render(); }
    if (action === 'trade-respond') { const result=await api(`/api/students/${encodeURIComponent(state.student.id)}/trades/${encodeURIComponent(event.currentTarget.dataset.id)}/respond`,{method:'POST',body:JSON.stringify({decision:event.currentTarget.dataset.decision})});state.student=result.student;await loadTrades();render();showToast(result.trade.status==='accepted'?'¡Intercambio completado!':'Propuesta rechazada sin cobro.');return; }
    if (action === 'upgrade-refuge') {
      const result = await api(`/api/students/${encodeURIComponent(state.student.id)}/refuge/upgrade`, { method:'POST', body:JSON.stringify({ part:event.currentTarget.dataset.part }) });
      state.student=result.student; navigator.vibrate?.([25,35,70]); render(); speakInstruction('¡Construcción completada! Tu refugio sigue creciendo.'); return;
    }
    if (action === 'claim-daily') {
      const result = await api(`/api/students/${encodeURIComponent(state.student.id)}/daily-reward`, { method:'POST', body:'{}' });
      state.student=result.student; state.dailyReward=result.reward; navigator.vibrate?.([25,40,80,40,120]); render(); speakInstruction(`¡Premio diario! Encontraste ${result.reward.label}.`); return;
    }
    if (action === 'back-from-shop') { state.view = state.shopReturn; setSession(state.view === 'students' ? 'Modo estudiante' : `🎨 Skin de ${state.student.name}`); return render(); }
    if (action === 'purchase-item') {
      const updated = await api(`/api/students/${encodeURIComponent(state.student.id)}/purchase`, { method: 'POST', body: JSON.stringify({ part: event.currentTarget.dataset.part, value: event.currentTarget.dataset.value }) });
      state.student = updated; await loadStudents(); setSession(`🪙 ${state.student.coins || 0} coins`); render(); showToast('¡Objeto desbloqueado! Ya puedes usarlo en Mi skin.'); return;
    }
    if (action === 'open-sticker-pack') {
      const result = await api(`/api/students/${encodeURIComponent(state.student.id)}/sticker-pack`, { method:'POST', body:'{}' });
      const special = result.results.some((item) => item.rarity !== 'common');
      state.student = result.student;
      state.packResult = null;
      state.packOpening = { special };
      await loadStudents();
      setSession(`🪙 ${state.student.coins || 0} coins`);
      navigator.vibrate?.(special ? [40,60,90,60,150] : [25,35,60]);
      render();
      await new Promise((resolve) => setTimeout(resolve, special ? 650 : 300));
      state.packOpening = null;
      state.packResult = result;
      render();
      playRewardChime(special);
      speakInstruction(special ? '¡Increíble, encontraste uno especial!' : '¡Muy bien! Encontraste nuevos stickers.');
      return;
    }
    if (action === 'edit-current-skin') {
      state.skinDraft = { ...state.student.skin }; state.view = 'skinEditor'; return render();
    }
    if (action === 'choose-skin') {
      state.skinDraft[event.currentTarget.dataset.part] = event.currentTarget.dataset.value; return render();
    }
    if (action === 'random-skin') {
      for (const [part, options] of Object.entries(skinCatalog)) {
        const owned = options.filter(([id]) => ownsItem(state.student, part, id));
        state.skinDraft[part] = owned[Math.floor(Math.random() * owned.length)][0];
      }
      return render();
    }
    if (action === 'save-skin') {
      const updated = await api(`/api/students/${encodeURIComponent(state.student.id)}/skin`, { method: 'POST', body: JSON.stringify({ skin: state.skinDraft }) });
      state.student = updated; state.view = 'map'; setSession(`${state.student.avatar} ${state.student.name}`); render(); showToast('¡Skin guardada! Tu guardián está listo.'); return;
    }
    if (action === 'select-student') {
      state.student = state.students.find((item) => item.id === event.currentTarget.dataset.id);
      state.pinMode = state.student.hasPin ? 'login' : 'setup'; state.pinDigits = ''; state.firstPin = ''; state.view = 'studentPin'; setSession('PIN de estudiante'); return render();
    }
    if (action === 'cancel-pin') { state.pinDigits=''; state.firstPin=''; state.student=null; state.view='students'; setSession('Modo estudiante'); return render(); }
    if (action === 'pin-key') { if (state.pinDigits.length < 4) state.pinDigits += event.currentTarget.dataset.value; navigator.vibrate?.(8); return render(); }
    if (action === 'pin-backspace') { state.pinDigits = state.pinDigits.slice(0,-1); return render(); }
    if (action === 'pin-help') { app.querySelector('#pinHelp')?.classList.toggle('hidden'); return; }
    if (action === 'pin-submit') {
      if (state.pinDigits.length !== 4) return showToast('El PIN necesita cuatro números.');
      if (state.pinMode === 'setup') { state.firstPin=state.pinDigits; state.pinDigits=''; state.pinMode='confirm'; render(); speakInstruction('Muy bien. Ahora repite los mismos cuatro números.'); return; }
      if (state.pinMode === 'confirm' && state.pinDigits !== state.firstPin) { state.pinDigits=''; state.firstPin=''; state.pinMode='setup'; render(); return showToast('Los números no coincidieron. Probemos otra vez con calma.'); }
      const endpoint = state.pinMode === 'login' ? 'login' : 'pin/setup';
      const result = await api(`/api/students/${encodeURIComponent(state.student.id)}/${endpoint}`, { method:'POST', body:JSON.stringify({ pin:state.pinDigits }) });
      navigator.vibrate?.([30,30,70]);
      return enterStudentSession(result);
    }
    if (action === 'map') { const readings=await api(`/api/readings?grade=${state.student.grade}&studentId=${encodeURIComponent(state.student.id)}`); state.mapReadings=readings; state.view='map'; return render(); }
    if (action === 'select-route') { state.routePreference=event.currentTarget.dataset.route; localStorage.setItem(`lectoguarida-route-${state.student.id}`,state.routePreference); navigator.vibrate?.(18); return render(); }
    if (action === 'select-level') { state.reading=state.mapReadings.find((item)=>item.id===event.currentTarget.dataset.id); state.view='mission'; return render(); }
    if (action === 'begin-reading') {
      clearRecording(); state.view = 'warmup'; state.warmupAnswer = null; state.warmupBuild = ''; state.transcript = ''; state.elapsedSeconds = 0; return render();
    }
    if (action === 'back-mission') { state.view = 'mission'; return render(); }
    if (action === 'select-warmup') { navigator.vibrate?.(12); state.warmupAnswer = event.currentTarget.dataset.id; return render(); }
    if (action === 'append-tile') { navigator.vibrate?.(12); state.warmupBuild += event.currentTarget.dataset.value; state.warmupAnswer = state.warmupBuild; return render(); }
    if (action === 'clear-tiles') { state.warmupBuild = ''; state.warmupAnswer = ''; return render(); }
    if (action === 'finish-warmup') { state.view = 'reading'; state.startedAt = Date.now(); return render(); }
    if (action === 'toggle-mic') return toggleMic();
    if (action === 'sample-reading') {
      state.transcript = state.reading.text;
      state.elapsedSeconds = state.student.grade === 1 ? 32 : 38;
      const box = app.querySelector('#transcript'); if (box) box.value = state.transcript;
      showToast('Lectura de prueba cargada. Puedes continuar.'); return;
    }
    if (action === 'go-comprehension') {
      stopKaraoke();
      const box = app.querySelector('#transcript'); state.transcript = box?.value.trim() || state.transcript;
      if (!state.transcript) return showToast('Necesito escuchar o leer una transcripción antes de continuar.');
      stopRecognition();
      if (!state.elapsedSeconds) state.elapsedSeconds = Math.max(10, Math.round((Date.now() - state.startedAt) / 1000));
      state.view = 'comprehension'; return render();
    }
    if (action === 'back-reading') { state.view = 'reading'; state.startedAt = Date.now() - state.elapsedSeconds * 1000; return render(); }
    if (action === 'select-scene') { navigator.vibrate?.(12); state.comprehensionAnswer = event.currentTarget.dataset.id; return render(); }
    if (action === 'submit-attempt') return submitAttempt();
    if (action === 'new-mission') {
      clearRecording();
      const nextReadings = await api(`/api/readings?grade=${state.student.grade}&studentId=${encodeURIComponent(state.student.id)}`);
      state.mapReadings = nextReadings; state.reading = nextReadings.find((item)=>item.current) || nextReadings[0]; state.result = null; state.warmupAnswer = null; state.comprehensionAnswer = null; state.view = 'map'; return render();
    }
    if (action === 'teacher-entry') {
      if (state.teacherToken) {
        try { await loadDashboard(); state.view = 'teacherDashboard'; setSession('Modo profesora'); return render(); }
        catch { state.teacherToken = ''; sessionStorage.removeItem('teacherToken'); }
      }
      state.view = 'teacherLogin'; setSession('Acceso docente'); return render();
    }
    if (action === 'teacher-refresh') { await loadDashboard(); showToast('Puntajes actualizados.'); return render(); }
    if (action === 'teacher-export') { await exportTeacherCsv(); return; }
    if (action === 'teacher-reset-pin') {
      await api(`/api/teacher/students/${encodeURIComponent(event.currentTarget.dataset.id)}/reset-pin`, { method:'POST', body:'{}' });
      await loadDashboard(); render(); return showToast('PIN restablecido. El estudiante podrá crear uno nuevo.');
    }
    if (action === 'teacher-set-pin') {
      const studentId = event.currentTarget.dataset.id;
      const pin = document.getElementById(`teacherPin-${studentId}`)?.value.trim() || '';
      if (!/^\d{4}$/.test(pin)) return showToast('Escribe exactamente cuatro números.');
      await api(`/api/teacher/students/${encodeURIComponent(studentId)}/set-pin`, { method:'POST', body:JSON.stringify({ pin }) });
      await loadDashboard(); render(); return showToast(`PIN creado correctamente. Comunícalo a la familia de forma privada.`);
    }
    if (action === 'teacher-logout') {
      state.teacherToken = ''; state.dashboard = null; sessionStorage.removeItem('teacherToken'); state.view = 'teacherLogin'; return render();
    }
  } catch (error) {
    if (state.view === 'studentPin' && /ya tiene PIN/i.test(error.message)) {
      state.pinMode = 'login'; state.pinDigits = ''; state.firstPin = ''; render();
    }
    showToast(error.message);
  }
}

function startTimerDisplay() {
  const timer = app.querySelector('#timer');
  if (!timer) return;
  const update = () => {
    if (state.view !== 'reading') return;
    const seconds = state.elapsedSeconds || Math.max(0, Math.round((Date.now() - state.startedAt) / 1000));
    timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    window.setTimeout(update, 1000);
  };
  update();
}

async function toggleMic() {
  if (window.LectoguaridaSpeech) {
    if (state.listening) {
      stopRecognition();
      return render();
    }
    clearRecording();
    if (!state.startedAt) state.startedAt = Date.now();
    state.listening = true;
    render();
    window.LectoguaridaSpeech.start('es-CL');
    return;
  }
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return showToast('Usa Edge o Chrome, o escribe la transcripción manualmente.');
  if (state.listening) { stopRecognition(); return render(); }
  try {
    clearRecording();
    await startWebRecording();
  } catch {
    return showToast('Necesito permiso de micrófono para grabar y escuchar tu lectura.');
  }
  const recognition = new Recognition();
  recognition.lang = 'es-CL';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onstart = () => { state.listening = true; render(); };
  recognition.onresult = (event) => {
    let finalText = '';
    let interim = '';
    for (let i = 0; i < event.results.length; i += 1) {
      if (event.results[i].isFinal) finalText += `${event.results[i][0].transcript} `;
      else interim += event.results[i][0].transcript;
    }
    state.transcript = `${finalText}${interim}`.trim();
    const box = app.querySelector('#transcript'); if (box) box.value = state.transcript;
  };
  recognition.onerror = (event) => { state.listening = false; stopWebRecording(); showToast(event.error === 'not-allowed' ? 'El micrófono no tiene permiso.' : 'El oído mágico tuvo una dificultad. Puedes escribir la lectura.'); render(); };
  recognition.onend = () => { const wasListening = state.listening; state.listening = false; if (wasListening) stopWebRecording(); if (state.view === 'reading') render(); };
  state.recognition = recognition;
  recognition.start();
}

async function submitAttempt() {
  const result = await api('/api/attempts', {
    method: 'POST',
    body: JSON.stringify({ studentId: state.student.id, readingId: state.reading.id, warmupAnswer: state.warmupAnswer, transcript: state.transcript, elapsedSeconds: state.elapsedSeconds, comprehensionAnswer: state.comprehensionAnswer })
  });
  state.result = result;
  state.student = result.student;
  state.view = 'result';
  navigator.vibrate?.([40, 40, 80, 40, 120]);
  render();
  if (result.attempt?.scores?.overall >= 85) rewardJuice();
}

function rewardJuice() {
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.remove('reward-shake');
    requestAnimationFrame(()=>document.body.classList.add('reward-shake'));
    window.setTimeout(()=>document.body.classList.remove('reward-shake'),520);
  }
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    [523.25,659.25,783.99].forEach((frequency,index)=>{const oscillator=context.createOscillator();const gain=context.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(.0001,context.currentTime);gain.gain.exponentialRampToValueAtTime(.12,context.currentTime+.02+index*.06);gain.gain.exponentialRampToValueAtTime(.0001,context.currentTime+.28+index*.06);oscillator.connect(gain).connect(context.destination);oscillator.start(context.currentTime+index*.06);oscillator.stop(context.currentTime+.36+index*.06);});
  } catch { /* El refuerzo visual y la vibración siguen disponibles. */ }
}

async function loginTeacher(event) {
  event.preventDefault();
  try {
    const result = await api('/api/teacher/login', { method: 'POST', body: JSON.stringify({ pin: app.querySelector('#teacherPin').value }) });
    state.teacherToken = result.token;
    sessionStorage.setItem('teacherToken', result.token);
    await loadDashboard();
    state.view = 'teacherDashboard'; setSession(`🔭 ${result.teacher.name}`); render();
  } catch (error) { showToast(error.message); }
}

async function loginClass(event) {
  event.preventDefault();
  const code = app.querySelector('#classCode').value.trim().toLocaleUpperCase('es-CL');
  if (!code) return showToast('Escribe el código del curso.');
  state.classCode = code;
  try {
    await loadStudents();
    sessionStorage.setItem('classCode', code);
    state.view = 'students';
    setSession('Modo estudiante');
    render();
  } catch (error) {
    state.classCode = '';
    sessionStorage.removeItem('classCode');
    showToast(error.message);
  }
}

async function loadDashboard() {
  state.dashboard = await api('/api/teacher/summary');
}

async function exportTeacherCsv() {
  const response = await fetch('/api/teacher/export.csv', { headers:{ Authorization:`Bearer ${state.teacherToken}` } });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'No fue posible descargar los resultados.');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'lectoguarida-resultados.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Resultados descargados en CSV.');
}

async function loadTrades() {
  state.tradeData = await api(`/api/students/${encodeURIComponent(state.student.id)}/trades`);
  if (!state.tradeData.students.some((student) => student.id === state.tradeTarget && student.inventory?.length)) state.tradeTarget = state.tradeData.students.find((student) => student.inventory?.length)?.id || '';
}

async function createTradeOffer(event) {
  event.preventDefault();
  try {
    await api(`/api/students/${encodeURIComponent(state.student.id)}/trades`, { method:'POST', body:JSON.stringify({ toStudentId:app.querySelector('#tradeTarget').value, offeredKey:app.querySelector('#tradeOffered').value, requestedKey:app.querySelector('#tradeRequested').value }) });
    await loadTrades(); render(); showToast('Propuesta enviada. No se cobran coins hasta que la otra persona acepte.');
  } catch (error) { showToast(error.message); }
}

async function createStudent(event) {
  event.preventDefault();
  try {
    await api('/api/teacher/students', { method: 'POST', body: JSON.stringify({ name: app.querySelector('#studentName').value, grade: 2 }) });
    await loadDashboard();
    render();
    showToast('Perfil creado. Ya aparece en el acceso de estudiantes.');
  } catch (error) { showToast(error.message); }
}

async function createStudentBulk(event) {
  event.preventDefault();
  try {
    const names = app.querySelector('#rosterNames').value.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
    if (names.length > 37) return showToast('La carga admite un máximo de 37 nombres por vez.');
    const result = await api('/api/teacher/students/bulk', { method: 'POST', body: JSON.stringify({ names, grade: Number(app.querySelector('#rosterGrade').value) }) });
    await loadDashboard();
    render();
    showToast(`${result.created.length} perfiles creados${result.skipped ? `, ${result.skipped} repetidos omitidos` : ''}.`);
  } catch (error) { showToast(error.message); }
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
render();
