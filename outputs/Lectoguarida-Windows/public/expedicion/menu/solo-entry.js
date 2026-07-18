/**
 * solo-entry.js
 * Router de modo individual — maneja todas las rutas /expedicion/solo/*.
 * Se carga en el contexto del menú (index.html) y renderiza el contenido
 * correspondiente según la ruta actual.
 */

(function () {
  'use strict';

  const SOLO_CONTAINER_ID = 'solo-container';
  const MENU_CONTAINER_SELECTOR = '.menu-grid, .menu-header, .footer';

  function isSoloRoute() {
    return window.location.pathname.startsWith('/expedicion/solo');
  }

  function hideMenuContent() {
    document.querySelectorAll(MENU_CONTAINER_SELECTOR).forEach(function (el) {
      el.style.display = 'none';
    });
    var header = document.querySelector('.menu-header');
    if (header) header.style.display = 'none';
    var footer = document.querySelector('.footer');
    if (footer) footer.style.display = 'none';
  }

  function showMenuContent() {
    document.querySelectorAll(MENU_CONTAINER_SELECTOR).forEach(function (el) {
      el.style.display = '';
    });
    var header = document.querySelector('.menu-header');
    if (header) header.style.display = '';
    var footer = document.querySelector('.footer');
    if (footer) footer.style.display = '';
  }

  function getOrCreateContainer() {
    var container = document.getElementById(SOLO_CONTAINER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = SOLO_CONTAINER_ID;
      container.style.cssText = 'width:100%;max-width:800px;margin:0 auto;';
      document.body.insertBefore(container, document.body.firstChild);
    }
    return container;
  }

  function renderProfileSelector() {
    var container = getOrCreateContainer();
    container.innerHTML = '\
      <div style="text-align:center;padding:32px 16px;">\
        <h2 style="margin:0 0 8px;font-size:1.6rem;">Elige tu perfil de lectura</h2>\
        <p style="color:var(--muted);margin:0 0 28px;">Puedes cambiar en cualquier momento. Tu progreso se guarda por separado.</p>\
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;">\
          <a href="/expedicion/solo/no-lectores" class="menu-card card-non-reader" style="min-height:140px;">\
            <div class="icon" aria-hidden="true">🌱</div>\
            <span class="profile-tag">Perfil 1</span>\
            <h2>No Lectores</h2>\
            <p>Sonidos, letras, imágenes y aventuras guiadas.</p>\
          </a>\
          <a href="/expedicion/solo/principiantes" class="menu-card card-beginner" style="min-height:140px;">\
            <div class="icon" aria-hidden="true">📖</div>\
            <span class="profile-tag">Perfil 2</span>\
            <h2>Principiantes</h2>\
            <p>Sílabas, palabras y primeras lecturas.</p>\
          </a>\
          <a href="/expedicion/solo/avanzados" class="menu-card card-advanced" style="min-height:140px;">\
            <div class="icon" aria-hidden="true">🛡️</div>\
            <span class="profile-tag">Perfil 3</span>\
            <h2>Avanzados</h2>\
            <p>Comprensión, desafíos y el Guardián del Códice.</p>\
          </a>\
        </div>\
        <a href="/expedicion/" style="display:inline-block;margin-top:24px;color:var(--accent);text-decoration:none;font-weight:600;">← Volver al menú principal</a>\
      </div>';
    bindSoloLinks(container);
  }

  function renderProfilePlaceholder(profileId) {
    var names = { non_reader: 'No Lectores', beginner: 'Principiantes', advanced: 'Avanzados' };
    var icons = { non_reader: '🌱', beginner: '📖', advanced: '🛡️' };
    var descriptions = {
      non_reader: 'Sonidos, letras, imágenes y aventuras guiadas.',
      beginner: 'Sílabas, palabras y primeras lecturas.',
      advanced: 'Comprensión, desafíos y el Guardián del Códice.'
    };

    var container = getOrCreateContainer();
    container.innerHTML = '\
      <div style="text-align:center;padding:40px 16px;">\
        <div style="font-size:48px;margin-bottom:16px;">' + icons[profileId] + '</div>\
        <h2 style="margin:0 0 8px;font-size:1.5rem;">' + names[profileId] + '</h2>\
        <p style="color:var(--muted);margin:0 0 24px;max-width:480px;margin-left:auto;margin-right:auto;">' + descriptions[profileId] + '</p>\
        <div style="background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:28px;max-width:480px;margin:0 auto;">\
          <p style="margin:0 0 16px;font-weight:700;font-size:1.1rem;">Proximamente</p>\
          <p style="margin:0;color:var(--muted);line-height:1.5;">Los minijuegos de este perfil estarán disponibles en la próxima actualización. Tu progreso se guardará automáticamente.</p>\
        </div>\
        <div style="margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">\
          <a href="/expedicion/solo/" style="color:var(--accent);text-decoration:none;font-weight:600;">← Cambiar perfil</a>\
          <a href="/expedicion/" style="color:var(--muted);text-decoration:none;">Menú principal</a>\
        </div>\
      </div>';

    var session = loadSession();
    updateSessionProfile(session, profileId);
  }

  function renderGuaridaPlaceholder() {
    var container = getOrCreateContainer();
    container.innerHTML = '\
      <div style="text-align:center;padding:40px 16px;">\
        <div style="font-size:48px;margin-bottom:16px;">🏠</div>\
        <h2 style="margin:0 0 8px;font-size:1.5rem;">Guarida Personal</h2>\
        <p style="color:var(--muted);margin:0 0 24px;">Tu espacio personal dentro de la Expedición.</p>\
        <div style="background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:28px;max-width:480px;margin:0 auto;">\
          <p style="margin:0;color:var(--muted);line-height:1.5;">La Guarida Personal estará disponible en una futura actualización.</p>\
        </div>\
        <a href="/expedicion/solo/" style="display:inline-block;margin-top:24px;color:var(--accent);text-decoration:none;font-weight:600;">← Volver al selector</a>\
      </div>';
  }

  function renderGamePlaceholder(profileId, gameId) {
    var container = getOrCreateContainer();
    container.innerHTML = '\
      <div style="text-align:center;padding:40px 16px;">\
        <div style="font-size:48px;margin-bottom:16px;">🎮</div>\
        <h2 style="margin:0 0 8px;font-size:1.5rem;">Minijuego</h2>\
        <p style="color:var(--muted);margin:0 0 24px;">Este minijuego estará disponible próximamente.</p>\
        <div style="background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:28px;max-width:480px;margin:0 auto;">\
          <p style="margin:0 0 8px;font-weight:600;">Perfil: ' + profileId + '</p>\
          <p style="margin:0;color:var(--muted);">Juego: ' + gameId + '</p>\
        </div>\
        <a href="/expedicion/solo/' + (profileId === 'non_reader' ? 'no-lectores' : profileId === 'beginner' ? 'principiantes' : 'avanzados') + '" style="display:inline-block;margin-top:24px;color:var(--accent);text-decoration:none;font-weight:600;">← Volver al mapa</a>\
      </div>';
  }

  function renderGuardianPlaceholder(worldId) {
    var container = getOrCreateContainer();
    container.innerHTML = '\
      <div style="text-align:center;padding:40px 16px;">\
        <div style="font-size:48px;margin-bottom:16px;">🛡️</div>\
        <h2 style="margin:0 0 8px;font-size:1.5rem;">Guardián del Códice</h2>\
        <p style="color:var(--muted);margin:0 0 24px;">Mundo ' + worldId + ' — Desafío de comprensión lectora.</p>\
        <div style="background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:28px;max-width:480px;margin:0 auto;">\
          <p style="margin:0;color:var(--muted);line-height:1.5;">El Guardián del Códice estará disponible en una futura actualización.</p>\
        </div>\
        <a href="/expedicion/solo/avanzados" style="display:inline-block;margin-top:24px;color:var(--accent);text-decoration:none;font-weight:600;">← Volver al mapa</a>\
      </div>';
  }

  function handleSoloRoute() {
    var path = window.location.pathname;
    document.title = 'Lectoguarida Expedición — Modo Individual';

    hideMenuContent();

    if (path === '/expedicion/solo' || path === '/expedicion/solo/') {
      renderProfileSelector();
      return;
    }

    var profileMap = {
      '/expedicion/solo/no-lectores': 'non_reader',
      '/expedicion/solo/principiantes': 'beginner',
      '/expedicion/solo/avanzados': 'advanced'
    };

    if (profileMap[path]) {
      renderProfilePlaceholder(profileMap[path]);
      return;
    }

    var gameMatch = path.match(/^\/expedicion\/solo\/juego\/([^/]+)\/([^/]+)$/);
    if (gameMatch) {
      renderGamePlaceholder(gameMatch[1], gameMatch[2]);
      return;
    }

    var guardianMatch = path.match(/^\/expedicion\/solo\/guardian-codice\/([^/]+)$/);
    if (guardianMatch) {
      renderGuardianPlaceholder(guardianMatch[1]);
      return;
    }

    if (path === '/expedicion/solo/guarida') {
      renderGuaridaPlaceholder();
      return;
    }

    window.location.href = '/expedicion/';
  }

  function bindSoloLinks(container) {
    container.querySelectorAll('a[href]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var href = link.getAttribute('href');
        window.history.pushState({}, '', href);
        handleSoloRoute();
      });
    });
  }

  window.addEventListener('popstate', function () {
    if (isSoloRoute()) {
      handleSoloRoute();
    } else {
      showMenuContent();
      var container = document.getElementById(SOLO_CONTAINER_ID);
      if (container) container.innerHTML = '';
      document.title = 'Lectoguarida Expedición — Elige tu modo';
    }
  });

  if (isSoloRoute()) {
    handleSoloRoute();
  }

  window.SoloRouter = {
    handleSoloRoute: handleSoloRoute,
    renderProfileSelector: renderProfileSelector,
    renderProfilePlaceholder: renderProfilePlaceholder
  };
})();
