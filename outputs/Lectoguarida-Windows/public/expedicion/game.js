const EXPEDICION_BASE = '/expedicion/';

let video;
let handpose;
let predictions = [];

let canvas;
let gameContainer;
let sonidoAcierto;
let imgObjetivo;
let imgCargada = false;
let audioCargado = false;

let narrativas = null;
let narrativaVictoria = '¡Nivel superado! Tu lectura abrió el siguiente camino.';
let narrativaCargada = false;
let bootOverlayHidden = false;

let puntos = 0;
let estadoNivel = 1;
let estadoJuego = 'SELECCION_NIVEL';
let handposeListo = false;
let nivelActual = 'kinder';

// Base path estable para recursos de la expedición
const EXPEDICION_BASE = '/expedicion/';

const nivelesBase = {
  kinder: {
    nombre: 'Kinder',
    nivel: 1,
    objetivo: 'Toca el símbolo brillante para escuchar una palabra y avanzar.',
    color: [138, 255, 198]
  },
  segundo: {
    nombre: 'Segundo',
    nivel: 2,
    objetivo: 'Sigue el objetivo con tu dedo y completa una lectura corta.',
    color: [104, 231, 255]
  },
  sexto: {
    nombre: 'Sexto',
    nivel: 3,
    objetivo: 'Resuelve la misión y mira tu progreso antes de avanzar.',
    color: [255, 212, 95]
  }
};

let objetivo = {
  x: 0,
  y: 0,
  radio: 40
};

let dedo = {
  x: 0,
  y: 0,
  visible: false
};

function preload() {}

function setup() {
  gameContainer = document.getElementById('contenedor-juego');

  const w = gameContainer ? gameContainer.clientWidth : windowWidth;
  const h = gameContainer ? gameContainer.clientHeight : windowHeight;

  canvas = createCanvas(w, h);
  canvas.parent('contenedor-juego');

  video = createCapture(VIDEO, () => {
    console.log('Cámara lista');
  });
  video.size(width, height);
  video.hide();

  iniciarCargasNoBloqueantes();

  handpose = ml5.handpose(video, modelReady);
  handpose.on('predict', (results) => {
    predictions = results || [];
    if (predictions.length > 0) {
      const hand = predictions[0];
      const indexFingerTip = hand.landmarks && hand.landmarks[8];
      if (indexFingerTip) {
        dedo.x = width - indexFingerTip[0];
        dedo.y = indexFingerTip[1];
        dedo.visible = true;
      }
    } else {
      dedo.visible = false;
    }
  });

  colocarObjetivo();
  textFont('system-ui, sans-serif');
  estadoJuego = 'SELECCION_NIVEL';
  conectarSeleccionDeNivel();
}

function conectarSeleccionDeNivel() {
  const choices = document.querySelectorAll('[data-level]');
  choices.forEach((choice) => {
    choice.addEventListener('click', () => {
      nivelActual = choice.dataset.level || 'kinder';
      puntos = 0;
      estadoNivel = nivelesBase[nivelActual]?.nivel || 1;
      ocultarOverlayInicio();
      estadoJuego = 'JUGANDO';
      colocarObjetivo();
    });
  });
}

function ocultarOverlayInicio() {
  if (bootOverlayHidden) return;
  bootOverlayHidden = true;
  const overlay = document.getElementById('bootOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-busy', 'false');
  }
}

function cargarNarrativasDeApoyo() {
  fetch(EXPEDICION_BASE + 'data/dialogos.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      narrativas = data;
      narrativaCargada = true;
      if (data && typeof data === 'object') {
        narrativaVictoria =
          data?.nivel1?.victoria ||
          data?.victoria ||
          data?.nivel1 ||
          narrativaVictoria;
      }
    })
    .catch(() => {
      console.warn('No se encontró data/dialogos.json, usando texto de respaldo.');
      narrativas = null;
      narrativaCargada = true;
    });
}

