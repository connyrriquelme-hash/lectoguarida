/**
 * data/world-zones.js
 * Metadatos de zonas para HUD y fallback 2D.
 */

export var ZONE_META = {
  'plaza-guarida': { name: 'Plaza de la Guarida', icon: '🏠', desc: 'Punto de partida seguro.' },
  'laguna-rimas': { name: 'Laguna de las Rimas', icon: '🌊', desc: 'Recupera las campanas de la rima.', gameId: 'rhyme-catcher' },
  'bosque-sonido': { name: 'Bosque del Primer Sonido', icon: '🌳', desc: 'Próxima misión.', upcoming: true },
  'puente-silabas': { name: 'Puente de las Sílabas', icon: '🌉', desc: 'Próxima misión.', upcoming: true },
  'cueva-eco': { name: 'Cueva del Eco Final', icon: '🕳️', desc: 'Próxima misión.', upcoming: true }
};
