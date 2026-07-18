/**
 * resilient-game-asset.js
 * Renderer reutilizable de assets visuales para No Lectores.
 * Muestra el SVG/PNG/WEBP cargado; si falla, muestra el fallback
 * (emoji o forma CSS). Conserva el alt accesible y no provoca
 * layout shift excesivo. Respeta reducedMotion.
 *
 * No duplica esta lógica en los cuatro juegos.
 */

var ResilientGameAsset = (function () {
  'use strict';

  function escapeAttr(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function isReducedMotion(opts) {
    if (opts && typeof opts.reducedMotion === 'boolean') return opts.reducedMotion;
    if (typeof window !== 'undefined' && window.matchMedia) {
      try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
    }
    return false;
  }

  /**
   * Renderiza un nodo de asset dentro de parent.
   * assetDef: { id, src, type, alt, fallback, ok }
   * opts: { reducedMotion, largeTarget, decorative }
   */
  function render(parent, assetDef, opts) {
    opts = opts || {};
    if (!parent) return null;
    if (!assetDef) return null;

    var wrapper = document.createElement('span');
    wrapper.className = 'solo-asset' + (opts.largeTarget ? ' solo-asset--large' : '');
    wrapper.setAttribute('role', 'img');

    var alt = (assetDef.alt != null) ? assetDef.alt : '';
    var decorative = opts.decorative === true;
    wrapper.setAttribute('aria-label', decorative ? '' : alt);

    var fallbackText = (typeof assetDef.fallback === 'string')
      ? assetDef.fallback
      : (assetDef.fallback && assetDef.fallback.emoji ? assetDef.fallback.emoji : '');

    function showFallback(reason) {
      wrapper.innerHTML = '';
      wrapper.classList.add('solo-asset--fallback');
      var fb = document.createElement('span');
      fb.className = 'solo-asset-fallback';
      fb.textContent = fallbackText || (alt ? alt.charAt(0).toUpperCase() : '?');
      wrapper.appendChild(fb);
      wrapper.setAttribute('data-fallback', reason || 'generic');
    }

    var loaded = assetDef.ok !== false && assetDef.src;
    if (!loaded) {
      showFallback('not-loaded');
      parent.appendChild(wrapper);
      return wrapper;
    }

    var img = document.createElement('img');
    img.className = 'solo-asset-img';
    img.alt = decorative ? '' : alt;
    img.setAttribute('loading', 'lazy');
    img.src = assetDef.src;
    if (isReducedMotion(opts)) {
      img.style.transition = 'none';
    }
    img.onload = function () {
      wrapper.setAttribute('data-state', 'loaded');
    };
    img.onerror = function () {
      showFallback('load-error');
    };
    wrapper.appendChild(img);
    parent.appendChild(wrapper);
    return wrapper;
  }

  /**
   * Decora los [data-asset-id] dentro de un contenedor usando un AssetLoader.
   * Reemplaza cada marcador por el asset resuelto (o fallback).
   */
  function decorate(container, loader, opts) {
    opts = opts || {};
    if (!container || !loader) return;
    var nodes = container.querySelectorAll('[data-asset-id]');
    Array.prototype.forEach.call(nodes, function (node) {
      var id = node.getAttribute('data-asset-id');
      var assetDef = loader.getAsset(id);
      if (!assetDef) {
        var fallback = node.getAttribute('data-fallback') || '';
        node.textContent = fallback;
        node.classList.add('solo-asset--fallback');
        return;
      }
      var parent = node.parentNode;
      var replacement = render(parent, assetDef, opts);
      if (replacement && node.parentNode === parent) {
        parent.replaceChild(replacement, node);
      }
    });
  }

  return { render: render, decorate: decorate };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ResilientGameAsset };
}
if (typeof window !== 'undefined') {
  window.ResilientGameAsset = ResilientGameAsset;
}