function iniciarCargasNoBloqueantes() {
  const img = new Image();
  img.onload = () => {
    if (imagenPersonajeUtilizable(img)) {
      imgObjetivo = img;
      imgCargada = true;
    } else {
      console.warn('Imagen demasiado pequeña o inválida, usando respaldo geométrico.');
      imgCargada = false;
    }
  };
  img.onerror = () => {
    console.warn('Imagen no encontrada, usando respaldo geométrico.');
    imgCargada = false;
  };
  img.src = EXPEDICION_BASE + 'assets/personaje.png';

  const audio = new Audio();
  audio.preload = 'auto';
  audio.addEventListener('canplaythrough', () => {
    audioCargado = true;
  }, { once: true });
  audio.addEventListener('error', () => {
    console.warn('Audio no encontrado, sonido desactivado.');
    audioCargado = false;
  }, { once: true });
  audio.src = EXPEDICION_BASE + 'assets/acierto.wav';
  sonidoAcierto = audio;

  cargarNarrativasDeApoyo();
}

function imagenPersonajeUtilizable(img) {
  return Boolean(
    img &&
    img.naturalWidth >= 16 &&
    img.naturalHeight >= 16
  );
}

function modelReady() {
  console.log('Handpose listo');
  handposeListo = true;
  if (estadoJuego === 'CARGANDO') {
    estadoJuego = 'JUGANDO';
  }
}

function draw() {
  background(10, 18, 42);

  drawMirroredVideo();
  drawAmbientOverlay();
  drawHUD();
  drawNivelActual();

  if (estadoJuego === 'NIVEL_SUPERADO') {
    drawVictoryState();
    return;
  }

  if (estadoJuego === 'SELECCION_NIVEL') {
    drawNivelIntroVisible();
    return;
  }

  if (estadoJuego === 'CARGANDO') {
    drawLoadingState();
    return;
  }

  drawObjetivo();

  if (dedo.visible) {
    drawFingerMarker(dedo.x, dedo.y);
    checkCollision();
  } else {
    drawSearchText();
  }
}

function drawNivelActual() {
  push();
  const nivel = nivelesBase[nivelActual] || nivelesBase.kinder;
  const cardW = min(width - 32, 620);
  const cardH = 126;
  const cardX = (width - cardW) / 2;
  const cardY = height * 0.16;

  noStroke();
  fill(8, 14, 34, 180);
  rect(cardX, cardY, cardW, cardH, 24);

  stroke(nivel.color[0], nivel.color[1], nivel.color[2]);
  strokeWeight(2);
  noFill();
  rect(cardX, cardY, cardW, cardH, 24);

  noStroke();
  fill(255);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(max(20, width * 0.03));
  text(`${nivel.nombre} · Nivel ${nivel.nivel}`, cardX + 18, cardY + 16);

  textStyle(NORMAL);
  textSize(max(14, width * 0.018));
  text(nivel.objetivo, cardX + 18, cardY + 56, cardW - 36, 56);
  pop();
}

function drawMirroredVideo() {
  if (!video || !video.elt || video.elt.readyState < 2) {
    background(10, 18, 42);
    return;
  }

  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();
}

function drawAmbientOverlay() {
  noStroke();
  fill(11, 19, 45, 70);
  rect(0, 0, width, height);
}

