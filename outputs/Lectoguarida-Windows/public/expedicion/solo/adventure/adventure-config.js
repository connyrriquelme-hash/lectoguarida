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
  concept: 'mariposa-del-maiten',
  palette: { glow: 0xfff3a0, body: 0xffe066, wing: 0xbdf3c0, pollen: 0xfff0a0 },
  pollenPool: { LOW: 12, MEDIUM: 32, HIGH: 65 }
};

export var NEBLIN = {
  id: 'neblin',
  name: 'Neblín',
  states: {
    DENSE: 'NEBLIN_DENSE',
    CLEARING: 'NEBLIN_CLEARING',
    FRIENDLY: 'NEBLIN_FRIENDLY'
  },
  palette: { dense: 0x7f93a8, clearing: 0xc9d6e2, friendly: 0xffffff }
};

export var WORLD_REGIONS = [
  {
    id: 'peninsula-llolleo',
    name: 'Península de Llolleo',
    state: 'ACTIVE',
    profile: 'non_reader',
    biome: 'templado-verde',
    x: 0, y: 0,
    futureZones: ['plaza-guarida', 'bosque-pinos', 'mercado-vocales', 'sendero-humedal', 'laguna-rimas']
  },
  {
    id: 'humedal-rio-maipo',
    name: 'Humedal del Río Maipo',
    state: 'DISCOVERED',
    x: 220, y: 40,
    futureZones: ['laguna-rimas', 'profundidades-estuario', 'isla-gaviota']
  },
  {
    id: 'puerto-gigantes',
    name: 'Puerto de los Gigantes',
    state: 'LOCKED',
    x: -240, y: 80,
    futureZones: ['muelle-colorido', 'fabrica-cajas', 'faro-rompeolas']
  },
  {
    id: 'roquerios-viento',
    name: 'Roqueríos del Viento',
    state: 'LOCKED',
    x: 200, y: -200,
    futureZones: ['acantilados-eco', 'cueva-sonidos-finales', 'nido-condor']
  },
  {
    id: 'valle-yali',
    name: 'Valle del Yali',
    state: 'LOCKED',
    x: -200, y: -220,
    futureZones: ['santuario-flamencos', 'jardin-letras-ocultas', 'templo-lectura']
  },
  {
    id: 'cerros-cuentos',
    name: 'Cerros de los Cuentos',
    state: 'LOCKED',
    x: 20, y: 260,
    futureZones: ['ascensores-colores', 'ciudad-cuentos', 'gran-biblioteca-puerto']
  }
];

export var REGION_STATES = {
  ACTIVE: 'ACTIVE',
  DISCOVERED: 'DISCOVERED',
  LOCKED: 'LOCKED',
  COMPLETED: 'COMPLETED'
};

export var LLOLLEO_SUBZONES = [
  { id: 'plaza-guarida', name: 'Plaza de la Guarida', kind: 'hub', x: 0, z: 0 },
  { id: 'bosque-pinos', name: 'Bosque de los Pinos Mágicos', kind: 'forest', x: 24, z: 6 },
  { id: 'mercado-vocales', name: 'Mercado de las Vocales', kind: 'market', x: -22, z: 10 },
  { id: 'sendero-humedal', name: 'Sendero hacia el Humedal', kind: 'path', x: 0, z: -18 },
  { id: 'laguna-rimas', name: 'Laguna de las Rimas', kind: 'lagoon', x: 0, z: -30 }
];

export var REFINED_CHARACTERS = [
  { id: 'lumi', name: 'Lumi', palette: { primary: 0x6fcf97, secondary: 0xffd166, accent: 0x4fd1c5 }, motif: 'doca', accessory: 'mochila-hoja', boots: 'amarillas', item: 'farol' },
  { id: 'tilo', name: 'Tilo', palette: { primary: 0x4c8bf5, secondary: 0xff8c69, accent: 0xfdf6e3 }, motif: 'sietecolores', accessory: 'lupa', item: 'bufanda-coral' },
  { id: 'nara', name: 'Nara', palette: { primary: 0x9b6dff, secondary: 0xff9f43, accent: 0x9ad0f0 }, motif: 'chagual-totora', accessory: 'bolso-totora', item: 'paginas' },
  { id: 'bimo', name: 'Bimo', palette: { primary: 0x3fb8af, secondary: 0xa3e635, accent: 0xfff7ed }, motif: 'sea-glass', accessory: 'mochila-pinon', seaGlass: true }
];

export var REFINED_GUARDIANS = {
  rina: {
    id: 'rina', name: 'Rina', fusion: 'ranita-helecho',
    species: 'Ranita de Darwin + helecho costero',
    zoneId: 'laguna-rimas', palette: { primary: 0x2ecc71, secondary: 0xff7eb6, accent: 0xfff3a0 },
    animations: ['IDLE', 'LISTENING', 'RHYME_SUCCESS', 'MISSION_COMPLETE'], missionId: 'eco-de-la-laguna'
  },
  chispa: {
    id: 'chispa', name: 'Chispa', fusion: 'chucao-copihue',
    species: 'Chucao + copihue', zoneId: 'bosque-sonido',
    palette: { primary: 0xff9f43, secondary: 0x8b5a2b, accent: 0xffe0b3 }
  },
  pulo: {
    id: 'pulo', name: 'Pulo', fusion: 'pudu-boldo',
    species: 'Pudú + boldo', zoneId: 'puente-silabas',
    palette: { primary: 0x3fb8af, secondary: 0x5b3a29, accent: 0xfff0c2 }
  },
  mimi: {
    id: 'mimi', name: 'Mimi', fusion: 'monito-quila',
    species: 'Monito del monte + quila', zoneId: 'cueva-eco',
    palette: { primary: 0x9b6dff, secondary: 0xb794f4, accent: 0xe9d8fd }
  }
};

export var ADVENTURE_REWARDS = {
  'pagina-capitulo-01': { id: 'pagina-capitulo-01', type: 'page', name: 'Página del Gran Libro', icon: '📖', desc: 'Una página recuperada del Libro de Lectoguarida.' },
  'broche-rina': { id: 'broche-rina', type: 'cosmetic', name: 'Broche de Rina', icon: '🐸', desc: 'Ranita con hoja de helecho turquesa. Cosmético, sin ventaja jugable.', repeatable: false },
  'semilla-rima': { id: 'semilla-rima', type: 'seed', name: 'Semilla de Rima', icon: '🌱', desc: 'Una semilla mágica para el Jardín.' },
  'insignia-explorador': { id: 'insignia-explorador', type: 'badge', name: 'Insignia Explorador', icon: '⭐', desc: 'Completaste tu primera misión.' }
};

export var BACKPACK_SLOTS = [
  { id: 'bell-1', label: 'Campana 1', icon: '🔔' },
  { id: 'bell-2', label: 'Campana 2', icon: '🔔' },
  { id: 'bell-3', label: 'Campana 3', icon: '🔔' },
  { id: 'page', label: 'Página del Libro', icon: '📖' },
  { id: 'seed', label: 'Semilla', icon: '🌱' },
  { id: 'reward', label: 'Recompensa', icon: '🏅' }
];

export var COLLECTIBLE_KINDS = ['bell', 'seed', 'stone', 'word'];
