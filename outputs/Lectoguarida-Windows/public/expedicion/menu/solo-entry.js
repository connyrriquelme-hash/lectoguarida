/**
 * solo-entry.js
 * Router de modo individual — maneja todas las rutas /expedicion/solo/*.
 * Se carga en el contexto del menú (index.html) y renderiza el contenido
 * correspondiente según la ruta actual.
 * Carga dinámicamente los scripts del modo solo cuando es necesario.
 */

(function () {
  'use strict';

  var SOLO_SCRIPTS_LOADED = false;

  var SOLO_SCRIPT_BASE = '/expedicion/solo/';

  var SOLO_SCRIPT_LIST = [
    'core/solo-state-machine.js',
    'core/game-config-validator.js',
    'core/input-manager.js',
    'core/scoring-engine.js',
    'core/feedback-manager.js',
    'core/reward-manager.js',
    'core/progress-repository.js',
    'core/audio-manager.js',
    'core/voice-guidance-ui.js',
    'core/asset-loader.js',
    'ui/resilient-game-asset.js',
    'core/accessibility-manager.js',
    'core/error-boundary.js',
    'templates/click-selection-template.js',
    'templates/drag-drop-template.js',
    'templates/avatar-movement-template.js',
    'templates/syllable-tap-template.js',
    'templates/falling-items-template.js',
    'plugins/audio-instruction-plugin.js',
    'plugins/timer-plugin.js',
    'plugins/keyboard-input-plugin.js',
    'plugins/reward-plugin.js',
    'plugins/accessibility-plugin.js',
    'core/solo-game-engine.js',
    'core/solo-game-adapter.js',
    'games/vocal-a-game.js',
    'games/non-reader/rim-catcher.js',
    'games/non-reader/initial-sound-detector.js',
    'games/non-reader/syllable-counter.js',
    'games/non-reader/final-sound-catcher.js',
    '../menu/menu.js',
    '../menu/solo-entry.js'
  ];

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[data-solo-src="' + src + '"]')) {
        resolve();
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.setAttribute('data-solo-src', src);
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function loadSoloScripts(callback) {
    if (SOLO_SCRIPTS_LOADED) {
      callback();
      return;
    }
    var toLoad = [];
    for (var i = 0; i < SOLO_SCRIPT_LIST.length; i++) {
      var src = SOLO_SCRIPT_BASE + SOLO_SCRIPT_LIST[i];
      if (!document.querySelector('script[data-solo-src="' + src + '"]')) {
        toLoad.push(src);
      }
    }
    if (toLoad.length === 0) {
      SOLO_SCRIPTS_LOADED = true;
      callback();
      return;
    }
    var loaded = 0;
    toLoad.forEach(function (src) {
      loadScript(src).then(function () {
        loaded++;
        if (loaded === toLoad.length) {
          SOLO_SCRIPTS_LOADED = true;
          callback();
        }
      }).catch(function () {
        loaded++;
        if (loaded === toLoad.length) {
          callback();
        }
      });
    });
  }

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

  function renderNonReaderMap() {
    var games = SoloGameAdapter.listGames('non_reader');
    var container = getOrCreateContainer();
    var cardsHtml = '';
    var icons = { 'rim-catcher': '🎵', 'initial-sound-detector': '🔤', 'syllable-counter': '🧩', 'final-sound-catcher': '🎯', 'vocal-a': '🅰️' };
    var descriptions = {
      'rim-catcher': 'Identifica palabras que riman con una palabra objetivo.',
      'initial-sound-detector': 'Reconoce el sonido con que empieza una palabra.',
      'syllable-counter': 'Toca cada sílaba de la palabra en orden correcto.',
      'final-sound-catcher': 'Atrapa los items que terminan con el sonido indicado.',
      'vocal-a': 'Selecciona la vocal correcta.'
    };

    games.forEach(function (game) {
      var icon = icons[game.id] || '🎮';
      var desc = descriptions[game.id] || '';
      var progress = getGameProgress(game.id);
      var progressHtml = progress > 0
        ? '<div style="margin-top:8px;"><div style="background:var(--line);border-radius:4px;height:6px;overflow:hidden;"><div style="width:' + progress + '%;background:var(--accent);height:100%;"></div></div></div>'
        : '';
      cardsHtml += '<a href="/expedicion/solo/juego/non_reader/' + game.id + '" class="menu-card" style="min-height:120px;display:flex;flex-direction:column;justify-content:center;">' +
        '<div style="font-size:32px;margin-bottom:8px;">' + icon + '</div>' +
        '<h3 style="margin:0 0 4px;font-size:1rem;">' + game.title + '</h3>' +
        '<p style="margin:0;color:var(--muted);font-size:0.85rem;line-height:1.4;">' + desc + '</p>' +
        progressHtml +
        '</a>';
    });

    container.innerHTML = '\
      <div style="padding:24px 16px;">\
        <div style="text-align:center;margin-bottom:24px;">\
          <div style="font-size:48px;margin-bottom:8px;">🌱</div>\
          <h2 style="margin:0 0 4px;font-size:1.5rem;">No Lectores — Mapa de Juegos</h2>\
          <p style="color:var(--muted);margin:0;">Sonidos, letras, imágenes y aventuras guiadas.</p>\
        </div>\
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;max-width:800px;margin:0 auto;">' +
          cardsHtml +
        '</div>\
        <div style="text-align:center;margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">\
          <a href="/expedicion/solo/" style="color:var(--accent);text-decoration:none;font-weight:600;">← Cambiar perfil</a>\
          <a href="/expedicion/" style="color:var(--muted);text-decoration:none;">Menú principal</a>\
        </div>\
      </div>';

    bindSoloLinks(container);

    var session = loadSession();
    updateSessionProfile(session, 'non_reader');
  }

  function getGameProgress(gameId) {
    try {
      var session = loadSession();
      var studentProfileId = session && session.studentProfileId ? session.studentProfileId : 'default-student';
      var progress = SoloProgressRepository.getProfileProgress(studentProfileId, 'non_reader');
      if (!progress || !progress.stars) return 0;
      var gameStars = progress.stars[gameId] || 0;
      return Math.min(100, gameStars * 34);
    } catch {
      return 0;
    }
  }

  function renderProfilePlaceholder(profileId) {
    if (profileId === 'non_reader' && typeof SoloGameAdapter !== 'undefined') {
      renderNonReaderMap();
      return;
    }
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
          <p style="margin:0 0 16px;font-weight:700;font-size:1.1rem;">Próximamente</p>\
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
    var gameDef = SoloGameAdapter.getGameDef(gameId);
    if (gameDef) {
      renderGameArea(profileId, gameId);
      return;
    }

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

  function renderGameArea(profileId, gameId) {
    var container = getOrCreateContainer();
    container.innerHTML = '\
      <div style="padding:16px;">\
        <div id="solo-game-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">\
          <a href="/expedicion/solo/' + (profileId === 'non_reader' ? 'no-lectores' : profileId === 'beginner' ? 'principiantes' : 'avanzados') + '" style="color:var(--accent);text-decoration:none;font-weight:600;">← Volver</a>\
          <span id="solo-game-score" style="font-weight:700;"></span>\
        </div>\
        <div id="solo-game-area" style="max-width:600px;margin:0 auto;"></div>\
        <div id="solo-game-footer" style="text-align:center;margin-top:16px;"></div>\
      </div>';

    var gameArea = document.getElementById('solo-game-area');
    if (!gameArea) return;

    var session = loadSession();
    var studentProfileId = session && session.studentProfileId ? session.studentProfileId : 'default-student';

    var adapter = SoloGameAdapter.createEngine({
      studentProfileId: studentProfileId,
      container: gameArea,
      gameId: gameId
    });

    if (!adapter) {
      gameArea.innerHTML = '<p style="text-align:center;color:var(--muted);">Juego no encontrado</p>';
      return;
    }

    var engine = adapter.engine;

    engine.getStateMachine().subscribe(function (state, phase) {
      var header = document.getElementById('solo-game-header');
      var footer = document.getElementById('solo-game-footer');
      var scoreEl = document.getElementById('solo-game-score');

      if (phase === 'PLAYING' && scoreEl) {
        scoreEl.textContent = 'Jugando...';
      }

      if (phase === 'FEEDBACK' && scoreEl) {
        var sc = engine.getScoring();
        if (sc) scoreEl.textContent = 'Puntaje: ' + sc.score;
      }

      if (phase === 'GAME_COMPLETE' && footer) {
        var finalSc = engine.getScoring();
        var stars = finalSc ? finalSc.score >= 200 ? '⭐⭐⭐' : finalSc.score >= 100 ? '⭐⭐' : '⭐' : '⭐';
        footer.innerHTML = '\
          <div style="background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:24px;max-width:400px;margin:0 auto;">\
            <p style="font-size:2rem;margin:0 0 8px;">' + stars + '</p>\
            <p style="margin:0 0 4px;font-weight:700;">¡Completado!</p>\
            <p style="margin:0 0 16px;color:var(--muted);">Puntaje: ' + (finalSc ? finalSc.score : 0) + '</p>\
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">\
              <button id="solo-replay-btn" style="padding:8px 20px;border-radius:8px;border:1px solid var(--accent);background:transparent;color:var(--accent);cursor:pointer;font-weight:600;">Replay</button>\
              <a href="/expedicion/solo/' + (profileId === 'non_reader' ? 'no-lectores' : profileId === 'beginner' ? 'principiantes' : 'avanzados') + '" style="padding:8px 20px;border-radius:8px;border:none;background:var(--accent);color:#fff;text-decoration:none;font-weight:600;">Volver al mapa</a>\
            </div>\
          </div>';
        if (scoreEl) scoreEl.textContent = '';

        var replayBtn = document.getElementById('solo-replay-btn');
        if (replayBtn) {
          replayBtn.addEventListener('click', function () {
            footer.innerHTML = '';
            engine.resetGame();
            adapter.loadAndStart();
          });
        }
      }

      if (phase === 'GAME_FAILED' && footer) {
        footer.innerHTML = '\
          <div style="background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:24px;max-width:400px;margin:0 auto;">\
            <p style="margin:0 0 8px;font-weight:700;color:#f44336;">Hubo un error</p>\
            <p style="margin:0 0 16px;color:var(--muted);">Intenta de nuevo</p>\
            <a href="/expedicion/solo/' + (profileId === 'non_reader' ? 'no-lectores' : profileId === 'beginner' ? 'principiantes' : 'avanzados') + '" style="padding:8px 20px;border-radius:8px;border:none;background:var(--accent);color:#fff;text-decoration:none;font-weight:600;">Volver al mapa</a>\
          </div>';
        if (scoreEl) scoreEl.textContent = '';
      }
    });

    adapter.loadAndStart();
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

  function renderDemo(demoId) {
    var container = getOrCreateContainer();
    container.innerHTML = '\
      <div style="text-align:center;padding:24px 16px;">\
        <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px 16px;margin-bottom:20px;max-width:600px;margin-left:auto;margin-right:auto;">\
          <strong>Demostración técnica</strong> — No es un juego final\
        </div>\
        <div id="solo-demo-area" style="max-width:600px;margin:0 auto;"></div>\
        <a href="/expedicion/solo/" style="display:inline-block;margin-top:24px;color:var(--accent);text-decoration:none;font-weight:600;">← Volver al selector</a>\
      </div>';

    var demoArea = document.getElementById('solo-demo-area');
    if (!demoArea) return;

    var session = loadSession();
    var profileId = session && session.readerProfile ? session.readerProfile : 'non_reader';
    var studentProfileId = session && session.studentProfileId ? session.studentProfileId : 'demo-student';

    var engine = SoloGameEngine.create({
      studentProfileId: studentProfileId,
      container: demoArea
    });

    var template = null;
    if (demoId === 'click-selection' && typeof ClickSelectionDemo !== 'undefined') {
      template = ClickSelectionDemo.create(demoArea, engine);
    } else if (demoId === 'drag-drop' && typeof DragDropDemo !== 'undefined') {
      template = DragDropDemo.create(demoArea, engine);
    } else if (demoId === 'avatar-movement' && typeof AvatarMovementDemo !== 'undefined') {
      template = AvatarMovementDemo.create(demoArea, engine);
    } else {
      demoArea.innerHTML = '<p>Demo no encontrada</p>';
      return;
    }

    engine.setTemplate(template);
    engine.addPlugin(AudioInstructionPlugin.create({ audioManager: AudioManager }));
    engine.addPlugin(TimerPlugin.create({ accessibility: engine.getAccessibility() }));
    engine.addPlugin(KeyboardInputPlugin.create({ inputManager: engine.getInputManager() }));
    engine.addPlugin(RewardPlugin.create({ rewardManager: engine.getRewardManager() }));
    engine.addPlugin(AccessibilityPlugin.create({ accessibility: engine.getAccessibility() }));

    var demoConfig = null;
    if (demoId === 'click-selection' && typeof ClickSelectionDemo !== 'undefined') {
      demoConfig = ClickSelectionDemo.DEMO_CONFIG;
    } else if (demoId === 'drag-drop' && typeof DragDropDemo !== 'undefined') {
      demoConfig = DragDropDemo.DEMO_CONFIG;
    } else if (demoId === 'avatar-movement' && typeof AvatarMovementDemo !== 'undefined') {
      demoConfig = AvatarMovementDemo.DEMO_CONFIG;
    }

    if (demoConfig) {
      engine.loadGame(demoConfig);
      engine.startGame();
    }
  }

  function handleSoloRoute() {
    var path = window.location.pathname;
    document.title = 'Lectoguarida Expedición — Modo Individual';

    hideMenuContent();

    loadSoloScripts(function () {
      handleSoloRouteAfterLoad();
    });
  }

  function handleSoloRouteAfterLoad() {
    var path = window.location.pathname;

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

    var demoMatch = path.match(/^\/expedicion\/solo\/demo\/([^/]+)$/);
    if (demoMatch) {
      renderDemo(demoMatch[1]);
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
    renderProfilePlaceholder: renderProfilePlaceholder,
    renderDemo: renderDemo
  };
})();
