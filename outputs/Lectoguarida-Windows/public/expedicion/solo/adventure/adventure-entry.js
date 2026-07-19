/**
 * adventure-entry.js
 * Punto de entrada de la aventura. Se carga como módulo ES desde la ruta
 * /expedicion/solo/aventura. Reutiliza las APIs globales del menú solo.
 */

import { createAdventureEngine } from './adventure-engine.js';

var ADVENTURE_INSTANCE = null;

function getSession() {
  try {
    if (typeof loadSession === 'function') return loadSession();
  } catch (e) {}
  return null;
}

function getDifficulty() {
  try {
    if (typeof NonReaderDifficultyStore !== 'undefined') {
      var session = getSession();
      var id = session && session.studentProfileId ? session.studentProfileId : 'default-student';
      return NonReaderDifficultyStore.getDifficulty(id, 'non_reader');
    }
  } catch (e) {}
  return 'estandar';
}

export function mountAdventure(container) {
  if (ADVENTURE_INSTANCE) {
    try { ADVENTURE_INSTANCE.destroy(); } catch (e) {}
    ADVENTURE_INSTANCE = null;
  }

  var session = getSession();
  var studentProfileId = session && session.studentProfileId ? session.studentProfileId : 'default-student';

  ADVENTURE_INSTANCE = createAdventureEngine({
    container: container,
    studentProfileId: studentProfileId,
    difficulty: getDifficulty(),
    deps: {
      SoloGameAdapter: typeof SoloGameAdapter !== 'undefined' ? SoloGameAdapter : null,
      SoloProgressRepository: typeof SoloProgressRepository !== 'undefined' ? SoloProgressRepository : null,
      AudioManager: typeof AudioManager !== 'undefined' ? AudioManager : null,
      onExit: function () {
        window.history.pushState({}, '', '/expedicion/solo/no-lectores');
        if (typeof window.SoloRouter !== 'undefined' && window.SoloRouter.handleSoloRoute) {
          window.SoloRouter.handleSoloRoute();
        }
      }
    }
  });

  ADVENTURE_INSTANCE.start();
  return ADVENTURE_INSTANCE;
}

export function destroyAdventure() {
  if (ADVENTURE_INSTANCE) {
    try { ADVENTURE_INSTANCE.destroy(); } catch (e) {}
    ADVENTURE_INSTANCE = null;
  }
}

export function getAdventureInstance() {
  return ADVENTURE_INSTANCE;
}

window.LectoguaridaAdventure = {
  mount: mountAdventure,
  destroy: destroyAdventure,
  getInstance: getAdventureInstance
};
