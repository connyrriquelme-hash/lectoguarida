/**
 * adventure-config.js
 * Configuración central del juego de aventura Lectoguarida.
 * Define zonas, capítulo 1, dificultades y constantes compartidas.
 */

export var ADVENTURE_PROFILE = 'non_reader';

export var CHAPTER_01 = {
  id: 'chapter-01',
  title: 'La tormenta de los sonidos',
  missionId: 'eco-de-la-laguna',
  mission: {
    id: 'eco-de-la-laguna',
    title: 'El eco de la laguna',
    guardianId: 'rina',
    zoneId: 'laguna-rimas',
    gameId: 'rhyme-catcher',
    collectibleCount: 3,
    rewardId: 'pagina-capitulo-01',
    hint: 'Busca las tres campanas de palabras cerca de la orilla.'
  }
};

export var ZONES = [
  {
    id: 'plaza-guarida',
    name: 'Plaza de la Guarida',
    color: 0x88d8c0,
    portal: false,
    position: { x: 0, z: 0 }
  },
  {
    id: 'laguna-rimas',
    name: 'Laguna de las Rimas',
    color: 0x4fd1c5,
    portal: true,
    gameId: 'rhyme-catcher',
    guardianId: 'rina',
    position: { x: 0, z: -26 },
    locked: false
  },
  {
    id: 'bosque-sonido',
    name: 'Bosque del Primer Sonido',
    color: 0x9ae66e,
    portal: true,
    gameId: 'initial-sound-detector',
    guardianId: 'chispa',
    position: { x: -30, z: 8 },
    locked: true,
    upcoming: true
  },
  {
    id: 'puente-silabas',
    name: 'Puente de las Sílabas',
    color: 0xffb86b,
    portal: true,
    gameId: 'syllable-counter',
    guardianId: 'pulo',
    position: { x: 30, z: 8 },
    locked: true,
    upcoming: true
  },
  {
    id: 'cueva-eco',
    name: 'Cueva del Eco Final',
    color: 0xb794f4,
    portal: true,
    gameId: 'final-sound-catcher',
    guardianId: 'mimi',
    position: { x: 0, z: 30 },
    locked: true,
    upcoming: true
  }
];

export var CHARACTERS = [
  { id: 'lumi', name: 'Lumi', palette: { primary: 0x6fcf97, secondary: 0xffd166, accent: 0x4fd1c5 } },
  { id: 'tilo', name: 'Tilo', palette: { primary: 0x4c8bf5, secondary: 0xff8c69, accent: 0xfdf6e3 } },
  { id: 'nara', name: 'Nara', palette: { primary: 0x9b6dff, secondary: 0xff9f43, accent: 0x9ad0f0 } },
  { id: 'bimo', name: 'Bimo', palette: { primary: 0x3fb8af, secondary: 0xa3e635, accent: 0xfff7ed } }
];

export var GUARDIANS = {
  rina: {
    id: 'rina',
    name: 'Rina',
    species: 'Ranita de las Rimas',
    zoneId: 'laguna-rimas',
    palette: { primary: 0x2ecc71, secondary: 0xff7eb6, accent: 0xfff3a0 },
    missionId: 'eco-de-la-laguna'
  },
  chispa: {
    id: 'chispa',
    name: 'Chispa',
    species: 'Chucao de los Sonidos',
    zoneId: 'bosque-sonido',
    palette: { primary: 0xff9f43, secondary: 0x8b5a2b, accent: 0xffe0b3 }
  },
  pulo: {
    id: 'pulo',
    name: 'Pulo',
    species: 'Pudú de las Sílabas',
    zoneId: 'puente-silabas',
    palette: { primary: 0x3fb8af, secondary: 0x5b3a29, accent: 0xfff0c2 }
  },
  mimi: {
    id: 'mimi',
    name: 'Mimi',
    species: 'Monito del Eco Final',
    zoneId: 'cueva-eco',
    palette: { primary: 0x9b6dff, secondary: 0xb794f4, accent: 0xe9d8fd }
  }
};

export var COMPANION = {
  id: 'lumiercoles',
  name: 'Lumiércoles',
  palette: { glow: 0xfff3a0, body: 0xffe066 }
};

export var COLLECTIBLE_KINDS = ['bell', 'seed', 'stone', 'word'];
