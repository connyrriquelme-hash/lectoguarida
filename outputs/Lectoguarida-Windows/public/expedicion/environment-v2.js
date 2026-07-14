/**
 * environment-v2.js
 * Capa visual V2 para Expedición Humedal
 * No modifica game.js — solo añade decoración, HUD y atmósfera
 * Cargado con defer DESPUÉS de game.js
 */

(function () {
  'use strict';

  // ============================================================
  // CONFIGURACIÓN
  // ============================================================
  const CONFIG = {
    particleCount: 16,
    particleMinSize: 3,
    particleMaxSize: 7,
    floatDurationMin: 18,
    floatDurationMax: 28,
    skillUpdateInterval: 500,
    toastDuration: 3500,
    reducedMotionQuery: '(prefers-reduced-motion: reduce)'
  };

  // ============================================================
  // ESTADO
  // ============================================================
  const state = {
    reducedMotion: false,
    particles: [],
    skillData: {},
    isVisible: true,
    v2Container: null,
    sidePanelCollapsed: false,
    gameReady: false
  };

  // ============================================================
  // UTILIDADES
  // ============================================================
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // ============================================================
  // INICIALIZACIÓN PRINCIPAL
  // ============================================================
  function initV2() {
    // Detectar reducción de movimiento
    state.reducedMotion = window.matchMedia(CONFIG.reducedMotionQuery).matches;
    window.matchMedia(CONFIG.reducedMotionQuery).addEventListener('change', (e) => {
      state.reducedMotion = e.matches;
      if (e.matches) pauseAnimations();
      else resumeAnimations();
    });

    // Crear contenedor raíz V2
    state.v2Container = document.createElement('div');
    state.v2Container.id = 'v2-environment';
    state.v2Container.className = 'v2-hidden'; // se quitará cuando esté listo
    document.body.appendChild(state.v2Container);

    // Construir DOM V2
    buildV2DOM();

    // Generar partículas
    if (!state.reducedMotion) createParticles();

    // Marcar como listo (fade-in)
    requestAnimationFrame(() => {
      state.v2Container.classList.remove('v2-hidden');
      state.v2Container.classList.add('v2-ready');
    });

    // Escuchar eventos del juego clásico (si expone eventos)
    hookGameEvents();

    // Loop de actualización HUD
    startSkillUpdater();

    // Marcar estado
    state.isVisible = true;

    console.info('[Expedición V2] Entorno visual inicializado');
  }

  // ============================================================
  // CONSTRUCCIÓN DEL DOM V2
  // ============================================================
  function buildV2DOM() {
    const c = state.v2Container;

    // Fondo ambiental
    c.innerHTML = `
      <div class="v2-ambient-bg" aria-hidden="true">
        <div class="v2-ambient-particles"></div>
      </div>

      <!-- BARRA SUPERIOR -->
      <header class="v2-top-bar" role="banner">
        <div class="v2-level-badge" id="v2LevelBadge">
          <span class="v2-icon" aria-hidden="true">🎒</span>
          <span id="v2LevelName">Kinder · Nivel 1</span>
        </div>
        <div class="v2-score-display" id="v2ScoreDisplay" role="status" aria-live="polite">
          <span class="v2-icon" aria-hidden="true">⭐</span>
          <span class="v2-label">Puntos</span>
          <span id="v2ScoreValue">0</span>
        </div>
      </header>

      <!-- PANEL LATERAL: PROGRESO/HABILIDADES -->
      <aside class="v2-side-panel" id="v2SidePanel" aria-label="Progreso y habilidades">
        <div class="v2-panel-header">
          <h2 class="v2-panel-title">Progreso</h2>
          <button class="v2-panel-close" id="v2PanelClose" aria-label="Ocultar panel" title="Ocultar panel">×</button>
        </div>
        <ul class="v2-skill-list" id="v2SkillList" aria-label="Habilidades desbloqueadas">
          <li class="v2-skill-empty">Completa tu primera misión para ver habilidades</li>
        </ul>
      </aside>

      <!-- BARRA INFERIOR -->
      <footer class="v2-bottom-bar" role="contentinfo">
        <div class="v2-mode-indicator" aria-live="polite">
          <span aria-hidden="true">🤝</span>
          <span>Trabajo Colaborativo</span>
        </div>
        <a class="v2-nav-link" href="/expedicion/juego" aria-label="Volver al entorno clásico">
          <span aria-hidden="true">↩</span>
          <span>Volver al entorno clásico</span>
        </a>
      </footer>

      <!-- TOAST / ESTADO -->
      <div class="v2-status-toast" id="v2StatusToast" role="status" aria-live="polite" aria-atomic="true"></div>
    `;

    // Bind eventos
    bindUIEvents();
  }

  function bindUIEvents() {
    // Cerrar panel lateral
    $('#v2PanelClose', state.v2Container)?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidePanel(true);
    });

    // Reabrir panel con click en badge (opcional)
    $('#v2LevelBadge', state.v2Container)?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidePanel(false);
    });

    // Cerrar panel al hacer click fuera — solo en elementos V2, nunca en overlay del boot
    state.v2Container?.addEventListener('click', (e) => {
      if (e.target.closest('#bootOverlay')) return;
      const panel = $('#v2SidePanel', state.v2Container);
      if (panel && !panel.contains(e.target) && !e.target.closest('.v2-level-badge')) {
        toggleSidePanel(true);
      }
    });
  }

  function toggleSidePanel(collapse) {
    const panel = $('#v2SidePanel', state.v2Container);
    if (!panel) return;
    state.sidePanelCollapsed = collapse;
    panel.classList.toggle('v2-collapsed', collapse);
  }

  // ============================================================
  // PARTÍCULAS AMBIENTALES
  // ============================================================
  function createParticles() {
    const container = $('.v2-ambient-particles', state.v2Container);
    if (!container) return;

    for (let i = 0; i < CONFIG.particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'v2-particle';
      const size = random(CONFIG.particleMinSize, CONFIG.particleMaxSize);
      const color = randomColor();
      const duration = random(CONFIG.floatDurationMin, CONFIG.floatDurationMax);
      const delay = random(0, 5);

      p.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${random(0, 100)}%;
        top: ${random(60, 100)}%;
        background: ${color};
        opacity: ${random(0.3, 0.7)};
        --duration: ${duration}s;
        --delay: ${delay}s;
      `;

      container.appendChild(p);
      state.particles.push(p);
    }
  }

  // ============================================================
  // ACTUALIZADOR DE HUD (skills, puntos, nivel)
  // ============================================================
  function startSkillUpdater() {
    setInterval(updateHUD, CONFIG.skillUpdateInterval);
  }

  function updateHUD() {
    // Leer estado del juego clásico si está disponible
    try {
      // game.js expone variables globales: puntos, estadoNivel, nivelActual, nivelesBase
      if (typeof puntos === 'number') {
        updateScore(puntos);
      }
      if (typeof estadoNivel === 'number') {
        updateLevel(estadoNivel);
      }
      if (typeof nivelActual === 'string' && nivelesBase) {
        updateLevelName(nivelActual);
      }
    } catch (e) {
      // game.js no disponible aún
    }

    // Actualizar skills si hay datos en localStorage o expuestos
    updateSkillsFromGame();
  }

  function updateScore(value) {
    const el = $('#v2ScoreValue', state.v2Container);
    if (el && Number(el.textContent) !== value) {
      el.textContent = value;
      animateScore(el);
    }
  }

  function animateScore(el) {
    el.style.transform = 'scale(1.3)';
    el.style.color = '#ffd45f';
    setTimeout(() => {
      el.style.transform = '';
      el.style.color = '';
    }, 150);
  }

  function updateLevel(value) {
    // El nivel ya se refleja en el badge via updateLevelName
  }

  function updateLevelName(key) {
    const el = $('#v2LevelName', state.v2Container);
    if (!el) return;
    const base = {
      kinder: 'Kinder · Nivel 1',
      segundo: 'Segundo · Nivel 2',
      sexto: 'Sexto · Nivel 3'
    };
    const name = base[key] || key;
    if (el.textContent !== name) {
      el.textContent = name;
      // Actualizar también el badge visual si existe en CSS
    }
  }

  function updateSkillsFromGame() {
    const list = $('#v2SkillList', state.v2Container);
    if (!list) return;

    // Intentar leer skills del juego clásico
    // game.js guarda en localStorage o expone window.LectoguaridaStore
    try {
      const store = window.LectoguaridaStore ||
                    JSON.parse(localStorage.getItem('lectoguarida-state') || '{}');

      if (store?.students?.length) {
        // Tomar el primer estudiante activo o el que tenga session
        const activeStudent = store.students.find(s => s.id === store.currentStudentId) ||
                              store.students[0];

        if (activeStudent?.skillProgress) {
          renderSkills(activeStudent.skillProgress);
        }
      }
    } catch (e) {
      // Sin datos aún
    }
  }

  function renderSkills(skills) {
    const list = $('#v2SkillList', state.v2Container);
    if (!list) return;

    const entries = Object.entries(skills);
    if (!entries.length) {
      list.innerHTML = '<li class="v2-skill-empty">Completa tu primera misión para ver habilidades</li>';
      return;
    }

    list.innerHTML = entries.map(([id, skill], idx) => `
      <li class="v2-skill-item" style="--delay: ${idx * 60}ms">
        <span class="v2-skill-icon" aria-hidden="true">${getSkillIcon(skill)}</span>
        <div class="v2-skill-info">
          <span class="v2-skill-name">${escapeHtml(skill.label || id)}</span>
          <div class="v2-skill-bar">
            <div class="v2-skill-progress" style="width: ${Math.min(100, (skill.points || 0) / 12 * 100)}%"></div>
          </div>
        </div>
        <span class="v2-skill-level">Niv ${skill.level || 1}</span>
      </li>
    `).join('');
  }

  function getSkillIcon(skill) {
    const icons = {
      fluidez: '📖',
      comprension: '🧠',
      vocabulario: '📝',
      precision: '🎯',
      ritmo: '🎵',
      expresion: '🗣️'
    };
    return icons[skill.id] || '✨';
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&', '<': '<', '>': '>', '"': '"', "'": '''
    }[c]));
  }

  // ============================================================
  // HOOKS DE EVENTOS DEL JUEGO CLÁSICO
  // ============================================================
  function hookGameEvents() {
    // Si game.js expone un event emitter o callbacks, conectar aquí
    // Por ahora: escuchar storage changes para skills
    window.addEventListener('storage', (e) => {
      if (e.key === 'lectoguarida-state') {
        setTimeout(updateSkillsFromGame, 100);
      }
    });

    // Escuchar cuando el motor inicia un nivel
    document.addEventListener('expedicion:level-started', (e) => {
      if (state.v2Container) {
        state.v2Container.classList.add('v2-playing');
      }
      const staticDemo = document.querySelector('.static-demo');
      if (staticDemo) {
        staticDemo.classList.add('hidden');
        staticDemo.hidden = true;
      }
    });

    // Escuchar eventos personalizados si game.js los emite
    window.addEventListener('lectoguarida:score', (e) => {
      updateScore(e.detail?.score);
      showToast('info', `¡+${e.detail?.points} puntos!`);
    });

    window.addEventListener('lectoguarida:levelup', (e) => {
      showToast('success', `¡Nivel ${e.detail?.level} desbloqueado!`);
    });
  }

  // ============================================================
  // TOASTS / NOTIFICACIONES
  // ============================================================
  function showToast(type, message) {
    const toast = $('#v2StatusToast', state.v2Container);
    if (!toast) return;

    toast.textContent = message;
    toast.className = 'v2-status-toast v2-visible v2-' + type;
    toast.style.display = 'block';

    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
      toast.classList.remove('v2-visible');
      setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, CONFIG.toastDuration);
  }

  // ============================================================
  // ANIMACIONES Y REDUCCIÓN DE MOVIMIENTO
  // ============================================================
  function pauseAnimations() {
    state.v2Container?.classList.add('v2-reduced-motion');
    state.particles.forEach(p => p.style.animationPlayState = 'paused');
    $('.v2-ambient-bg', state.v2Container)?.style.setProperty('animation-play-state', 'paused');
  }

  function resumeAnimations() {
    state.v2Container?.classList.remove('v2-reduced-motion');
    state.particles.forEach(p => p.style.animationPlayState = 'running');
    $('.v2-ambient-bg', state.v2Container)?.style.setProperty('animation-play-state', 'running');
  }

  // ============================================================
  // LIMPIEZA AL DESCARGAR
  // ============================================================
  window.addEventListener('beforeunload', () => {
    clearInterval(state._skillUpdater);
  });

  // ============================================================
  // EXPORTAR API MÍNIMA (para debugging)
  // ============================================================
  window.ExpedicionV2 = {
    showToast,
    toggleSidePanel,
    updateScore,
    updateSkillsFromGame,
    version: '2.0.0'
  };

  // ============================================================
  // UTILIDADES
  // ============================================================
  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randomColor() {
    const colors = [
      'rgba(104, 231, 255, 0.7)',  // cyan
      'rgba(138, 255, 198, 0.7)',  // mint
      'rgba(255, 212, 95, 0.7)',   // gold
      'rgba(255, 255, 255, 0.4)'   // blanco suave
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // ============================================================
  // ARRANQUE
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initV2);
  } else {
    initV2();
  }

})();