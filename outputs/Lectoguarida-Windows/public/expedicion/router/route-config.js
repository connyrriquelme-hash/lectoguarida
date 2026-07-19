/**
 * route-config.js
 * Definición de rutas del sistema multiperfil de Lectoguarida.
 * Aislado del modo colaborativo — no importa ni modifica scripts legacy.
 */

const ROUTE_CONFIG = Object.freeze({
  routes: {
    menu: '/expedicion/',
    collab: '/expedicion/juego',
    collabV2: '/expedicion/juego-v2',
    collabAlias: '/expedicion/colaborativo',
    solo: '/expedicion/solo/',
    soloNoReaders: '/expedicion/solo/no-lectores',
    soloBeginners: '/expedicion/solo/principiantes',
    soloAdvanced: '/expedicion/solo/avanzados',
    soloGame: '/expedicion/solo/juego/:profileId/:gameId',
    soloGuarida: '/expedicion/solo/guarida',
    soloGuardian: '/expedicion/solo/guardian-codice/:worldId',
    dashboard: '/expedicion/dashboard'
  },

  profileIds: Object.freeze(['non_reader', 'beginner', 'advanced']),

  profileRoutes: Object.freeze({
    non_reader: '/expedicion/solo/no-lectores',
    beginner: '/expedicion/solo/principiantes',
    advanced: '/expedicion/solo/avanzados'
  }),

  profileNames: Object.freeze({
    non_reader: 'No Lectores',
    beginner: 'Principiantes',
    advanced: 'Avanzados'
  }),

  modes: Object.freeze({ COLLAB: 'collab', SOLO: 'solo' }),

  sessionVersion: 1
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ROUTE_CONFIG };
}
if (typeof window !== 'undefined') {
  window.ROUTE_CONFIG = ROUTE_CONFIG;
}
