/**
 * session-manager.js
 * Gestión de sesión para el sistema multiperfil.
 * Aislado del modo colaborativo.
 */

const SESSION_KEYS = Object.freeze({
  SESSION: 'lectoguarida:session:v1',
  SOLO_PROGRESS: 'lectoguarida:solo-progress:v1',
  SOLO_SETTINGS: 'lectoguarida:solo-settings:v1'
});

function createDefaultSession() {
  return {
    sessionVersion: 1,
    modeGame: null,
    readerProfile: null,
    studentProfileId: generateId(),
    worldId: null,
    gameId: null,
    inputMode: detectInputMode(),
    startedAt: new Date().toISOString()
  };
}

function generateId() {
  return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function detectInputMode() {
  if (typeof navigator === 'undefined') return 'keyboard';
  const ua = navigator.userAgent || '';
  if (/Mobi|Android|iPhone|iPad/i.test(ua)) return 'touch';
  return 'mouse';
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEYS.SESSION);
    if (!raw) return createDefaultSession();
    const parsed = JSON.parse(raw);
    if (parsed && parsed.sessionVersion === 1 && parsed.modeGame) {
      return parsed;
    }
    return createDefaultSession();
  } catch {
    return createDefaultSession();
  }
}

function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEYS.SESSION, JSON.stringify(session));
  } catch {
    // storage full or unavailable — degrade silently
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEYS.SESSION);
  } catch {
    // ignore
  }
}

function updateSessionMode(session, mode) {
  session.modeGame = mode;
  saveSession(session);
  return session;
}

function updateSessionProfile(session, profile) {
  if (profile !== null && !['non_reader', 'beginner', 'advanced'].includes(profile)) {
    return session;
  }
  session.readerProfile = profile;
  if (profile) {
    session.modeGame = 'solo';
  }
  saveSession(session);
  return session;
}

function isSessionValid(session) {
  return (
    session &&
    session.sessionVersion === 1 &&
    ['collab', 'solo', null].includes(session.modeGame)
  );
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SESSION_KEYS,
    createDefaultSession,
    loadSession,
    saveSession,
    clearSession,
    updateSessionMode,
    updateSessionProfile,
    isSessionValid,
    generateId,
    detectInputMode
  };
}
if (typeof window !== 'undefined') {
  window.SESSION_KEYS = SESSION_KEYS;
  window.createDefaultSession = createDefaultSession;
  window.loadSession = loadSession;
  window.saveSession = saveSession;
  window.clearSession = clearSession;
  window.updateSessionMode = updateSessionMode;
  window.updateSessionProfile = updateSessionProfile;
  window.isSessionValid = isSessionValid;
}