function drawLoadingState() {
  push();
  fill(247, 251, 255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(max(22, width * 0.036));
  text('Conectando cámara e Inteligencia Artificial...', width / 2, height / 2 - 18);

  textStyle(NORMAL);
  textSize(max(14, width * 0.02));
  text(
    handposeListo
      ? 'Preparando la lectura...'
      : narrativaCargada
        ? 'El canvas ya está listo mientras carga la IA.'
        : 'Cargando apoyos de lectura...',
    width / 2,
    height / 2 + 22
  );
  pop();
}

function drawNivelIntroVisible() {
  push();
  noStroke();
  fill(255, 255, 255, 236);
  rect(24, height - 168, min(520, width - 48), 120, 22);
  fill(10, 18, 42);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(max(18, width * 0.026));
  text('Elige Kinder, Segundo o Sexto para mostrar un nivel visible', 44, height - 144);
  textStyle(NORMAL);
  textSize(max(14, width * 0.019));
  text(
    'La experiencia queda lista aunque la cámara aún esté cargando.',
    44,
    height - 114
  );
  pop();
}

function drawVictoryState() {
  push();
  noStroke();
  fill(8, 14, 34, 178);
  rect(0, 0, width, height);

  const boxW = min(width * 0.88, 760);
  const boxH = min(height * 0.46, 340);
  const boxX = (width - boxW) / 2;
  const boxY = (height - boxH) / 2;

  fill(18, 32, 74, 240);
  stroke(104, 231, 255);
  strokeWeight(3);
  rect(boxX, boxY, boxW, boxH, 28);

  noStroke();
  fill(255, 255, 255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(max(22, width * 0.035));
  text('¡Nivel superado!', width / 2, boxY + 58);

  textStyle(NORMAL);
  textSize(max(16, width * 0.022));
  textWrap(WORD);
  text(
    narrativas?.nivel1?.victoria ||
      narrativas?.victoria ||
      narrativaVictoria,
    boxX + 28,
    boxY + 112,
    boxW - 56,
    boxH - 140
  );
  pop();
}

function drawHUD() {
  push();
  fill(247, 251, 255);
  textAlign(LEFT, TOP);
  textSize(max(22, width * 0.035));
  textStyle(BOLD);
  text(`Puntos: ${puntos}`, 20, 18);

  textAlign(RIGHT, TOP);
  textSize(max(16, width * 0.022));
  textStyle(NORMAL);
  text(`Nivel ${estadoNivel}`, width - 20, 22);
  pop();
}

function drawSearchText() {
  push();
  noStroke();

  if (!dedo.visible) {
    fill(255, 212, 95);
    textAlign(LEFT, BOTTOM);
    textSize(max(18, width * 0.024));
    textStyle(BOLD);
    text('🔍 Buscando mano... (Mueva el cuerpo frente a la cámara)', 20, height - 60);
  }

  textSize(14);
  textStyle(BOLD);
  textAlign(LEFT, BOTTOM);

  fill(imgCargada ? '#46ff78' : '#ff4646');
  text(`🎨 Ilustración de Artes: ${imgCargada ? 'CONECTADA (PNG)' : 'Modo Respaldo Visual'}`, 20, height - 35);

  fill(audioCargado ? '#46ff78' : '#ff4646');
  text(`🔊 Sonido de Kinder: ${audioCargado ? 'CONECTADO (WAV)' : 'Modo Silencioso'}`, 20, height - 15);
  pop();
}

function drawFingerMarker(x, y) {
  push();
  noFill();
  stroke(70, 255, 120);
  strokeWeight(15);
  circle(x, y, 46);
  pop();
}

function drawObjetivo() {
  if (estadoJuego !== 'JUGANDO') {
    return;
  }

  push();
  noStroke();
  fill(0, 0, 0, 70);
  circle(objetivo.x + 6, objetivo.y + 6, objetivo.radio * 2.1);

  fill(104, 231, 255);
  circle(objetivo.x, objetivo.y, objetivo.radio * 2);

  fill(255, 255, 255, 90);
  circle(objetivo.x - 8, objetivo.y - 8, objetivo.radio * 0.85);

  noFill();
  stroke(255, 212, 95);
  strokeWeight(4);
  circle(objetivo.x, objetivo.y, objetivo.radio * 2 + 6);

  if (imgCargada && imgObjetivo) {
    imageMode(CENTER);
    image(imgObjetivo, objetivo.x, objetivo.y, objetivo.radio * 2.5, objetivo.radio * 2.5);
  }
  pop();
}

function checkCollision() {
  if (estadoJuego !== 'JUGANDO' || !dedo.visible) {
    return;
  }

  const distancia = dist(dedo.x, dedo.y, objetivo.x, objetivo.y);
  if (distancia < objetivo.radio) {
    puntos += 1;
    if (audioCargado && sonidoAcierto && typeof sonidoAcierto.play === 'function') {
      sonidoAcierto.currentTime = 0;
      sonidoAcierto.play().catch(() => {});
    }

    if (puntos >= 5) {
      estadoNivel = 2;
      estadoJuego = 'NIVEL_SUPERADO';
      return;
    }

    colocarObjetivo();
  }
}

function colocarObjetivo() {
  const margen = 60;
  const inicioTercioInferior = height * 0.66;

  objetivo.x = random(margen, width - margen);
  objetivo.y = random(inicioTercioInferior, height - margen);
}

function windowResized() {
  const w = gameContainer ? gameContainer.clientWidth : windowWidth;
  const h = gameContainer ? gameContainer.clientHeight : windowHeight;

  resizeCanvas(w, h);

  if (video) {
    video.size(width, height);
  }

  if (estadoJuego === 'JUGANDO') {
    colocarObjetivo();
  }
}
