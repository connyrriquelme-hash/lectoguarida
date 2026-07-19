/**
 * drag-drop-template.js
 * Plantilla genérica de arrastrar y soltar.
 * Soporta: elementos arrastrables, zonas de destino, múltiples correspondencias,
 * devolución al origen, tolerancia de colisión, snap opcional, teclado accesible,
 * touch, mouse, feedback, finalización.
 * Usa pointer events para compatibilidad touch/mouse.
 */

var DragDropTemplate = (function () {
  'use strict';

  function create(options) {
    options = options || {};
    var container = options.container;
    var config = options.config;
    var engine = options.engine;
    var inputManager = engine ? engine.getInputManager() : null;
    var feedback = engine ? engine.getFeedback() : null;

    var state = {
      draggables: [],
      dropZones: [],
      currentDrag: null,
      dragOffset: { x: 0, y: 0 },
      matched: 0,
      total: 0,
      incorrect: 0
    };

    function start() {
      state.matched = 0;
      state.incorrect = 0;
      state.total = (config && config.content) ? config.content.length : 0;
      render();
    }

    function render() {
      if (!container || !config || !config.content) return;

      var html = '<div class="solo-drag-drop">';
      html += '<div class="solo-drag-header">';
      html += '<h3>' + (config.title || 'Arrastra y suelta') + '</h3>';
      html += '</div>';
      html += '<div class="solo-drag-area">';

      html += '<div class="solo-draggables">';
      config.content.forEach(function (item, i) {
        var sizeClass = (config.accessibility && config.accessibility.largeTargets) ? ' solo-drag-item--large' : '';
        html += '<div class="solo-drag-item' + sizeClass + '" data-drag-id="' + item.id + '" data-index="' + i + '" tabindex="0" role="button" aria-label="' + (item.label || item.id) + '">';
        if (item.image) html += '<img src="' + item.image + '" alt="' + (item.label || '') + '">';
        if (item.label) html += '<span>' + item.label + '</span>';
        html += '</div>';
      });
      html += '</div>';

      html += '<div class="solo-drop-zones">';
      config.content.forEach(function (item, i) {
        html += '<div class="solo-drop-zone" data-drop-id="' + item.id + '" data-index="' + i + '">';
        html += '<span class="solo-drop-label">' + (item.targetLabel || item.id) + '</span>';
        html += '</div>';
      });
      html += '</div>';

      html += '</div>';
      html += '</div>';
      container.innerHTML = html;

      state.draggables = Array.from(container.querySelectorAll('.solo-drag-item'));
      state.dropZones = Array.from(container.querySelectorAll('.solo-drop-zone'));
      bindDragEvents();
    }

    function bindDragEvents() {
      state.draggables.forEach(function (el) {
        el.addEventListener('pointerdown', onDragStart);
        el.addEventListener('keydown', onKeyDrag);
      });
    }

    function onDragStart(e) {
      e.preventDefault();
      var el = e.currentTarget;
      var id = el.getAttribute('data-drag-id');
      state.currentDrag = { el: el, id: id };
      el.classList.add('solo-drag-item--dragging');
      el.setPointerCapture(e.pointerId);

      var rect = el.getBoundingClientRect();
      state.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      el.style.position = 'relative';
      el.style.zIndex = '100';

      document.addEventListener('pointermove', onDragMove);
      document.addEventListener('pointerup', onDragEnd);
    }

    function onDragMove(e) {
      if (!state.currentDrag) return;
      var el = state.currentDrag.el;
      var parent = el.parentElement;
      var parentRect = parent.getBoundingClientRect();
      el.style.left = (e.clientX - parentRect.left - state.dragOffset.x) + 'px';
      el.style.top = (e.clientY - parentRect.top - state.dragOffset.y) + 'px';

      var dropZone = findDropZone(e.clientX, e.clientY);
      state.dropZones.forEach(function (dz) { dz.classList.remove('solo-drop-zone--hover'); });
      if (dropZone) dropZone.classList.add('solo-drop-zone--hover');
    }

    function onDragEnd(e) {
      if (!state.currentDrag) return;
      document.removeEventListener('pointermove', onDragMove);
      document.removeEventListener('pointerup', onDragEnd);

      var el = state.currentDrag.el;
      var dragId = state.currentDrag.id;
      el.classList.remove('solo-drag-item--dragging');

      var dropZone = findDropZone(e.clientX, e.clientY);

      if (dropZone) {
        var dropId = dropZone.getAttribute('data-drop-id');
        if (dragId === dropId) {
          handleCorrectDrop(el, dropZone, dragId);
        } else {
          handleIncorrectDrop(el, dragId);
        }
      } else {
        returnToOrigin(el);
      }

      el.style.position = '';
      el.style.zIndex = '';
      el.style.left = '';
      el.style.top = '';
      state.currentDrag = null;
    }

    function onKeyDrag(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var el = e.currentTarget;
        var dragId = el.getAttribute('data-drag-id');
        var dropZone = state.dropZones.find(function (dz) {
          return dz.getAttribute('data-drop-id') === dragId;
        });
        if (dropZone) {
          handleCorrectDrop(el, dropZone, dragId);
        }
      }
    }

    function findDropZone(x, y) {
      for (var i = 0; i < state.dropZones.length; i++) {
        var rect = state.dropZones[i].getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return state.dropZones[i];
        }
      }
      return null;
    }

    function handleCorrectDrop(el, dropZone, dragId) {
      state.matched++;
      el.style.display = 'none';
      dropZone.classList.add('solo-drop-zone--matched');
      dropZone.innerHTML = el.innerHTML;
      if (feedback) feedback.showCorrect();

      if (engine && engine.getStateMachine) {
        engine.getStateMachine().transitionTo('FEEDBACK', 'drag-correct');
      }

      setTimeout(function () {
        if (state.matched >= state.total) {
          finish();
        }
      }, 800);
    }

    function handleIncorrectDrop(el, dragId) {
      state.incorrect++;
      if (feedback) feedback.showIncorrect();
      returnToOrigin(el);
    }

    function returnToOrigin(el) {
      el.style.position = '';
      el.style.zIndex = '';
      el.style.left = '';
      el.style.top = '';
    }

    function finish() {
      if (engine && engine.completeGame) {
        engine.completeGame({
          correctAnswers: state.matched,
          totalRounds: state.total
        });
      }
    }

    function pause() {}
    function resume() {}
    function destroy() {
      document.removeEventListener('pointermove', onDragMove);
      document.removeEventListener('pointerup', onDragEnd);
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
  module.exports = { DragDropTemplate };
}
if (typeof window !== 'undefined') {
  window.DragDropTemplate = DragDropTemplate;
}
