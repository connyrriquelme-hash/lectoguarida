/**
 * data/dialogue-es-cl.js
 * Líneas de diálogo en español chileno para el Capítulo 1.
 * Escenas explícitas con triggers, tipo blocking/non-blocking y datos de audio.
 */

export var DIALOGUE = {
  intro: {
    lumiercoles: [
      '¡Hola, Explorador de Lectoguarida! Soy Lumiércoles.',
      'Una niebla gris desordenó las palabras del Gran Libro.',
      'Ayúdanos a recuperarlas. Empecemos en la Laguna de las Rimas.'
    ]
  },
  rina: {
    greeting: [
      'Soy Rina, la ranita de las rimas.',
      'Las campanas de la rima se escondieron en la orilla.',
      'Encuentra tres campanas y luego atraparemos la rima.'
    ],
    hint: 'Escucha cada campana: suena parecido a otra palabra.',
    missionComplete: [
      '¡Lo lograste! Las rimas vuelven a cantar.',
      'Aquí tienes una página del Gran Libro.'
    ]
  },
  collectible: {
    bell: 'Ding… esta campana suena como "luna". Busca su rima.'
  },
  errors: {
    noWebGL: 'Tu navegador no puede mostrar el mundo 3D. Usaremos el mapa accesible.'
  }
};

/**
 * SCENES — siete escenas explícitas del Capítulo 1.
 * Cada escena tiene id único, speaker, text, audioText, visualCue,
 * soundCue, blocking (true=movimiento bloqueado, false=non-blocking) y nextSceneId.
 */
export var SCENES = [
  {
    id: 'intro-plaza-vaguada',
    speaker: 'Narrador',
    text: 'Una neblina fría llegó desde la costa. La Plaza de la Guarida perdió parte de sus colores.',
    audioText: 'Una neblina fría llegó desde la costa. La Plaza de la Guarida perdió parte de sus colores.',
    visualCue: '\uD83C\uDF2B\uFE0F',
    soundCue: 'vaguada_wind',
    blocking: true,
    nextSceneId: 'lumiercoles-guia'
  },
  {
    id: 'lumiercoles-guia',
    speaker: 'Lumiércoles',
    text: 'Encontré un brillo cerca de la laguna. Sígueme. Rina necesita nuestra ayuda.',
    audioText: 'Encontré un brillo cerca de la laguna. Sígueme. Rina necesita nuestra ayuda.',
    visualCue: '\uD83E\uDD8B',
    soundCue: 'lumiercoles_guide',
    blocking: false,
    nextSceneId: 'encuentro-rina'
  },
  {
    id: 'encuentro-rina',
    speaker: 'Rina',
    text: 'Soy Rina, la ranita de las rimas. Las campanas de la rima se escondieron en la orilla.',
    audioText: 'Soy Rina, la ranita de las rimas. Las campanas de la rima se escondieron en la orilla.',
    visualCue: '\uD83D\uDC38',
    soundCue: 'rina_speaking',
    blocking: true,
    nextSceneId: 'buscar-campanas'
  },
  {
    id: 'buscar-campanas',
    speaker: 'Rina',
    text: 'Encuentra tres campanas y luego atraparemos la rima. Escucha cada campana: suena parecido a otra palabra.',
    audioText: 'Encuentra tres campanas y luego atraparemos la rima. Escucha cada campana: suena parecido a otra palabra.',
    visualCue: '\uD83D\uDD14',
    soundCue: 'mission_start',
    blocking: true,
    nextSceneId: 'campana-encontrada'
  },
  {
    id: 'campana-encontrada',
    speaker: 'Rina',
    text: '¡Encontraste una campana! Escucha: esta campana suena como "luna". Busca su rima.',
    audioText: '¡Encontraste una campana! Escucha: esta campana suena como "luna". Busca su rima.',
    visualCue: '\u2728',
    soundCue: 'bell_found',
    blocking: false,
    nextSceneId: 'laguna-recupera-color'
  },
  {
    id: 'laguna-recupera-color',
    speaker: 'Lumiércoles',
    text: 'La laguna empieza a recuperar sus colores. ¡Sigue buscando!',
    audioText: 'La laguna empieza a recuperar sus colores. ¡Sigue buscando!',
    visualCue: '\uD83C\uDF0A',
    soundCue: 'word_correct',
    blocking: false,
    nextSceneId: 'primera-pagina'
  },
  {
    id: 'primera-pagina',
    speaker: 'Rina',
    text: '¡Lo lograste! Las rimas vuelven a cantar. Aquí tienes una página del Gran Libro.',
    audioText: '¡Lo lograste! Las rimas vuelven a cantar. Aquí tienes una página del Gran Libro.',
    visualCue: '\uD83D\uDCD6',
    soundCue: 'mission_complete',
    blocking: true,
    nextSceneId: null
  }
];

export var SCENE_MAP = {};
SCENES.forEach(function (s) { SCENE_MAP[s.id] = s; });
