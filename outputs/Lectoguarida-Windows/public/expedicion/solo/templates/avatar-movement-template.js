/**
 * avatar-movement-template.js
 * Plantilla genérica de movimiento de avatar.
 * Soporta: posición del avatar, límites del escenario, teclado,
 * controles táctiles, movimiento continuo, colisiones simples,
 * objetivo final, obstáculos, pausa, reinicio.
 * No usa física compleja.
 */

var AvatarMovementTemplate = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var container = options.container;
    var config = options.config;
    var engine = options.engine;
    var inputManager = engine ? engine.getInputManager() : null;
    var feedback = engine ? engine.getFeedback() : null;

    var state = {
      avatar: { x: 50, y: 50 },
      target: { x: 200, y: 200 },
      obstacles: [],
      bounds: { width: 400, height: 300 },
      paused: false,
      completed: false,
      speed: 3,
      keys: {}
    };

    var animFrame = null;

    function start() {
      state.completed = false;
      state.paused = false;
      if (config && config.content) {
        state.bounds.width = config.content.width || 400;
        state.bounds.height = config.content.height || 300;
        state.avatar.x = config.content.startX || 50;
        state.avatar.y = config.content.startY || 50;
        state.target.x = config.content.targetX || 350;
        state.target.y = config.content.targetY || 250;
        state.obstacles = config.content.obstacles || [];
        state.speed = config.content.speed || 3;
      }
      render();
      bindKeys();
      gameLoop();
    }

    function render() {
      if (!container) return;
      var html = '<div class="solo-avatar-movement">';
      html += '<div class="solo-avatar-header">';
      html += '<h3>' + (config && config.title ? config.title : 'Mueve el avatar') + '</h3>';
      html += '<button class="solo-pause-btn" data-action="pause">Pausa</button>';
      html += '</div>';
      html += '<div class="solo-avatar-arena" style="width:' + state.bounds.width + 'px;height:' + state.bounds.height + 'px;position:relative;border:2px solid var(--line);border-radius:12px;overflow:hidden;background:var(--panel);">';

      state.obstacles.forEach(function (obs, i) {
        html += '<div class="solo-obstacle" style="position:absolute;left:' + obs.x + 'px;top:' + obs.y + 'px;width:' + (obs.w || 40) + 'px;height:' + (obs.h || 40) + 'px;background:#f44336;border-radius:4px;opacity:0.7;"></div>';
      });

      html += '<div class="solo-target" style="position:absolute;left:' + state.target.x + 'px;top:' + state.target.y + 'px;width:30px;height:30px;background:#ffd700;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">⭐</div>';
      html += '<div class="solo-avatar" id="solo-avatar" style="position:absolute;left:' + state.avatar.x + 'px;top:' + state.avatar.y + 'px;width:30px;height:30px;background:#4caf50;border-radius:50%;transition:none;">🧑</div>';

      html += '</div>';
      html += '<div class="solo-avatar-controls">';
      html += '<button data-dir="up">▲</button>';
      html += '<button data-dir="left">◀</button>';
      html += '<button data-dir="right">▶</button>';
      html += '<button data-dir="down">▼</button>';
      html += '</div>';
      html += '</div>';
      container.innerHTML = html;

      bindControls();
    }

    function bindControls() {
      var pauseBtn = container.querySelector('[data-action="pause"]');
      if (pauseBtn) {
        pauseBtn.addEventListener('click', function () {
          state.paused = !state.paused;
          pauseBtn.textContent = state.paused ? 'Reanudar' : 'Pausa';
          if (!state.paused) gameLoop();
        });
      }

      var dirBtns = container.querySelectorAll('[data-dir]');
      dirBtns.forEach(function (btn) {
        btn.addEventListener('touchstart', function (e) {
          e.preventDefault();
          state.keys[btn.getAttribute('data-dir')] = true;
        });
        btn.addEventListener('touchend', function (e) {
          e.preventDefault();
          state.keys[btn.getAttribute('data-dir')] = false;
        });
        btn.addEventListener('mousedown', function () {
          state.keys[btn.getAttribute('data-dir')] = true;
        });
        btn.addEventListener('mouseup', function () {
          state.keys[btn.getAttribute('data-dir')] = false;
        });
      });
    }

    function bindKeys() {
      document.addEventListener('keydown', onKeyDown);
      document.addEventListener('keyup', onKeyUp);
    }

    function onKeyDown(e) {
      var map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
      if (map[e.key]) {
        e.preventDefault();
        state.keys[map[e.key]] = true;
      }
    }

    function onKeyUp(e) {
      var map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
      if (map[e.key]) {
        state.keys[map[e.key]] = false;
      }
    }

    function gameLoop() {
      if (state.paused || state.completed) return;

      var dx = 0, dy = 0;
      if (state.keys.up) dy -= state.speed;
      if (state.keys.down) dy += state.speed;
      if (state.keys.left) dx -= state.speed;
      if (state.keys.right) dx += state.speed;

      if (dx !== 0 || dy !== 0) {
        var newX = state.avatar.x + dx;
        var newY = state.avatar.y + dy;

        newX = Math.max(0, Math.min(state.bounds.width - 30, newX));
        newY = Math.max(0, Math.min(state.bounds.height - 30, newY));

        var collision = checkCollision(newX, newY);
        if (!collision) {
          state.avatar.x = newX;
          state.avatar.y = newY;
          updateAvatarPosition();
        }

        if (checkTarget()) {
          state.completed = true;
          if (feedback) feedback.showCorrect('¡Llegaste!');
          finish();
          return;
        }
      }

      var raf = (typeof requestAnimationFrame !== 'undefined') ? requestAnimationFrame : (typeof window !== 'undefined' && window.requestAnimationFrame) ? window.requestAnimationFrame : function(cb) { return setTimeout(cb, 16); };
      animFrame = raf(gameLoop);
    }

    function updateAvatarPosition() {
      var avatar = document.getElementById('solo-avatar');
      if (avatar) {
        avatar.style.left = state.avatar.x + 'px';
        avatar.style.top = state.avatar.y + 'px';
      }
    }

    function checkCollision(x, y) {
      for (var i = 0; i < state.obstacles.length; i++) {
        var obs = state.obstacles[i];
        if (x < obs.x + (obs.w || 40) && x + 30 > obs.x && y < obs.y + (obs.h || 40) && y + 30 > obs.y) {
          return true;
        }
      }
      return false;
    }

    function checkTarget() {
      var dx = state.avatar.x - state.target.x;
      var dy = state.avatar.y - state.target.y;
      return Math.sqrt(dx * dx + dy * dy) < 30;
    }

    function finish() {
      if (engine && engine.completeGame) {
        engine.completeGame({ correctAnswers: 1, totalRounds: 1 });
      }
    }

    function pause() { state.paused = true; }
    function resume() { state.paused = false; if (!state.completed) gameLoop(); }

    function destroy() {
      state.completed = true;
      if (animFrame) {
        var caf = (typeof cancelAnimationFrame !== 'undefined') ? cancelAnimationFrame : (typeof window !== 'undefined' && window.cancelAnimationFrame) ? window.cancelAnimationFrame : clearTimeout;
        caf(animFrame);
      }
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      if (container) container.innerHTML = '';
    }

    return {
      start: start,
      pause: pause,
      resume: resume,
      destroy: destroy,
      getState: function () { return Object.assign({}, state); }
    };
  }

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AvatarMovementTemplate };
}
if (typeof window !== 'undefined') {
  window.AvatarMovementTemplate = AvatarMovementTemplate;
}
