/**
 * menu.js
 * Inicialización del menú principal de 4 entradas.
 * Conecta los botones del menú con el router.
 */

(function () {
  'use strict';

  const FEATURE_FLAGS = {
    ENABLE_MULTIPROFILE_MENU: true,
    ENABLE_SOLO_GAME_ENGINE: false,
    ENABLE_CODEX_GUARDIAN: false,
    ENABLE_PERSONAL_GUARIDA: false
  };

  function initMenu() {
    const session = loadSession();
    if (!isSessionValid(session)) {
      clearSession();
    }

    if (window.location.pathname === '/expedicion/colaborativo') {
      updateSessionMode(session, 'collab');
      window.location.replace('/expedicion/juego');
      return;
    }

    if (window.location.pathname.startsWith('/expedicion/solo')) return;

    const cards = document.querySelectorAll('.menu-card');
    cards.forEach(function (card) {
      card.addEventListener('click', function (e) {
        e.preventDefault();
        const href = card.getAttribute('href');
        if (!href) return;

        if (href === '/expedicion/juego') {
          if (!FEATURE_FLAGS.ENABLE_MULTIPROFILE_MENU) {
            window.location.href = href;
            return;
          }
          updateSessionMode(session, 'collab');
          window.location.href = href;
          return;
        }

        if (!FEATURE_FLAGS.ENABLE_MULTIPROFILE_MENU) return;

        const profileMap = {
          '/expedicion/solo/no-lectores': 'non_reader',
          '/expedicion/solo/principiantes': 'beginner',
          '/expedicion/solo/avanzados': 'advanced'
        };

        const profileId = profileMap[href];
        if (profileId) {
          updateSessionMode(session, 'solo');
          updateSessionProfile(session, profileId);
          window.location.href = href;
        }
      });

      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    document.dispatchEvent(new CustomEvent('menu:ready', {
      detail: { session, featureFlags: FEATURE_FLAGS }
    }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMenu);
  } else {
    initMenu();
  }

  window.LectoguaridaMenu = {
    featureFlags: FEATURE_FLAGS
  };
})();
