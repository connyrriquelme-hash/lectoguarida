/**
 * game-router.js
 * Router principal del sistema multiperfil.
 * Maneja la navegación entre menú, colaborativo y modo individual.
 * Aislado del motor colaborativo legacy.
 */

const GameRouter = (function () {
  let currentRoute = null;
  let session = null;

  function init() {
    session = loadSession();
    if (!isSessionValid(session)) {
      session = createDefaultSession();
      saveSession(session);
    }
    handleCurrentRoute();
    window.addEventListener('popstate', handleCurrentRoute);
  }

  function handleCurrentRoute() {
    const path = normalizePath(window.location.pathname);
    currentRoute = path;
    const wall = containmentWall(session);

    if (path === '/expedicion/' || path === '/expedicion') {
      navigateToMenu();
      return;
    }

    if (path === '/expedicion/colaborativo') {
      updateSessionMode(session, 'collab');
      redirectToCollab();
      return;
    }

    if (path.startsWith('/expedicion/solo/')) {
      if (!wall.solo) {
        updateSessionMode(session, 'solo');
      }
      handleSoloRoute(path);
      return;
    }

    if (path === '/expedicion/juego' || path === '/expedicion/juego-v2') {
      updateSessionMode(session, 'collab');
      loadCollabGame(path);
      return;
    }

    if (path === '/expedicion/dashboard') {
      loadDashboard();
      return;
    }

    navigateToMenu();
  }

  function normalizePath(path) {
    if (path.length > 1 && path.endsWith('/')) {
      return path.slice(0, -1);
    }
    return path;
  }

  function navigateToMenu() {
    updateSessionMode(session, null);
    updateSessionProfile(session, null);
    session.worldId = null;
    session.gameId = null;
    saveSession(session);
    renderMenu();
  }

  function renderMenu() {
    document.dispatchEvent(new CustomEvent('router:show-menu', {
      detail: { session }
    }));
  }

  function redirectToCollab() {
    window.location.href = ROUTE_CONFIG.routes.collab;
  }

  function loadCollabGame(path) {
    document.dispatchEvent(new CustomEvent('router:load-collab', {
      detail: { path, session }
    }));
  }

  function loadDashboard() {
    document.dispatchEvent(new CustomEvent('router:load-dashboard', {
      detail: { session }
    }));
  }

  function handleSoloRoute(path) {
    const profileMap = {
      '/expedicion/solo/no-lectores': 'non_reader',
      '/expedicion/solo/principiantes': 'beginner',
      '/expedicion/solo/avanzados': 'advanced'
    };

    if (profileMap[path]) {
      updateSessionProfile(session, profileMap[path]);
      document.dispatchEvent(new CustomEvent('router:load-profile', {
        detail: { profile: profileMap[path], session }
      }));
      return;
    }

    if (path === '/expedicion/solo') {
      document.dispatchEvent(new CustomEvent('router:show-profile-selector', {
        detail: { session }
      }));
      return;
    }

    const gameMatch = path.match(/^\/expedicion\/solo\/juego\/([^/]+)\/([^/]+)$/);
    if (gameMatch) {
      const [, profileId, gameId] = gameMatch;
      session.gameId = gameId;
      saveSession(session);
      document.dispatchEvent(new CustomEvent('router:load-game', {
        detail: { profileId, gameId, session }
      }));
      return;
    }

    const guardianMatch = path.match(/^\/expedicion\/solo\/guardian-codice\/([^/]+)$/);
    if (guardianMatch) {
      const [, worldId] = guardianMatch;
      session.worldId = worldId;
      saveSession(session);
      document.dispatchEvent(new CustomEvent('router:load-guardian', {
        detail: { worldId, session }
      }));
      return;
    }

    if (path === '/expedicion/solo/guarida') {
      document.dispatchEvent(new CustomEvent('router:load-guarida', {
        detail: { session }
      }));
      return;
    }

    navigateToMenu();
  }

  function navigate(path) {
    window.history.pushState({}, '', path);
    handleCurrentRoute();
  }

  function startCollab() {
    updateSessionMode(session, 'collab');
    navigate(ROUTE_CONFIG.routes.collab);
  }

  function startSolo(profileId) {
    if (!['non_reader', 'beginner', 'advanced'].includes(profileId)) return;
    updateSessionMode(session, 'solo');
    updateSessionProfile(session, profileId);
    navigate(ROUTE_CONFIG.routes.profileRoutes[profileId]);
  }

  function goToMenu() {
    navigate(ROUTE_CONFIG.routes.menu);
  }

  function getSession() {
    return session;
  }

  function getCurrentRoute() {
    return currentRoute;
  }

  return {
    init,
    navigate,
    startCollab,
    startSolo,
    goToMenu,
    getSession,
    getCurrentRoute,
    handleCurrentRoute
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameRouter };
}
