/**
 * navigation-guards.js
 * Guardias de navegación para el router multiperfil.
 * Separa estrictamente colaborativo de individual.
 */

const NavigationGuards = (function () {
  function requiresCollab(session) {
    return session && session.modeGame === 'collab';
  }

  function requiresSolo(session) {
    return session && session.modeGame === 'solo';
  }

  function hasValidProfile(session) {
    return (
      session &&
      session.readerProfile &&
      ['non_reader', 'beginner', 'advanced'].includes(session.readerProfile)
    );
  }

  function guardCollabRoute(session) {
    if (!session || !requiresCollab(session)) {
      return { allowed: false, reason: 'not_collab_mode' };
    }
    return { allowed: true };
  }

  function guardSoloRoute(session) {
    if (!session || !requiresSolo(session)) {
      return { allowed: false, reason: 'not_solo_mode' };
    }
    if (!hasValidProfile(session)) {
      return { allowed: false, reason: 'no_profile_selected' };
    }
    return { allowed: true };
  }

  function guardProfileRoute(session, requestedProfile) {
    if (!requiresSolo(session)) {
      return { allowed: false, reason: 'not_solo_mode' };
    }
    const validProfiles = ['non_reader', 'beginner', 'advanced'];
    if (!validProfiles.includes(requestedProfile)) {
      return { allowed: false, reason: 'invalid_profile' };
    }
    return { allowed: true };
  }

  function containmentWall(session) {
    if (!session) {
      return { collab: true, solo: false };
    }
    if (session.modeGame === 'collab') {
      return {
        collab: true,
        solo: false,
        reason: 'collab_mode_active'
      };
    }
    if (session.modeGame === 'solo') {
      return {
        collab: false,
        solo: true,
        reason: 'solo_mode_active'
      };
    }
    return { collab: true, solo: true, reason: 'no_mode_set' };
  }

  return {
    requiresCollab,
    requiresSolo,
    hasValidProfile,
    guardCollabRoute,
    guardSoloRoute,
    guardProfileRoute,
    containmentWall
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NavigationGuards };
}
if (typeof window !== 'undefined') {
  window.NavigationGuards = NavigationGuards;
}
